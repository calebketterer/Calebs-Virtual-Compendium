import { Injectable } from '@angular/core';
import { Player, Bullet, Enemy, HighScore } from './diep.interfaces'; // Assumed dependency
import { EnemySpawnerService } from './diep.enemy-spawner'; // Assumed dependency
import { DiepEnemyLogic } from './diep.enemy-logic'; // Assumed dependency
import { HighScoresService } from './diep.high-scores.service'; // Assumed dependency

/**
 * DiepGameEngineService
 * * Manages the entire game state, physics calculations, collision detection, 
 * wave progression, and game control logic (start/pause/reset).
 * The DiepComponent will only act as the view/input layer, delegating all 
 * updates and input-triggered actions to this service.
 */
@Injectable({
	providedIn: 'root'
})
export class DiepGameEngineService {
	// ---------------------------------------------
	// --- Game State Properties (Moved from Component) ---
	// ---------------------------------------------

	// Game Constants (Access from component, but managed here)
	public width = 800;
	public height = 600;

	// Primary Game State
	public player: Player = {
		x: 400, y: 300, radius: 20, angle: 0,
		maxSpeed: 3, color: '#3498db', health: 100,
		maxHealth: 100, fireRate: 150
	};
	public bullets: Bullet[] = [];
	public enemies: Enemy[] = [];
	public keys: { [key: string]: boolean } = {}; // Keyboard state is managed here but updated by the component
	public score = 0;
	public gameOver = false;
	public isPaused = false;
	public isDarkMode = true;
	public isStartingNewGame: boolean = false; // NEW: Flag to skip AI on the first frame of a new game.

	// Aiming/Shooting State
	public lastAngle = 0;
	public mouseAiming = true;
	public mousePos = { x: 0, y: 0 }; // Mouse position updated by the component
	public mouseDown = false; // Mouse button state updated by the component
	private lastShotTime: number = 0;

	// Wave/Progression State
	private enemySpawnCount = 5;
	public waveCount: number = 0;
	public isRegularWaveActive: boolean = false;
	public isGameStarted: boolean = false;

	// Death Animation State
	public deathAnimationTimeStart: number | null = null;
	private deathAnimationDuration = 1000;
	public enemiesRemainingForAnimation: Enemy[] = [];

	// UI State
	public topScores: HighScore[] = [];

	// DELETED: private lastTime property (now managed by component)

	constructor(
		private spawner: EnemySpawnerService,
		private highScoresService: HighScoresService
	) {
		// Load high scores immediately for display on the Start Menu and Pause Menu.
		this.topScores = this.highScoresService.getHighScores();
	}

	// ---------------------------------------------
	// --- Game Control Functions (Moved from Component) ---
	// ---------------------------------------------

	/**
	 * Resets all primary game state variables to their initial values.
	 * @param startGameImmediately If true, sets isGameStarted to true to begin gameplay.
	 */
	public resetState(startGameImmediately: boolean) {
		this.player = {
			x: 400, y: 300, radius: 20, angle: 0,
			maxSpeed: 3, color: '#3498db', health: 100,
			maxHealth: 100, fireRate: 150
		};
		this.bullets = [];
		this.enemies = [];
		this.keys = {};
		this.score = 0;
		this.gameOver = false;
		this.isPaused = false;
		this.lastAngle = 0;
		this.mouseAiming = true;
		this.mouseDown = false;
		this.lastShotTime = 0;
		this.enemySpawnCount = 5;
		this.waveCount = 0;
		this.deathAnimationTimeStart = null;
		this.enemiesRemainingForAnimation = [];
		this.isRegularWaveActive = false;
		this.isGameStarted = startGameImmediately;
		this.isStartingNewGame = startGameImmediately; // NEW: Set flag on start

		// Re-fetch scores immediately to ensure the latest list is available for display.
		this.topScores = this.highScoresService.getHighScores();
	}

	/**
	 * Initializes the game after the start button is clicked.
	 */
	public startGame() {
		if (this.isGameStarted) return;

		this.isGameStarted = true;
		this.isStartingNewGame = true; // NEW: Set flag on start
		// DELETED: lastTime initialization (now handled by component)

		// Perform initial enemy spawn
		this.spawner.spawnEnemies(
			this.enemies,
			this.enemySpawnCount,
			false,
			this.waveCount,
			this.width,
			this.height
		);
	}

	/**
	 * Resets the game state and starts a new game immediately.
	 */
	public restartGame() {
		this.resetState(true);
		this.spawner.spawnEnemies(
			this.enemies,
			this.enemySpawnCount,
			false,
			this.waveCount,
			this.width,
			this.height
		);
	}

	/**
	 * Resets the game state and returns to the initial Start Menu.
	 */
	public returnToMainMenu() {
		this.resetState(false);
	}

