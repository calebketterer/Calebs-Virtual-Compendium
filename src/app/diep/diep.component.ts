import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player, Bullet, Enemy, EnemyType } from './diep.interfaces';
import { EnemySpawnerService } from './diep.enemy-spawner';
import { DiepMenus } from './diep.menus';
import { DiepEntities } from './diep.entities';

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
    this.spawner.spawnEnemies(
        this.enemies, 
        this.enemySpawnCount, 
        false, 
        this.waveCount, 
        this.width, 
        this.height
    );
    this.canvasRef.nativeElement.focus(); 
    this.gameLoop();
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
          if (this.mouseAiming && event.button === 0 && !this.isPaused && !this.gameOver) {
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
      if (this.gameOver) return;
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

  // --- Game Logic Functions ---

  shootBullet() {
    if (this.gameOver || this.isPaused) return;
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

    if (this.isPaused && !this.gameOver) return;

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

    // --- Only run main game logic if not dead ---
    if (!this.gameOver) {
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

// 4. Enemy AI: Move toward player and Boss Regen & New Enemy Types
const now = performance.now(); 
// NOTE: deltaTime must be calculated and defined before this block (e.g., deltaTime = now - lastTime)
// For this example, we assume 'deltaTime' is available.
const sniperBulletSpeed = 10; 

// Define a minimal structural type for the enemy objects used by the movement function.
type MovableEnemy = {
    x: number;
    y: number;
    // Allow for other necessary properties like 'type', 'health', 'radius', etc.
    [key: string]: any; 
};

for (const enemy of this.enemies) {
    const dx = this.player.x - enemy.x;
    const dy = this.player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // --- REUSABLE MOVEMENT HELPER FUNCTION ---
    /**
     * Moves the currentEnemy directly towards the player using the given speed.
     * Defaults to a speed of 1.5 if no speed is provided.
     */
    const moveTowardsPlayer = (currentEnemy: MovableEnemy, moveSpeed?: number) => {
        // Determine the effective speed, defaulting to 1.5
        const finalSpeed = moveSpeed || 1.5; 

        if (dist > 0 && finalSpeed > 0) {
            // Normalized movement vector toward player 
            currentEnemy.x += (dx / dist) * finalSpeed;
            currentEnemy.y += (dy / dist) * finalSpeed;
        }
    };

    switch (enemy.type) {
        case 'BOSS':
            // Boss Regen Logic
            enemy.health = Math.min(enemy.maxHealth, enemy.health + (1 * deltaTime / 1000));
            moveTowardsPlayer(enemy, 0.75);
            break;

        case 'MINION':
            moveTowardsPlayer(enemy, 3.5);
            break;

        case 'CRASHER':
            // Movement via helper (uses multiplier)
            moveTowardsPlayer(enemy, 2 * (enemy.speedMultiplier || 1)); 
            break;

        case 'SNIPER':
            const firingRange = 400; 	 // Optimal max distance to shoot
            const sniperEvasionRange = 250; // Min distance before retreat starts
            const sniperMoveSpeed = 1.0;
            const sniperFireRate = 3500; 

            let moveDirection = 0; // 0 = stationary, 1 = towards, -1 = away
            let currentSpeed = sniperMoveSpeed;

            if (dist > firingRange) {
                // 1. Too far: Approach the player to get into firing range
                moveDirection = 1;
            } else if (dist < sniperEvasionRange) {
                // 2. Too close: RETREAT away from the player
                moveDirection = -1; 
            } else {
                // 3. Optimal range (250-400): Stop to shoot
                currentSpeed = 0; // Stop movement
                moveDirection = 0;

                // Sniper Firing Logic
                if (now - (enemy.lastShotTime || 0) > sniperFireRate) {
                    const angle = Math.atan2(dy, dx); 
                    
                    this.bullets.push({
                        x: enemy.x,
                        y: enemy.y,
                        dx: Math.cos(angle) * sniperBulletSpeed,
                        dy: Math.sin(angle) * sniperBulletSpeed,
                        radius: 5,
                        color: enemy.color,
                        ownerType: 'ENEMY'
                    });
                    
                    enemy.lastShotTime = now;
                }
            }
            
            // --- Apply Custom Movement Based on Calculation (RETREAT/APPROACH/STOP) ---
            if (dist > 0 && currentSpeed > 0) { 
                // The movement uses the calculated moveDirection (-1 for retreat, 1 for approach)
                enemy.x += (dx / dist) * currentSpeed * moveDirection; 
                enemy.y += (dy / dist) * currentSpeed * moveDirection;
            }
            break; 

        case 'AURA':
            const auraSpeed = 0.5; // Very slow movement
            const auraDistanceTolerance = 10;
            // NOTE: Assuming this.canvasRef is available in this scope for width/height
            const canvasWidth = this.canvasRef?.nativeElement.width || 800;
            const canvasHeight = this.canvasRef?.nativeElement.height || 600;
            
            // Check if the Aura has reached its current target
            const targetDx = (enemy.targetX || 0) - enemy.x;
            const targetDy = (enemy.targetY || 0) - enemy.y;
            const targetDist = Math.sqrt(targetDx * targetDx + targetDy * targetDy);

            if (targetDist < auraDistanceTolerance || !enemy.targetX) {
                // Re-acquire a new random target within the canvas
                enemy.targetX = enemy.radius + Math.random() * (canvasWidth - 2 * enemy.radius);
                enemy.targetY = enemy.radius + Math.random() * (canvasHeight - 2 * enemy.radius);
            }
            
            // Re-calculate direction towards the NEW target
            const finalDx = enemy.targetX! - enemy.x; 
            const finalDy = enemy.targetY! - enemy.y;
            const finalDist = Math.sqrt(finalDx * finalDx + finalDy * finalDy);
            
            if (finalDist > 0) {
                enemy.x += (finalDx / finalDist) * auraSpeed;
                enemy.y += (finalDy / finalDist) * auraSpeed;
            }
            break;

        case 'SMASHER':
            const flankSpeed = 2;
            const attackSpeed = 4;
            // Removed mouseX/mouseY dependency for clean refactoring, using player position logic instead
            const playerAngle = Math.atan2(dy, dx); // Simplified angle logic
            const flankerAngle = Math.atan2(dy, dx); 
            const attackRange = 150; 
            const flankCircleRadius = 400; 

            // --- DODGE LOGIC TRIGGER ---
            let angleDifference = playerAngle - flankerAngle;
            if (angleDifference > Math.PI) angleDifference -= 2 * Math.PI;
            if (angleDifference < -Math.PI) angleDifference += 2 * Math.PI;

            const evasionCone = Math.PI / 6; 
            const evasionRange = 350; 
            
            const isPlayerAimingAtMe = (Math.abs(angleDifference) < evasionCone);
            const isImminentThreat = (dist < 150); 
            
            // FIX: Only trigger dodge if NOT currently in ATTACK mode
            if (enemy.smasherState !== 'ATTACK' && dist < evasionRange && isPlayerAimingAtMe && isImminentThreat) { 
                if (enemy.smasherState !== 'DODGE') {
                    enemy.smasherState = 'DODGE';
                    enemy.dodgeEndTime = now + 150; 
                }
            }
            // --- END DODGE TRIGGER ---
            
            // --- DODGE MOVEMENT STATE ---
            if (enemy.smasherState === 'DODGE') {
                const dodgeSpeed = attackSpeed * 2.5; 
                
                if (now < enemy.dodgeEndTime!) {
                    // Lateral movement logic needs to be fully placed here if you remove 'continue'
                    // For now, we keep the original structure until that logic is provided fully.
                    break; // Use break to prevent attack/flank logic from running below
                } else {
                    enemy.smasherState = 'APPROACH'; 
                    enemy.dodgeEndTime = undefined;
                }
            }
            // --- END DODGE MOVEMENT STATE ---

            // --- FLANKING & APPROACH LOGIC (Circling Orbit) ---
            if (enemy.smasherState === 'APPROACH' || enemy.smasherState === 'FLANK' || !enemy.smasherState) {
                enemy.smasherState = 'FLANK';
                
                // --- 1. DETERMINE DESIRED ORBIT LOCATION ---
                const angleToEnemy = Math.atan2(dy, dx);
                const rotationAngle = (enemy.smasherOrbitDirection || 1) * (Math.PI / 2);
                const targetOrbitAngle = angleToEnemy + rotationAngle; 
                
                const desiredX = this.player.x + Math.cos(targetOrbitAngle) * flankCircleRadius;
                const desiredY = this.player.y + Math.sin(targetOrbitAngle) * flankCircleRadius;
                
                // --- 2. MOVE TOWARDS ORBIT LOCATION ---
                const moveDx = desiredX - enemy.x;
                const moveDy = desiredY - enemy.y;
                const moveDist = Math.sqrt(moveDx * moveDx + moveDy * moveDy);

                if (moveDist > 0) {
                    enemy.x += (moveDx / moveDist) * flankSpeed;
                    enemy.y += (moveDy / moveDist) * flankSpeed;
                }
                
                // --- 3. CHECK FOR ATTACK LAUNCH ---
                if (dist < attackRange) { 
                    enemy.smasherState = 'ATTACK';
                }

                const rotationSpeed = 0.026; 
                enemy.rotationAngle = (enemy.rotationAngle || 0) + rotationSpeed;
                if (enemy.rotationAngle > Math.PI * 2) {
                    enemy.rotationAngle -= Math.PI * 2;
                }
                break; // Break here as flanking movement is complete.
            }
            
            // Phase 3: ATTACK (Final Charge)
            if (enemy.smasherState === 'ATTACK') {
                // Movement via helper (uses attack speed)
                moveTowardsPlayer(enemy, attackSpeed); 

                // Reset to APPROACH if it misses and gets too far away.
                const resetDistance = flankCircleRadius * 1.5; 
                if (dist > resetDistance) {
                    enemy.smasherState = 'APPROACH';
                }

                const rotationSpeed = 0.026; 
                enemy.rotationAngle = (enemy.rotationAngle || 0) + rotationSpeed;
                if (enemy.rotationAngle > Math.PI * 2) {
                    enemy.rotationAngle -= Math.PI * 2;
                }
            }
            break; // Smasher logic complete
            
        case 'REGULAR':
        default:
            // Use original REGULAR enemy speed calculation
            const regularEnemyBaseSpeed = 0.3;
            let finalRegularSpeed = 1.5; // Default speed

            if (enemy.speedMultiplier) {
                finalRegularSpeed = regularEnemyBaseSpeed * enemy.speedMultiplier;
            }
            
            // Movement via helper
            moveTowardsPlayer(enemy, finalRegularSpeed);
            break;
    }
}


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
    } else {
        // Game Over, handle death animation
        if (this.deathAnimationTimeStart !== null) {
            this.handleDeathAnimation(Date.now());
        }
    }
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
      gameOver: this.gameOver,
      isPaused: this.isPaused,
      score: this.score,
      isDarkMode: this.isDarkMode,
      deathAnimationTimeStart: this.deathAnimationTimeStart,
    };
    
    // --- 1. Set Canvas Background based on Dark Mode ---
    this.ctx.fillStyle = this.isDarkMode ? '#1e1e1e' : '#f4f4f4';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
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
    
    // --- 7. Game Over Screen ---
    DiepMenus.drawGameOverScreen(menuState);

    // --- 8. Pause Screen ---
    DiepMenus.drawPauseScreen(menuState);

    // --- 9. Draw UI Overlay (Health, Score, Wave) - Always draw last to ensure visibility ---
    this.drawUIOverlay();
    
    // --- 10. Draw In-Game Pause Button (Drawn last for layering fix) ---
    DiepMenus.drawInGamePauseButton(menuState);
  }

  // --- Utility/Control Functions ---

  onClick(event: MouseEvent) {
    
    // Get mouse position relative to canvas
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check 1: Small Top-Center Pause/Play button (Works regardless of pause state)
    const btnRadius = 20;
    const btnX = this.width / 2;
    const btnY = 35;
    const distToPauseBtn = Math.sqrt(Math.pow(x - btnX, 2) + Math.pow(y - btnY, 2));

    if (!this.gameOver && distToPauseBtn < btnRadius) {
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
    
    // Check 3: Replay Button (Game Over)
    if (this.gameOver && this.deathAnimationTimeStart === null) {
      const btnX_go = this.width / 2 - 80;
      const btnY_go = this.height / 2 + 60;
      const btnW_go = 160;
      const btnH_go = 45;

      if (
        x >= btnX_go && x <= btnX_go + btnW_go &&
        y >= btnY_go && y <= btnY_go + btnH_go
      ) {
        this.restartGame();
        return;
      }
    }
    
    // 4. Autofire on click if mouse aiming is enabled and game is running (outside of UI checks)
    if (this.mouseAiming && !this.isPaused && !this.gameOver) {
        this.shootBullet();
    }
  }

  restartGame() {
    // Reset all game state variables to initial values
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
