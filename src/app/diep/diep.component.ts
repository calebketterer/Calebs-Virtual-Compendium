import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player, Bullet, Enemy, EnemyType } from './diep.interfaces';
import { EnemySpawnerService } from './diep.enemy-spawner';
import { DiepMenus } from './diep.menus';
import { DiepEntities } from './diep.entities';
import { DiepEnemyLogic } from './diep.enemy-logic';

@Component({
  selector: 'app-diep',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diep.component.html',
  styleUrls: ['./diep.component.css'], 
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class DiepComponent implements AfterViewInit { 
  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number = 0;

  // Game Constants
  width = 800;
  height = 600;

  // Time tracking for accurate game loop calculations
  private lastTime = performance.now(); 

  // Game State Properties
  player: Player = { 
    x: 400, y: 300, radius: 20, angle: 0, 
    maxSpeed: 3, color: '#3498db', health: 100, 
    maxHealth: 100, fireRate: 150 
  };
  
  bullets: Bullet[] = [];
  enemies: Enemy[] = [];
  keys: { [key: string]: boolean } = {};
  score = 0;
  gameOver = false;
  lastAngle = 0; 
  mouseAiming = true; 
  mousePos = { x: 0, y: 0 };
  mouseDown = false;
  isPaused = false; 
  isDarkMode = true; 
  public mouseX: number = 0;
  public mouseY: number = 0; 
  // NEW: State to control when the game logic starts
  isGameStarted: boolean = false; 
  
  // New state variables for wave progression
  isRegularWaveActive: boolean = false; 

  private lastShotTime: number = 0; 
  private enemySpawnCount = 5;
  public currentWave: number = 0; // Initialize to 0 or 1, depending on your game's starting logic
  public waveCount: number = 0; // Assuming this tracks enemies remaining, as seen in your code snippet

  // Death Animation State
  private deathAnimationTimeStart: number | null = null;
  private deathAnimationDuration = 1000; 
  private enemiesRemainingForAnimation: Enemy[] = [];

  constructor(
        private spawner: EnemySpawnerService 
    ) { }

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    // Initial enemy spawn logic removed. Game starts only after clicking START GAME button.
    this.canvasRef.nativeElement.focus(); 
    this.gameLoop(); // Start the loop to draw the initial start menu
  }

  // --- Input Listeners (HostListener) ---

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    this.keys[event.key.toLowerCase()] = true;

    if (event.key.toLowerCase() === 'p') {
      this.togglePause();
      event.preventDefault(); 
      return;
    }
    
    // Space or 'k' for shooting when not mouse aiming (or as a backup)
    if ((event.key === ' ' || event.key.toLowerCase() === 'k') && !this.mouseAiming) {
      this.shootBullet();
      event.preventDefault(); 
    }

    if (event.key.toLowerCase() === 'm') {
      this.mouseAiming = !this.mouseAiming;
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent) {
    this.keys[event.key.toLowerCase()] = false;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    // Calculate mouse position relative to the canvas
    this.mousePos.x = event.clientX - rect.left;
    this.mousePos.y = event.clientY - rect.top;
  }

  @HostListener('document:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    // Check if the click is within the canvas bounds before setting mouseDown for autofire
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    if (event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom) {
          // Only allow autofire if the game is active
          if (this.mouseAiming && event.button === 0 && !this.isPaused && !this.gameOver && this.isGameStarted) {
            this.mouseDown = true;
          }
    }
    this.onClick(event);
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (event.button === 0) {
      this.mouseDown = false;
    }
  }

  // --- Game Control Functions ---
  
  togglePause() {
      // Only allow pausing if the game has actually started
      if (this.gameOver || !this.isGameStarted) return;
      
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
          // If pausing, ensure one final draw to display the overlay
          this.draw();
          cancelAnimationFrame(this.animationFrameId);
      } else {
          this.canvasRef.nativeElement.focus();
          this.lastTime = performance.now(); // Reset time when unpausing
          this.gameLoop(); // Restart the loop
      }
  }

  // NEW: Initializes the game after the start button is clicked
  startGame() {
    if (this.isGameStarted) return;
    
    this.isGameStarted = true;
    this.lastTime = performance.now(); // Reset time for accurate delta calculation
    
    // Perform initial enemy spawn
    this.spawner.spawnEnemies(
        this.enemies, 
        this.enemySpawnCount, 
        false, 
        this.waveCount, 
        this.width, 
        this.height
    );
    this.canvasRef.nativeElement.focus();
    // The gameLoop is already running from ngAfterViewInit, which will now proceed past the start menu state.
  }
  
  // ** NEW: Reusable State Reset Logic **
  /**
   * Resets all primary game state variables to their initial values.
   */
  private resetState(startGameImmediately: boolean) {
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

    // The only difference between REPLAY (true) and MAIN MENU (false)
    this.isGameStarted = startGameImmediately; 
  }
  
  /**
   * Resets the game state and returns to the initial Start Menu.
   */
  public returnToMainMenu() {
    this.resetState(false); // Set isGameStarted to false
    this.lastTime = performance.now(); // Reset time
    this.canvasRef.nativeElement.focus();
    this.gameLoop(); // Restart the loop (it will now draw the Start Menu)
  }

  // --- Game Logic Functions ---

  shootBullet() {
    // Prevent shooting if game is not started, over, or paused
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
      // Use the last angle derived from movement keys
      angle = this.lastAngle;
    }
    
    const barrelLength = this.player.radius * 2.0; 

    this.bullets.push({
      x: this.player.x + Math.cos(angle) * barrelLength,
      y: this.player.y + Math.sin(angle) * barrelLength,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      radius: 6,
      color: '#f39c12', // Orange color for bullets
      ownerType: 'PLAYER' // <-- SET OWNER
});
  }

  // Spawns a minion from the boss enemy

