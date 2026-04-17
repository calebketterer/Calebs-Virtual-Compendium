import { Injectable } from '@angular/core';
import { Player, Bullet, Enemy, HighScore, TrailSegment } from './diep.interfaces';
import { EnemySpawnerService } from './diep.enemy-spawner';
import { HighScoresService } from './diep.high-scores.service';
import { DiepCollisionService } from './engine-subsystems/diep.collision.service';
import { DiepWaveManagerService } from './engine-subsystems/diep.wave-manager.service';
import { DiepProjectileService } from './engine-subsystems/diep.projectile.service';
import { DiepPlayerService } from './engine-subsystems/diep.player.service';
import { DiepEnemyService } from './engine-subsystems/diep.enemy.service';

@Injectable({ providedIn: 'root' })
export class DiepGameEngineService {
    public width = 800;
    public height = 600;
    public player: Player = this.getDefaultPlayer();
    public bullets: Bullet[] = [];
    public enemies: Enemy[] = [];
    public toxicTrails: TrailSegment[] = [];
    public keys: { [key: string]: boolean } = {};
    public score = 0;
    public gameOver = false;
    public isPaused = false;
    public isDarkMode = true;
    public isStartingNewGame = false;
    public lastAngle = 0;
    public mouseAiming = true;
    public mousePos = { x: 0, y: 0 };
    public mouseDown = false;
    private lastShotTime = 0;
    public isGameStarted = false;
    public deathAnimationTimeStart: number | null = null;
    public enemiesRemainingForAnimation: Enemy[] = [];
    public topScores: HighScore[] = [];

    constructor(
        private spawner: EnemySpawnerService,
        private highScoresService: HighScoresService,
        private collisionService: DiepCollisionService,
        private projectileService: DiepProjectileService,
        private playerService: DiepPlayerService,
        private enemyService: DiepEnemyService,
        public waveManager: DiepWaveManagerService
    ) {
        this.topScores = this.highScoresService.getHighScores();
    }

    private getDefaultPlayer(): Player {
        return { x: 400, y: 300, radius: 20, angle: 0, maxSpeed: 3, color: '#3498db', health: 100, maxHealth: 100, fireRate: 150 };
    }

    public resetState(startGameImmediately: boolean) {
        this.player = this.getDefaultPlayer();
        this.bullets = []; this.enemies = []; this.toxicTrails = [];
        this.score = 0; this.gameOver = false; this.isPaused = false;
        this.lastAngle = 0; this.lastShotTime = 0;
        this.isGameStarted = startGameImmediately;
        this.isStartingNewGame = startGameImmediately;
        this.waveManager.reset();
        this.topScores = this.highScoresService.getHighScores();
    }

    public startGame() {
        if (this.isGameStarted) return;
        this.isGameStarted = true;
        this.isStartingNewGame = true;
        this.waveManager.startFirstWave(this.enemies, this.width, this.height);
    }

    public shootBullet() {
        if (this.gameOver || this.isPaused || !this.isGameStarted) return;
        const now = Date.now();
        if (now - this.lastShotTime < this.player.fireRate) return;
        this.lastShotTime = now;

        const angle = this.mouseAiming ? Math.atan2(this.mousePos.y - this.player.y, this.mousePos.x - this.player.x) : this.lastAngle;
        const barrelLength = this.player.radius * 2.0;

        this.bullets.push({
            x: this.player.x + Math.cos(angle) * barrelLength,
            y: this.player.y + Math.sin(angle) * barrelLength,
            dx: Math.cos(angle) * 8, dy: Math.sin(angle) * 8,
            radius: 6, color: '#f39c12', ownerType: 'PLAYER'
        });
    }

    public killEnemy(enemy: Enemy) {
        this.score += enemy.scoreValue;
        enemy.onDeath?.(this.enemies, this.spawner, enemy, this.player);
        enemy.health = 0;
    }

    public update(deltaTime: number) {
        const F = deltaTime / (1000 / 60);
        if (this.gameOver && this.deathAnimationTimeStart) this.handleDeathAnimation(Date.now());
        if (!this.isGameStarted || this.isPaused || this.gameOver) return;

        // 1. Subsystem: Player
        const playerUpdate = this.playerService.update(this.player, this.keys, this.mousePos, this.mouseAiming, this.width, this.height, F, deltaTime);
        this.lastAngle = playerUpdate.lastAngle;

        // 2. Subsystem: Projectiles & Environment
        this.bullets = this.projectileService.updateBullets(
            this.bullets, 
            F, 
            this.width, 
            this.height, 
            this.player,
            deltaTime
        );
        this.toxicTrails = this.projectileService.updateTrails(this.toxicTrails, this.bullets, this.player, Date.now());

        // 3. Auto-fire
        if (this.mouseAiming && this.mouseDown && this.player.health > 0) this.shootBullet();

        // 4. Subsystem: Enemy AI
        if (this.player.health > 0) {
            if (this.isStartingNewGame) this.isStartingNewGame = false;
            else this.enemyService.updateAI(this.enemies, this.bullets, this.player, deltaTime, this.width, this.height);
        }

        // 5. Subsystem: Collision Physics
        const col = this.collisionService.handleCollisions(this.player, this.bullets, this.enemies, (e) => this.killEnemy(e));
        this.bullets = col.bullets;
        this.enemies = col.enemies;

        if (this.player.health <= 0) { this.handleGameOver(); return; }

        // 6. Cleanup & Wave Progression
        this.enemies = this.enemyService.cleanup(this.enemies, this.width, this.height);
        this.waveManager.updateWaves(this.enemies, this.width, this.height);
    }

    private handleGameOver() {
        if (this.player.health <= 0 && !this.gameOver) {
            this.highScoresService.addHighScore(this.score);
            this.topScores = this.highScoresService.getHighScores();
            this.player.health = 0;
            this.gameOver = true;
            this.deathAnimationTimeStart = Date.now();
            this.enemiesRemainingForAnimation = [...this.enemies]; 
            this.enemies = []; 
        }
    }

    public handleDeathAnimation(now: number) {
        if (!this.deathAnimationTimeStart) return;
        if (now - this.deathAnimationTimeStart >= 1000) {
            this.enemiesRemainingForAnimation = [];
            this.deathAnimationTimeStart = null;
        }
    }

    public restartGame() { this.resetState(true); this.waveManager.startFirstWave(this.enemies, this.width, this.height); }
    public returnToMainMenu() { this.resetState(false); }
    public togglePause() { if (!this.gameOver && this.isGameStarted) this.isPaused = !this.isPaused; return this.isPaused; }
    public toggleDarkMode() { this.isDarkMode = !this.isDarkMode; }
}