	/**
	 * Toggles the pause state of the game.
	 * @returns boolean indicating the new pause state.
	 */
	public togglePause(): boolean {
		if (this.gameOver || !this.isGameStarted) return this.isPaused;

		this.isPaused = !this.isPaused;
		if (!this.isPaused) {
			// DELETED: lastTime reset (now handled by component)
		}
		return this.isPaused;
	}

	/**
	 * Toggles the light/dark theme.
	 */
	public toggleDarkMode() {
		this.isDarkMode = !this.isDarkMode;
	}

	// ---------------------------------------------
	// --- Game Logic Functions (Moved from Component) ---
	// ---------------------------------------------

	public shootBullet() {
		if (this.gameOver || this.isPaused || !this.isGameStarted) return;
		const now = Date.now();
		if (now - this.lastShotTime < this.player.fireRate) {
			return;
		}
		this.lastShotTime = now;

		const speed = 8;
		let angle = this.player.angle;

		// Determine the angle based on aiming mode
		if (this.mouseAiming) {
			angle = Math.atan2(this.mousePos.y - this.player.y, this.mousePos.x - this.player.x);
		} else {
			angle = this.lastAngle;
		}

		const barrelLength = this.player.radius * 2.0;

		this.bullets.push({
			x: this.player.x + Math.cos(angle) * barrelLength,
			y: this.player.y + Math.sin(angle) * barrelLength,
			dx: Math.cos(angle) * speed,
			dy: Math.sin(angle) * speed,
			radius: 6,
			color: '#f39c12',
			ownerType: 'PLAYER'
		});
	}

	public killEnemy(enemy: Enemy) {
		this.score += enemy.scoreValue;
		enemy.health = 0;
	}

	// ---------------------------------------------
	// --- Game Loop Update Logic (The new core) ---
	// ---------------------------------------------