killEnemy(enemy: Enemy) {
    this.score += enemy.scoreValue; 
    enemy.health = 0; 
}

  // --- Game Loop and Update ---

  gameLoop() {
    // Check only for pause, not game start, as we need the loop running to draw the start menu
    if (this.isPaused) return;

    this.update();
    this.draw();
    
    if (!this.gameOver || (this.gameOver && this.deathAnimationTimeStart !== null)) {
      this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    } else if (this.gameOver && this.deathAnimationTimeStart === null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  update() {
    // 0. Calculate Delta Time for smooth, frame-rate independent physics
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    // If the game is over and the death animation is running, handle it regardless of pause state
    if (this.gameOver && this.deathAnimationTimeStart !== null) {
      this.handleDeathAnimation(Date.now());
    }

    // 0.1 Guard: Stop all game logic/physics if not started, paused, or awaiting game over screen
    if (!this.isGameStarted || this.isPaused || this.gameOver) return; 

    // --- START: Core Game Logic (only runs if active) ---

    // 1. Player Movement & Rotation
    let moved = false;
    let dx = 0, dy = 0;
    if (this.keys['w']) { dy -= 1; moved = true; }
    if (this.keys['s']) { dy += 1; moved = true; }
    if (this.keys['a']) { dx -= 1; moved = true; }
    if (this.keys['d']) { dx += 1; moved = true; }
    
    if (moved) {
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        // Move player
        this.player.x += (dx / len) * this.player.maxSpeed;
        this.player.y += (dy / len) * this.player.maxSpeed;
        
        // Non-mouse aiming: rotate tank barrel to direction of movement
        if (!this.mouseAiming) {
            const newAngle = Math.atan2(dy, dx);
            if (!isNaN(newAngle)) {
              this.player.angle = newAngle;
              this.lastAngle = newAngle; 
            }
        }
      }
    }
    
    // Continuous Mouse Aiming: rotate tank barrel towards the cursor
    if (this.mouseAiming) {
      this.player.angle = Math.atan2(this.mousePos.y - this.player.y, this.mousePos.x - this.player.x);
    }

    // Clamp player position (prevent going off-screen)
    this.player.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.x));
    this.player.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.y));

    // Player Health Regeneration (0.5 HP/second, independent of max health)
    this.player.health = Math.min(this.player.maxHealth, this.player.health + (0.5 * deltaTime / 1000));

    // 2. Bullets Update
    this.bullets.forEach(bullet => {
      bullet.x += bullet.dx;
      bullet.y += bullet.dy;
    });
    this.bullets = this.bullets.filter(b => b.x > 0 && b.x < this.width && b.y > 0 && b.y < this.height);

    // 3. Mouse Aiming: Auto-fire when mouse is down
    if (this.mouseAiming && this.mouseDown) {
      this.shootBullet();
    }

    // 4. Enemy AI: Move toward player, Boss Regen, & Other Enemy Logic
    DiepEnemyLogic.updateAllEnemies(
        this.enemies, 
        this.bullets, 
        this.player, 
        deltaTime,
        this.width,
        this.height,
        now // Use the 'now' variable calculated at the top of your update() for cooldowns
    );

    // 5. Collision Detection (Bullets vs Enemies)
    const newBullets: Bullet[] = [];
    
    this.bullets.forEach(bullet => {
      let hit = false;
      this.enemies.forEach(enemy => {
        if (bullet.ownerType === 'ENEMY') { 
                return; // Skip collision check for enemy-fired bullets
            }
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < bullet.radius + enemy.radius) {
          enemy.health -= 15; // Bullet damage
          hit = true; 
          
          // BOSS MINION SPAWN LOGIC: 50% chance per hit if it's the boss
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
        // Only check collision for bullets owned by enemies
        if (bullet.ownerType === 'ENEMY') {
            const dx = bullet.x - this.player.x;
            const dy = bullet.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < bullet.radius + this.player.radius) {
                // Player takes damage
                this.player.health -= 10; // Sniper bullets deal 10 damage
                playerHit = true;
                // The bullet is NOT added to playerHitBullets, causing it to despawn
            } else {
                playerHitBullets.push(bullet);
            }
        } else {
            // Keep player-owned bullets for the next check (they were already filtered in step 5)
            playerHitBullets.push(bullet);
        }
    });

    this.bullets = playerHitBullets;

        // 6. Player-Enemy Collision (Damage)
        const enemiesToKeep: Enemy[] = [];
        const collisionDamageFraction = 0.25; // Enemy deals 25% of its max health as damage

    this.enemies.forEach(enemy => {
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < enemy.radius + this.player.radius) {
            // Collision occurred!
            
            // 1. Player takes fractional damage
            const damageToPlayer = enemy.health * collisionDamageFraction; 
            this.player.health -= damageToPlayer; 
            
            // 2. Enemy dies instantly
            // Call the new helper to handle score update and health set to 0
            this.killEnemy(enemy); 
            
            // NOTE: The enemy is NOT added to enemiesToKeep, removing it from the game.

        } else {
            // No collision with player, keep this enemy for the next frame
            enemiesToKeep.push(enemy);
        }
    });
    this.enemies = enemiesToKeep; // Update the enemy list

        // 6.5 Aura Enemy Proximity Damage (AoE)
        const auraDamage = 0.5; // Damage per frame/update cycle
        const auraRadius = 100; // Player must be within this distance of an Aura's center

        this.enemies.forEach(enemy => {
            if (enemy.type === 'AURA') {
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Check if the player is within the Aura's damage radius
                if (dist < enemy.radius + auraRadius) {
                    this.player.health -= auraDamage; 
                }
            }
        });

        // 7. Post-Collision Cleanup & Wave Progression
        this.enemies = this.enemies.filter(e => e.health > 0);
        
        const hasRegularEnemies = this.enemies.some(e => e.color === '#e74c3c'); 
        const hasBossOrMinions = this.enemies.some(e => e.isBoss || e.color === '#d2b4de');

        if (this.enemies.length === 0) {
            // Case A: Everything is clear, start next wave with new spawn count
            this.enemySpawnCount++; 
            this.waveCount++;
            this.isRegularWaveActive = false; // Reset for next wave roll
            this.spawner.spawnEnemies(
                this.enemies, 
                this.enemySpawnCount, 
                false, 
                this.waveCount, 
                this.width, 
                this.height
            ); // Allow boss roll
        } else if (this.isRegularWaveActive && !hasRegularEnemies) {
            // Case B: Only bosses (and minions) remain, regular part of wave cleared.
            // Start next "wave" immediately, but prevent a *new* boss from spawning if one already exists.
            this.enemySpawnCount++;
            this.waveCount++;
            this.isRegularWaveActive = false; 
            this.spawner.spawnEnemies(this.enemies, this.enemySpawnCount, hasBossOrMinions, this.waveCount, this.width, this.height); 
        }


        // 8. Game Over Check & Animation Start
        if (this.player.health <= 0) {
          this.player.health = 0;
          this.gameOver = true; 
          this.deathAnimationTimeStart = Date.now();
          // Store current enemies for the cleanup animation
          this.enemiesRemainingForAnimation = [...this.enemies]; 
          this.enemies = []; // Clear current enemies list
        }
    // --- END: Core Game Logic ---
  }

  // Slowly clears remaining enemies from the screen after player death
  handleDeathAnimation(now: number) {
      if (this.deathAnimationTimeStart === null) return;
      
      const timeElapsed = now - this.deathAnimationTimeStart;
      
      if (timeElapsed >= this.deathAnimationDuration) {
          this.enemiesRemainingForAnimation = []; // End animation
          this.deathAnimationTimeStart = null;
          return;
      }
  }
  
  // --- Drawing Functions ---
  
  drawUIOverlay() {
      const healthX = 20;
      const healthY = 20;
      
      // Determine text color based on overlay status
      const isOverlayActive = this.isPaused || (this.gameOver && this.deathAnimationTimeStart === null);
      const uiTextColor = isOverlayActive ? '#fff' : (this.isDarkMode ? '#ecf0f1' : '#333');

      // Player Health Bar (Top Left - Aesthetic Update)
      const healthBarWidth = 200;
      const healthBarHeight = 20;
      const healthRatio = this.player.health / this.player.maxHealth;

      // Background Container 
      this.ctx.fillStyle = '#34495e';
      this.ctx.fillRect(healthX - 2, healthY - 2, healthBarWidth + 4, healthBarHeight + 4); 

      // Health Fill
      this.ctx.fillStyle = healthRatio > 0.3 ? '#27ae60' : '#e67e22'; 
      this.ctx.fillRect(healthX, healthY, healthBarWidth * healthRatio, healthBarHeight);
      
      // Overlay Text
      this.ctx.font = 'bold 12px Inter, sans-serif';
      this.ctx.fillStyle = '#fff';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`PLAYER HEALTH: ${Math.ceil(this.player.health)}%`, healthX + 5, healthY + 14);


      // Score (Top Right)
      this.ctx.font = 'bold 20px Inter, sans-serif';
      this.ctx.fillStyle = uiTextColor;
      this.ctx.textAlign = 'right';
      this.ctx.fillText('SCORE: ' + this.score, this.width - 20, 35);

      // Wave Counter (Top Right, below Score)
      this.ctx.font = 'bold 20px Inter, sans-serif';
      this.ctx.fillStyle = uiTextColor;
      this.ctx.textAlign = 'right';
      this.ctx.fillText('WAVE: ' + this.waveCount, this.width - 20, 60);
  }

  draw() {
    const menuState = {
      ctx: this.ctx,
      width: this.width,
      height: this.height,
      isGameStarted: this.isGameStarted, // Pass new state
      gameOver: this.gameOver,
      isPaused: this.isPaused,
      score: this.score,
      isDarkMode: this.isDarkMode,
      deathAnimationTimeStart: this.deathAnimationTimeStart,
    };
    
    // --- 1. Set Canvas Background based on Dark Mode ---
    this.ctx.fillStyle = this.isDarkMode ? '#1e1e1e' : '#f4f4f4';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Only draw game entities if the game has started
    if (this.isGameStarted) {
      // --- 2. Draw Player Tank ---
      DiepEntities.drawPlayer(this.ctx, this.player, this.gameOver);

      // --- 3. Draw Bullets ---
      DiepEntities.drawBullets(this.ctx, this.bullets);

      // --- 4. Draw Enemies and Health Bars ---
      let enemiesToDraw: Enemy[];
      if (this.gameOver && this.deathAnimationTimeStart !== null) {
          // DEATH ANIMATION LOGIC (Keep this preparation logic, it's state manipulation)
          const totalEnemies = this.enemiesRemainingForAnimation.length;
          const timeElapsed = Date.now() - (this.deathAnimationTimeStart || 0);
          const enemiesToDisappear = Math.floor((timeElapsed / this.deathAnimationDuration) * totalEnemies);
          enemiesToDraw = this.enemiesRemainingForAnimation.slice(enemiesToDisappear);
      } else if (this.gameOver && this.deathAnimationTimeStart === null) {
          enemiesToDraw = [];
      } else {
          enemiesToDraw = this.enemies;
      }
    
      DiepEntities.drawEnemiesWithBars(this.ctx, enemiesToDraw, this.player);
    }
    
    // --- 7. Game Over Screen ---
    DiepMenus.drawGameOverScreen(menuState as any);

    // --- 8. Pause Screen ---
    DiepMenus.drawPauseScreen(menuState as any);
    
    // --- 9. Draw UI Overlay (Health, Score, Wave) - Draw if game has started (or is over/paused) ---
    if (this.isGameStarted || this.gameOver || this.isPaused) {
      this.drawUIOverlay();
    }
    
    // --- 10. Draw Start Menu (Always draw this last if the game hasn't started) ---
    DiepMenus.drawStartMenu(menuState as any);

    // --- 11. Draw In-Game Pause Button (Drawn last for layering fix) ---
    DiepMenus.drawInGamePauseButton(menuState as any);
  }

  // --- Utility/Control Functions ---

  onClick(event: MouseEvent) {
    
    // Get mouse position relative to canvas
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check 0: Start Game Button (ONLY active when game has NOT started)
    if (!this.isGameStarted) {
        const startBtnW = 200;
        const startBtnH = 55;
        const startBtnX = this.width / 2 - (startBtnW / 2);
        const startBtnY = this.height / 2 + 20;

        if (
          x >= startBtnX && x <= startBtnX + startBtnW &&
          y >= startBtnY && y <= startBtnY + startBtnH
        ) {
          this.startGame();
          return;
        }
    }
    
    // Check 1: Small Top-Center Pause/Play button (Works regardless of pause state, but only if game has started)
    const btnRadius = 20;
    const btnX = this.width / 2;
    const btnY = 35;
    const distToPauseBtn = Math.sqrt(Math.pow(x - btnX, 2) + Math.pow(y - btnY, 2));

    if (this.isGameStarted && !this.gameOver && distToPauseBtn < btnRadius) {
        this.togglePause();
        return;
    }

    // Check 2: Pause Menu Buttons (Central buttons - ONLY active when paused)
    if (this.isPaused) {
      // Resume Button
      const playBtnX = this.width / 2 - 80;
      const playBtnY = this.height / 2 - 40;
      const playBtnW = 160;
      const playBtnH = 45;
      
      // Check if clicking the large RESUME button
      if (
        x >= playBtnX && x <= playBtnX + playBtnW &&
        y >= playBtnY && y <= playBtnY + playBtnH
      ) {
        this.togglePause();
        return;
      }

      // Dark Mode Toggle Button
      const toggleBtnW = 280;
      const toggleBtnX = this.width / 2 - (toggleBtnW / 2);
      const toggleBtnY = this.height / 2 + 40;
      const toggleBtnH = 45;

      if (
        x >= toggleBtnX && x <= toggleBtnX + toggleBtnW &&
        y >= toggleBtnY && y <= toggleBtnY + toggleBtnH
      ) {
        this.isDarkMode = !this.isDarkMode;
        this.draw(); // Redraw immediately to show the change
        return;
      }
      
      // Ignore other clicks while paused
      return;
    }
    
    // Check 3: Game Over Buttons (ONLY active when game is over and animation is complete)
    if (this.gameOver && this.deathAnimationTimeStart === null) {
      // REPLAY Button check
      const btnX_go = this.width / 2 - 80;
      const btnY_go = this.height / 2 + 60; // REPLAY Y-start
      const btnW_go = 160;
      const btnH_go = 45;
      
      if (
        x >= btnX_go && x <= btnX_go + btnW_go &&
        y >= btnY_go && y <= btnY_go + btnH_go
      ) {
        this.restartGame(); // Calls resetState(true)
        return;
      }
      
      // ** NEW: MAIN MENU Button check **
      // Assuming a 15px gap below the Replay button (Y+60 + H+45 + Gap+15 = Y+120)
      const menuBtnY_go = this.height / 2 + 120; // MAIN MENU Y-start

      if (
        x >= btnX_go && x <= btnX_go + btnW_go &&
        y >= menuBtnY_go && y <= menuBtnY_go + btnH_go
      ) {
        this.returnToMainMenu(); // Calls resetState(false)
        return;
      }
    }
    
    // 4. Autofire on click if mouse aiming is enabled and game is running (outside of UI checks)
    if (this.mouseAiming && !this.isPaused && !this.gameOver && this.isGameStarted) {
        this.shootBullet();
    }
  }

  restartGame() {
    // ** UPDATED to use resetState **
    this.resetState(true); // Set to true to begin gameplay immediately after "REPLAY" click
    
    this.lastTime = performance.now(); // Reset time for accurate game loop
    this.spawner.spawnEnemies(
        this.enemies, 
        this.enemySpawnCount, 
        false, 
        this.waveCount, 
        this.width, 
        this.height
    );
    this.canvasRef.nativeElement.focus();
    this.gameLoop(); // Start the game loop again
  }
}
