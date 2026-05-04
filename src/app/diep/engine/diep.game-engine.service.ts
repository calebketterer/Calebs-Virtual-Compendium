import { Injectable } from '@angular/core';
import { Player, Bullet, Enemy, HighScore, TrailSegment, DifficultyMode } from '../core/diep.interfaces';
import { EnemySpawnerService } from '../enemies/diep.enemy-spawner';
import { HighScoresService } from '../core/diep.high-scores.service';
import { DiepCollisionService } from './subsystems/diep.collision.service';
import { DiepWaveManagerService } from './subsystems/diep.wave-manager';
import { DiepProjectileService } from './subsystems/diep.projectile.service';
import { DiepPlayerService } from './subsystems/diep.player.service';
import { DiepEnemyService } from '../enemies/diep.enemy.service';
import { TransitionManager } from '../ui/diep.transition-manager';
import { AchievementService } from '../core/diep.achievement.service';
import { DiepPlayerUpgradesService } from './subsystems/player-upgrades/diep.player-upgrades.service';
import { DiepArenaManager } from './subsystems/diep.arena-manager';
import { DiepHazardDirector } from './subsystems/diep.hazard-director.service';

@Injectable({ providedIn: 'root' })
export class DiepGameEngineService {
    public width = 800;
    public height = 600;
    public player: Player;
    public bullets: Bullet[] = [];
    public enemies: Enemy[] = [];
    public toxicTrails: TrailSegment[] = [];
    public keys: { [key: string]: boolean } = {};
    public score = 0;
    public sessionKills = 0; 
    public gameOver = false;
    public isPaused = false;
    public isDarkMode = true;
    public isStartingNewGame = false;
    public lastAngle = 0;
    public mouseAiming = true;
    public mousePos = { x: 0, y: 0 };
    public mouseDown = false;
    public isGameStarted = false;
    public deathAnimationTimeStart: number | null = null;
    public enemiesRemainingForAnimation: Enemy[] = [];
    public topScores: HighScore[] = [];
    public showingQuadrivium = false;
    public showingAchievements = false;

    public currentDifficulty: DifficultyMode = 'MEDIUM';
    public persistentXp = 0;

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
        public waveManager: DiepWaveManagerService,
        public achievementService: AchievementService,
        private upgradeService: DiepPlayerUpgradesService,
        public arenaManager: DiepArenaManager,
        public hazardDirector: DiepHazardDirector,
    ) {
        this.player = this.playerService.getDefaultPlayer(this.currentDifficulty, this.persistentXp);
        this.topScores = this.highScoresService.getHighScores();
        this.transition.fadeIn();
        this.arenaManager.init(this.width, this.height);
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

        this.transition.update(deltaTime);

        if (!this.isPaused) {
            this.update(deltaTime);
        }

        this.onRenderCallback();

        const isFading = this.transition.opacity > 0 || (this.transition as any).targetOpacity === 1;
        const isDeadAnimating = this.deathAnimationTimeStart !== null;

        if (!this.isGameStarted || (this.isGameStarted && !this.gameOver) || isFading || isDeadAnimating) {
            this.animationFrameId = requestAnimationFrame(this.ticker);
        } else {
            this.animationFrameId = null;
        }
    }

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
        
        this.arenaManager.update(deltaTime);
        if (this.isGameStarted && !this.isPaused && !this.gameOver) {
            this.hazardDirector.update(deltaTime, this.width, this.height);
        }

        if (this.gameOver && this.deathAnimationTimeStart) {
            this.handleDeathAnimation(Date.now());
        }

        if (!this.isGameStarted || this.isPaused || this.gameOver) return;

        // 1. Move Player
        const playerUpdate = this.playerService.update(this.player, this.keys, this.mousePos, this.mouseAiming, this.width, this.height, F, deltaTime);
        this.lastAngle = playerUpdate.lastAngle;
        
        // 2. IMMEDIATE Environment Fix (Prevents Jitter by correcting X/Y before render)
        if (this.collisionService.handleEnvironmentCollision(this.player)) {
            this.handleGameOver();
            return;
        }

        // 3. Move Bullets + Immediate Env Fix
        this.bullets = this.projectileService.updateBullets(this.bullets, F, this.width, this.height, this.player, deltaTime);
        this.bullets.forEach(b => this.collisionService.handleEnvironmentCollision(b, true));

        this.toxicTrails = this.projectileService.updateTrails(this.toxicTrails, this.bullets, this.player, Date.now());

        if (this.mouseAiming && this.mouseDown && this.player.health > 0) {
            this.shootBullet();
        }

        // 4. Update Enemies + Immediate Env Fix
        if (this.player.health > 0) {
            if (this.isStartingNewGame) {
                this.isStartingNewGame = false;
            } else {
                this.enemyService.updateAI(this.enemies, this.bullets, this.player, deltaTime, this.width, this.height);
                this.enemies.forEach(e => this.collisionService.handleEnvironmentCollision(e));
            }
        }

        // 5. Inter-Entity Collisions (Bullets/Enemies/Player)
        const col = this.collisionService.handleCollisions(this.player, this.bullets, this.enemies, (e) => this.killEnemy(e));
        this.bullets = col.bullets;
        this.enemies = col.enemies;

        if (this.player.health <= 0) {
            this.handleGameOver();
            return;
        }

        this.enemies = this.enemyService.cleanup(this.enemies, this.width, this.height);
        this.waveManager.updateWaves(this.enemies, this.width, this.height);
        this.achievementService.updateProgress('WAVE', this.waveManager.waveCount);
        this.player.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.x));
        this.player.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.y));
    }

    public shootBullet() {
        if (this.gameOver || this.isPaused || !this.isGameStarted) return;
        this.projectileService.shootBullet(this.player, this.mousePos, this.mouseAiming, this.lastAngle, this.bullets);
    }

    public resetState(startGameImmediately: boolean) {
        if (this.player) { this.persistentXp = this.player.progression.totalXpEarned; }
        this.player = this.playerService.getDefaultPlayer(this.currentDifficulty, this.persistentXp);
        this.bullets = []; 
        this.enemies = []; 
        this.toxicTrails = [];
        this.score = 0; 
        this.sessionKills = 0; 
        this.gameOver = false; 
        this.isPaused = false;
        this.lastAngle = 0; 
        this.isGameStarted = startGameImmediately;
        this.isStartingNewGame = startGameImmediately;
        this.waveManager.reset();
        this.projectileService.resetCooldown();
        this.topScores = this.highScoresService.getHighScores();
        this.showingQuadrivium = false;
        this.showingAchievements = false;
        this.arenaManager.init(this.width, this.height);
    }

    public killEnemy(enemy: Enemy) {
        this.score += enemy.scoreValue;
        this.sessionKills++; 
        this.upgradeService.addXp(this.player.progression, enemy.scoreValue);
        enemy.onDeath?.(this.enemies, this.spawner, enemy, this.player);
        enemy.health = 0;
        const meta = (enemy as any).metadata || {};
        this.achievementService.incrementKills(enemy.type, meta.faction, this.sessionKills);
        this.achievementService.updateProgress('SCORE', this.score);
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