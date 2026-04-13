import { Injectable, Inject } from '@angular/core';
import { Bullet, Enemy } from '../diep.interfaces';
import { EnemySpawnerService } from './diep.enemy-spawner';
import { DiepEnemyLogic } from '../diep.enemy-logic';
import { HighScoresService } from './diep.high-scores.service';

// Subfolder imports
import { GameStateManager } from './state/game-state.manager';
import { PhysicsService } from './engine/physics.service';
import { ProjectileManagerService } from './engine/projectile.service';
import { AnimationManagerService } from './engine/animation.service';

@Injectable({
  providedIn: 'root'
})
export class DiepGameEngineService {
  private lastShotTime = 0;

  constructor(
    @Inject(GameStateManager) public state: GameStateManager,
    private physics: PhysicsService,
    private projectiles: ProjectileManagerService,
    private animations: AnimationManagerService,
    private spawner: EnemySpawnerService,
    private highScores: HighScoresService
  ) {
    this.state.topScores = this.highScores.getHighScores();
  }

  public update(deltaTime: number) {
    const F = this.physics.getNormalizationFactor(deltaTime);
    const now = Date.now();

    // 1. Handle Death Animation
    if (this.state.gameOver && this.state.deathAnimationTimeStart !== null) {
      const anim = this.animations.handleDeathAnimation(now, this.state.deathAnimationTimeStart, this.state.enemiesRemainingForAnimation);
      this.state.deathAnimationTimeStart = anim.startTime;
      this.state.enemiesRemainingForAnimation = anim.remainingEnemies;
    }

    if (!this.state.isGameStarted || this.state.isPaused || this.state.gameOver) return;

    // 2. Movement & Projectiles
    this.updatePlayerMovement(F, deltaTime);
    this.state.bullets = this.projectiles.updateBullets(this.state.bullets, F, this.state.width, this.state.height);
    this.projectiles.createToxicTrail(this.state.bullets, this.state.toxicTrails, now);
    this.physics.updateToxicTrails(this.state.toxicTrails, this.state.player, now);

    if (this.state.mouseAiming && this.state.mouseDown && this.state.player.health > 0) {
      this.handleShooting(now);
    }

    // 3. Enemy AI
    this.updateEnemyAI(deltaTime);

    // 4. Collisions
    this.handleCollisions();

    // 5. Progression
    this.checkWaveProgression();
  }

  private updatePlayerMovement(F: number, deltaTime: number) {
    let dx = 0, dy = 0;
    if (this.state.keys['w']) dy -= 1;
    if (this.state.keys['s']) dy += 1;
    if (this.state.keys['a']) dx -= 1;
    if (this.state.keys['d']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      this.state.player.x += (dx / len) * this.state.player.maxSpeed * F;
      this.state.player.y += (dy / len) * this.state.player.maxSpeed * F;
      if (!this.state.mouseAiming) this.state.player.angle = Math.atan2(dy, dx);
    }

    if (this.state.mouseAiming) {
      this.state.player.angle = Math.atan2(this.state.mousePos.y - this.state.player.y, this.state.mousePos.x - this.state.player.x);
    }

    this.physics.clampPosition(this.state.player, this.state.width, this.state.height);
    this.state.player.health = Math.min(this.state.player.maxHealth, this.state.player.health + (0.5 * deltaTime / 1000));
  }

  private handleShooting(now: number) {
    if (now - this.lastShotTime >= this.state.player.fireRate) {
      const bullet = this.projectiles.fireBullet(this.state.player, this.state.mousePos, this.state.mouseAiming, this.state.lastAngle);
      this.state.bullets.push(bullet);
      this.lastShotTime = now;
    }
  }

  private updateEnemyAI(deltaTime: number) {
    if (this.state.player.health > 0) {
      if (this.state.isStartingNewGame) {
        this.state.isStartingNewGame = false;
      } else {
        DiepEnemyLogic.updateAllEnemies(
          this.state.enemies, this.state.bullets, this.state.player, 
          deltaTime, this.state.width, this.state.height, performance.now()
        );
      }
    }
  }

  private handleCollisions() {
    this.state.bullets = this.state.bullets.filter((bullet: Bullet) => {
      if (bullet.ownerType === 'ENEMY') {
        if (this.physics.checkCircleCollision(bullet, this.state.player)) {
          this.state.player.health -= 10;
          return false;
        }
        return true;
      }

      let hit = false;
      this.state.enemies.forEach((enemy: Enemy) => {
        if (this.physics.checkCircleCollision(bullet, enemy)) {
          enemy.health -= 15;
          hit = true;
          if (enemy.isBoss && Math.random() < 0.5) this.spawner.spawnBossMinion(this.state.enemies, enemy.x, enemy.y);
          if (enemy.health <= 0) this.state.score += enemy.scoreValue;
        }
      });
      return !hit;
    });

    this.state.enemies = this.state.enemies.filter((enemy: Enemy) => {
      if (this.physics.checkCircleCollision(enemy, this.state.player)) {
        this.state.player.health -= (enemy.health * 0.25);
        enemy.health = 0;
        return false;
      }
      return true;
    });

    if (this.state.player.health <= 0) this.handleGameOver();
  }

  private checkWaveProgression() {
    this.state.enemies = this.state.enemies.filter(e => e.health > 0);
    if (this.state.enemies.length === 0) {
      this.state.enemySpawnCount++;
      this.state.waveCount++;
      this.spawner.spawnEnemies(this.state.enemies, this.state.enemySpawnCount, false, this.state.waveCount, this.state.width, this.state.height);
    }
  }

  private handleGameOver() {
    if (!this.state.gameOver) {
      this.state.gameOver = true;
      this.state.player.health = 0;
      this.state.deathAnimationTimeStart = Date.now();
      this.state.enemiesRemainingForAnimation = [...this.state.enemies];
      this.state.enemies = [];
      this.highScores.addHighScore(this.state.score);
      this.state.topScores = this.highScores.getHighScores();
    }
  }

  public resetState(startGameImmediately: boolean) {
    this.state.resetToDefaults();
    this.state.isGameStarted = startGameImmediately;
    this.state.isStartingNewGame = startGameImmediately;
    this.state.topScores = this.highScores.getHighScores();
  }

  public startGame() {
    if (this.state.isGameStarted) return;
    this.state.isGameStarted = true;
    this.state.isStartingNewGame = true;
    this.spawner.spawnEnemies(this.state.enemies, this.state.enemySpawnCount, false, this.state.waveCount, this.state.width, this.state.height);
  }

  public togglePause(): boolean {
    if (!this.state.gameOver && this.state.isGameStarted) {
      this.state.isPaused = !this.state.isPaused;
    }
    return this.state.isPaused;
  }
}