	/**
	 * The primary physics and logic update function, called by the component's game loop.
	 * @param deltaTime The time elapsed since the last frame (in milliseconds).
	 */
	public update(deltaTime: number) { // MODIFIED: Accepts deltaTime from component

		// --- Delta Time Normalization ---
		const FPS_60_TIME = 1000 / 60; // Approx 16.666ms
		const F = deltaTime / FPS_60_TIME;

		// Handle Death Animation regardless of pause state, but only if running
		if (this.gameOver && this.deathAnimationTimeStart !== null) {
			this.handleDeathAnimation(Date.now());
		}

		// 0.1 Guard: Stop all game logic/physics if not started, paused, or awaiting game over screen
		if (!this.isGameStarted || this.isPaused || this.gameOver) return;

		// --- START: Core Game Logic (Runs ONLY if game is active) ---

		// 1. Player Movement & Rotation (Safe to run before damage calculation)
		let moved = false;
		let dx = 0, dy = 0;
		if (this.keys['w']) { dy -= 1; moved = true; }
		if (this.keys['s']) { dy += 1; moved = true; }
		if (this.keys['a']) { dx -= 1; moved = true; }
		if (this.keys['d']) { dx += 1; moved = true; }

		if (moved) {
			const len = Math.sqrt(dx * dx + dy * dy);
			if (len > 0) {
				// SCALED: Movement speed multiplied by the normalization factor (F)
				this.player.x += (dx / len) * this.player.maxSpeed * F;
				this.player.y += (dy / len) * this.player.maxSpeed * F;

				if (!this.mouseAiming) {
					const newAngle = Math.atan2(dy, dx);
					if (!isNaN(newAngle)) {
						this.player.angle = newAngle;
						this.lastAngle = newAngle;
					}
				}
			}
		}

		if (this.mouseAiming) {
			this.player.angle = Math.atan2(this.mousePos.y - this.player.y, this.mousePos.x - this.player.x);
		}

		// Clamp player position (prevent going off-screen)
		this.player.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.x));
		this.player.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.y));

		// Player Health Regeneration
		this.player.health = Math.min(this.player.maxHealth, this.player.health + (0.5 * deltaTime / 1000));

		// 2. Bullets Update (Safe to run before damage calculation)
		this.bullets.forEach(bullet => {
			bullet.x += bullet.dx * F;
			bullet.y += bullet.dy * F;
		});
		this.bullets = this.bullets.filter(b => b.x > 0 && b.x < this.width && b.y > 0 && b.y < this.height);

		// 3. Mouse Aiming: Auto-fire when mouse is down
		// CRITICAL FIX: Ensure no auto-fire happens on the death frame
		if (this.mouseAiming && this.mouseDown && this.player.health > 0) {
			this.shootBullet();
		}

		// 4. Enemy AI: Move toward player, Boss Regen, & Other Enemy Logic
		// CRITICAL FIX: Skip enemy movement/AI if player health is zero 
		// New logic: Skip enemy movement/AI on the very first frame of a new game to prevent jump-start movement.
		if (this.player.health > 0) {
			if (this.isStartingNewGame) {
				this.isStartingNewGame = false; // Clear the flag after the first frame check
			} else {
				DiepEnemyLogic.updateAllEnemies(
					this.enemies,
					this.bullets,
					this.player,
					deltaTime,
					this.width,
					this.height,
					performance.now()
				);
			}
		}

		// 5. Collision Detection (Bullets vs Enemies) - Damage starts here
		const newBullets: Bullet[] = [];

		this.bullets.forEach(bullet => {
			let hit = false;
			this.enemies.forEach(enemy => {
				if (bullet.ownerType === 'ENEMY') {
					return;
				}
				const dx = bullet.x - enemy.x;
				const dy = bullet.y - enemy.y;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist < bullet.radius + enemy.radius) {
					enemy.health -= 15;
					hit = true;

					if (enemy.isBoss && Math.random() < 0.5) {
						this.spawner.spawnBossMinion(this.enemies, enemy.x, enemy.y);
					}

					if (enemy.health <= 0) this.score += enemy.scoreValue;
				}
			});
			if (!hit) {
				newBullets.push(bullet);
			}
		});
		this.bullets = newBullets;

		// 5.5 Collision Detection (Enemy Bullets vs Player)
		const playerHitBullets: Bullet[] = [];
		let playerHit = false;

		this.bullets.forEach(bullet => {
			if (bullet.ownerType === 'ENEMY') {
				const dx = bullet.x - this.player.x;
				const dy = bullet.y - this.player.y;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist < bullet.radius + this.player.radius) {
					this.player.health -= 10;
					playerHit = true;
				} else {
					playerHitBullets.push(bullet);
				}
			} else {
				playerHitBullets.push(bullet);
			}
		});

		this.bullets = playerHitBullets;

		// 6. Player-Enemy Collision (Damage)
		const enemiesToKeep: Enemy[] = [];
		const collisionDamageFraction = 0.25;

		this.enemies.forEach(enemy => {
			const dx = enemy.x - this.player.x;
			const dy = enemy.y - this.player.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist < enemy.radius + this.player.radius) {
				const damageToPlayer = enemy.health * collisionDamageFraction;
				this.player.health -= damageToPlayer;
				this.killEnemy(enemy);
			} else {
				enemiesToKeep.push(enemy);
			}
		});
		this.enemies = enemiesToKeep;

		// 6.5 Aura Enemy Proximity Damage (AoE)
		const auraDamage = 0.5;
		const auraRadius = 100;

		this.enemies.forEach(enemy => {
			if (enemy.type === 'AURA') {
				const dx = enemy.x - this.player.x;
				const dy = enemy.y - this.player.y;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist < enemy.radius + auraRadius) {
					this.player.health -= auraDamage;
				}
			}
		});

		// 7. GAME OVER CHECK & IMMEDIATE EXIT:
		// Check player health immediately after all damage calculation.
		if (this.player.health <= 0) {
			this.handleGameOver();
			return; // <<< Critical: Immediately stop all subsequent logic (like spawning)
		}
		
		// 8. Post-Collision Cleanup & Wave Progression
		// This block only runs if the player is still alive (health > 0)
		this.enemies = this.enemies.filter(e => e.health > 0);

		const hasRegularEnemies = this.enemies.some(e => e.color === '#e74c3c');
		const hasBossOrMinions = this.enemies.some(e => e.isBoss || e.color === '#d2b4de');

		if (this.enemies.length === 0) {
			this.enemySpawnCount++;
			this.waveCount++;
			this.isRegularWaveActive = false;
			this.spawner.spawnEnemies(
				this.enemies,
				this.enemySpawnCount,
				false,
				this.waveCount,
				this.width,
				this.height
			);
		} else if (this.isRegularWaveActive && !hasRegularEnemies) {
			this.enemySpawnCount++;
			this.waveCount++;
			this.isRegularWaveActive = false;
			this.spawner.spawnEnemies(this.enemies, this.enemySpawnCount, hasBossOrMinions, this.waveCount, this.width, this.height);
		}
	}
	
	/**
	 * Consolidates the game over logic into a single method.
	 */
	private handleGameOver() {
		if (this.player.health <= 0 && !this.gameOver) {
			this.highScoresService.addHighScore(this.score);
			this.topScores = this.highScoresService.getHighScores();
			
			this.player.health = 0;
			this.gameOver = true;
			this.deathAnimationTimeStart = Date.now();
			// Capture all active enemies for the visual explosion/disappearance animation
			this.enemiesRemainingForAnimation = [...this.enemies]; 
			this.enemies = []; // Clear active enemies from the logic array immediately
		}
	}

	/**
	 * Slowly clears remaining enemies from the screen after player death.
	 */
	public handleDeathAnimation(now: number) {
		if (this.deathAnimationTimeStart === null) return;

		const timeElapsed = now - this.deathAnimationTimeStart;

		if (timeElapsed >= this.deathAnimationDuration) {
			this.enemiesRemainingForAnimation = [];
			this.deathAnimationTimeStart = null;
		}
	}
}
