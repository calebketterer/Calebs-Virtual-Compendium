import { Injectable } from '@angular/core';
import { Player, Bullet, Enemy, HighScore, TrailSegment } from '../diep.interfaces';
import { EnemySpawnerService } from './subsystems/diep.enemy-spawner';
import { HighScoresService } from '../diep.high-scores.service';
import { DiepCollisionService } from './subsystems/diep.collision.service';
import { DiepWaveManagerService } from './subsystems/diep.wave-manager';
import { DiepProjectileService } from './subsystems/diep.projectile.service';
import { DiepPlayerService } from './subsystems/diep.player.service';
import { DiepEnemyService } from './subsystems/diep.enemy.service';
import { TransitionManager } from '../ui/diep.transition-manager';

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
    public showingQuadrivium = false;

    // Initialize TransitionManager - Starts at opacity 1 for the initial load fade
    public transition = new TransitionManager();

    private animationFrameId: number | null = null;
    private lastTime: number = 0;
    private onRenderCallback: () => void = () => {};

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
        // Immediately trigger the fade-in from black
        this.transition.fadeIn();
    }

    private getDefaultPlayer(): Player {
        return { x: 400, y: 300, radius: 20, angle: 0, maxSpeed: 3, color: '#3498db', health: 100, maxHealth: 100, fireRate: 150 };
    }

    public startTicker(renderFn: () => void) {
        this.onRenderCallback = renderFn;
        this.lastTime = performance.now();
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.ticker(this.lastTime);
    }

    private ticker = (time: number) => {
        let deltaTime = time - this.lastTime;
        if (this.lastTime === 0 || deltaTime > 100) {
            deltaTime = 1000 / 60;
        }
        this.lastTime = time;

        // Process transition heartbeat
        this.transition.update(deltaTime);

        if (!this.isPaused) {
            this.update(deltaTime);
        }

        this.onRenderCallback();

        // Keep loop alive if:
        // 1. Game is running
        // 2. We are in the middle of a fade (intro or between screens)
        // 3. We are in the start menu (allows the initial fade-in to happen)
        const isFading = this.transition.opacity > 0 || (this.transition as any).targetOpacity === 1;
        const isDeadAnimating = this.deathAnimationTimeStart !== null;

        if (!this.isGameStarted || (this.isGameStarted && !this.gameOver) || isFading || isDeadAnimating) {
            this.animationFrameId = requestAnimationFrame(this.ticker);
        } else {
            this.animationFrameId = null;
        }
    }

    // --- FADE WRAPPERS ---

    public startGameWithFade() {
        this.transition.fadeOut(() => {
            this.resetState(true);
            this.waveManager.startFirstWave(this.enemies, this.width, this.height);
        });
        if (!this.animationFrameId) this.startTicker(this.onRenderCallback);
    }

    public restartGameWithFade() {
        this.transition.fadeOut(() => {
            this.resetState(true);
            this.waveManager.startFirstWave(this.enemies, this.width, this.height);
        });
        if (!this.animationFrameId) this.startTicker(this.onRenderCallback);
    }

    public returnToMainMenuWithFade() {
        this.transition.fadeOut(() => {
            this.resetState(false);
        });
        if (!this.animationFrameId) this.startTicker(this.onRenderCallback);
    }

    public update(deltaTime: number) {
        const F = deltaTime / (1000 / 60);
        
        if (this.gameOver && this.deathAnimationTimeStart) {
            this.handleDeathAnimation(Date.now());
        }

        if (!this.isGameStarted || this.isPaused || this.gameOver) return;

        const playerUpdate = this.playerService.update(this.player, this.keys, this.mousePos, this.mouseAiming, this.width, this.height, F, deltaTime);
        this.lastAngle = playerUpdate.lastAngle;

        this.bullets = this.projectileService.updateBullets(this.bullets, F, this.width, this.height, this.player, deltaTime);
        this.toxicTrails = this.projectileService.updateTrails(this.toxicTrails, this.bullets, this.player, Date.now());

        if (this.mouseAiming && this.mouseDown && this.player.health > 0) {
            this.shootBullet();
        }

        if (this.player.health > 0) {
            if (this.isStartingNewGame) {
                this.isStartingNewGame = false;
            } else {
                this.enemyService.updateAI(this.enemies, this.bullets, this.player, deltaTime, this.width, this.height);
            }
        }

        const col = this.collisionService.handleCollisions(this.player, this.bullets, this.enemies, (e) => this.killEnemy(e));
        this.bullets = col.bullets;
        this.enemies = col.enemies;

        if (this.player.health <= 0) {
            this.handleGameOver();
            return;
        }

        this.enemies = this.enemyService.cleanup(this.enemies, this.width, this.height);
        this.waveManager.updateWaves(this.enemies, this.width, this.height);
    }

    public resetState(startGameImmediately: boolean) {
        this.player = this.getDefaultPlayer();
        this.bullets = []; 
        this.enemies = []; 
        this.toxicTrails = [];
        this.score = 0; 
        this.gameOver = false; 
        this.isPaused = false;
        this.lastAngle = 0; 
        this.lastShotTime = 0;
        this.isGameStarted = startGameImmediately;
        this.isStartingNewGame = startGameImmediately;
        this.waveManager.reset();
        this.topScores = this.highScoresService.getHighScores();
        this.showingQuadrivium = false;
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
            dx: Math.cos(angle) * 8, 
            dy: Math.sin(angle) * 8,
            radius: 6, color: '#f39c12', ownerType: 'PLAYER'
        });
    }

    public killEnemy(enemy: Enemy) {
        this.score += enemy.scoreValue;
        enemy.onDeath?.(this.enemies, this.spawner, enemy, this.player);
        enemy.health = 0;
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

    public togglePause() { 
        if (!this.gameOver && this.isGameStarted) {
            this.isPaused = !this.isPaused;
            if (!this.isPaused) this.startTicker(this.onRenderCallback);
        }
        return this.isPaused; 
    }

    public toggleDarkMode() { this.isDarkMode = !this.isDarkMode; }
    
    public getVisibleEnemies(): Enemy[] {
        if (this.gameOver && this.deathAnimationTimeStart !== null) {
            const timeElapsed = Date.now() - this.deathAnimationTimeStart;
            const enemiesToDisappear = Math.floor((timeElapsed / 1000) * this.enemiesRemainingForAnimation.length);
            return this.enemiesRemainingForAnimation.slice(enemiesToDisappear);
        }
        return this.enemies;
    }
}