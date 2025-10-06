import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Define Game Object Interfaces for better type safety
interface Player {
  x: number;
  y: number;
  radius: number;
  angle: number; // Rotation angle (radians)
  maxSpeed: number;
  color: string;
  health: number;
  maxHealth: number;
  fireRate: number; // Cooldown in ms
}

interface Bullet {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  color: string;
}

interface Enemy {
  x: number;
  y: number;
  radius: number;
  color: string;
  health: number;
  maxHealth: number;
  scoreValue: number; // Points awarded upon destruction
  isBoss: boolean; // Flag for the large purple boss enemy
}

@Component({
  selector: 'app-root', // MANDATORY: Use 'app-root' for the main application component
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="diep-container bg-gray-50 min-h-screen p-4 flex flex-col items-center justify-center font-inter">
      <div class="bg-white p-6 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-[1.01] flex flex-col items-center">
        
        <!-- Canvas for Game Rendering -->
        <canvas 
          #gameCanvas 
          [attr.width]="width" 
          [attr.height]="height" 
          tabindex="0"
          class="block rounded-lg shadow-inner border-2 border-gray-300"
        ></canvas>
        
        <!-- Game UI Information - Now styled by explicit CSS rules below -->
        <div class="diep-ui text-center mt-4 text-gray-700">
          <h2 class="diep-title">Diep Singleplayer</h2>
          <p class="diep-controls">Controls: WASD to move, Space or Click to shoot</p>
          <p class="diep-instructions-light">Press 'M' to toggle aiming mode. Press 'P' to toggle pause.</p>
          <p class="diep-instructions-bold">Watch out for the <span class="text-purple-boss">purple</span> boss enemies and their <span class="text-purple-minion">minions</span>!</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Custom CSS to ensure canvas border is visible and structure is nice */
    .diep-container {
      /* Added min-h-screen for full view and flex centering */
    }
    
    /* Ensure the canvas is the focus target for keyboard events */
    .diep-container:focus-within canvas {
      border-color: #3498db;
      box-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
    }

    /* Override canvas default styles for aesthetic consistency */
    canvas {
      outline: none;
    }

    /* --- EXPLICIT STYLING FOR GAME UI TEXT BELOW CANVAS --- */
    .diep-ui {
        text-align: center;
        margin-top: 1rem; 
        color: #4a5568; /* Tailwind gray-700 equivalent */
        font-family: 'Inter', sans-serif;
    }
    .diep-title {
        font-size: 1.875rem; /* text-3xl */
        font-weight: 800; /* font-extrabold */
        color: #3498db; /* Blue */
        margin-bottom: 0.5rem;
    }
    .diep-controls {
        font-size: 1.125rem; /* text-lg */
        font-weight: 500; /* font-medium */
        margin-top: 0;
        margin-bottom: 0.5rem;
    }
    .diep-instructions-light {
        font-size: 0.875rem; /* text-sm */
        font-style: italic;
        color: #a0aec0; /* Tailwind gray-500 equivalent */
        margin-top: 0;
        margin-bottom: 0.25rem;
    }
    .diep-instructions-bold {
        font-size: 0.875rem; /* text-sm */
        font-style: italic;
        font-weight: 700; /* font-bold */
        margin-top: 0;
        margin-bottom: 0.25rem;
    }
    .text-purple-boss {
        color: #9b59b6;
    }
    .text-purple-minion {
        color: #d2b4de;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// FIX: Changed class name to 'App' to ensure correct Angular bootstrapping in the environment
export class App implements AfterViewInit { 
  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number = 0;

  // Game Constants
  width = 800;
  height = 600;

  // Time tracking for accurate 1 HP/second regen
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
  
  // New state variables for wave progression
  isRegularWaveActive: boolean = false; 

  private lastShotTime: number = 0; 
  private enemySpawnCount = 5;
  waveCount = 0; 

  // Death Animation State
  private deathAnimationTimeStart: number | null = null;
  private deathAnimationDuration = 1000; 
  private enemiesRemainingForAnimation: Enemy[] = [];

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.spawnEnemies(this.enemySpawnCount, false); // Initial spawn
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
    
    if (event.key === ' ' || event.key.toLowerCase() === 'k') {
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
    this.mousePos.x = event.clientX - rect.left;
    this.mousePos.y = event.clientY - rect.top;
  }

  @HostListener('document:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    if (this.mouseAiming && event.button === 0 && !this.isPaused && !this.gameOver) {
      this.mouseDown = true;
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
          this.draw();
      } else {
          this.canvasRef.nativeElement.focus();
          this.lastTime = performance.now(); // Reset time when unpausing
          this.gameLoop(); 
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
      color: '#f39c12'
    });
  }

  // Spawns a minion from the boss enemy
  spawnBossMinion(x: number, y: number) {
      const minionRadius = 10;
      const minionMaxHealth = 45; // Minion health
      const minionScore = 0;
      const minionColor = '#d2b4de'; // Light purple minion color
  
      this.enemies.push({
          x: x,
          y: y,
          radius: minionRadius,
          color: minionColor,
          health: minionMaxHealth,
          maxHealth: minionMaxHealth,
          scoreValue: minionScore,
          isBoss: false 
      });
  }

  // Spawns enemies randomly off-screen
  spawnEnemies(count: number, preventBossSpawn: boolean) {
    const canvasWidth = this.width;
    const canvasHeight = this.height;
    const spawnPadding = 50; 
    
    // Set flag when a regular wave starts
    this.isRegularWaveActive = true; 

    // Check for a chance to spawn the large purple enemy (10% chance per wave)
    const spawnBoss = !preventBossSpawn && this.waveCount > 0 && Math.random() < 0.1;
    let regularEnemyCount = count;
    
    if (spawnBoss) {
        this.spawnSingleEnemy(canvasWidth, canvasHeight, spawnPadding, true);
        regularEnemyCount = Math.max(0, count - 1); // Replace one regular enemy
    }

    // Spawn regular enemies
    for (let i = 0; i < regularEnemyCount; i++) {
        this.spawnSingleEnemy(canvasWidth, canvasHeight, spawnPadding, false);
    }
  }

  spawnSingleEnemy(canvasWidth: number, canvasHeight: number, spawnPadding: number, isBoss: boolean) {
    let radius: number;
    let maxHealth: number;
    let scoreValue: number;
    let color: string;

    if (isBoss) {
        // Purple Boss Stats
        radius = 50; 
        maxHealth = 500; 
        scoreValue = 1000;
        color = '#9b59b6'; // Purple
    } else {
        // Regular Enemy Stats (Red, dynamic scaling)
        radius = 18 + Math.random() * 10; // 18 to 28
        color = '#e74c3c'; // Red

        // Health Scaling: Smallest (r=18) has ~90 HP. Largest (r=28) has ~135 HP.
        maxHealth = Math.floor(radius * 4.5 + 10); 
        
        // Score Scaling: Smallest (r=18) has ~10 points. Largest (r=28) has ~25 points.
        scoreValue = Math.floor(10 + (radius - 18) * 1.5);
    }

    let x: number, y: number;
    const edge = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left

    if (edge === 0) { // Top
        x = Math.random() * canvasWidth;
        y = -spawnPadding - radius;
    } else if (edge === 1) { // Right
        x = canvasWidth + spawnPadding + radius;
        y = Math.random() * canvasHeight;
    } else if (edge === 2) { // Bottom
        x = Math.random() * canvasWidth;
        y = canvasHeight + spawnPadding + radius;
    } else { // Left
        x = -spawnPadding - radius;
        y = Math.random() * canvasHeight;
    }

    this.enemies.push({
        x: x,
        y: y,
        radius: radius,
        color: color,
        health: maxHealth,
        maxHealth: maxHealth,
        scoreValue: scoreValue,
        isBoss: isBoss
    });
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
        this.player.x += (dx / len) * this.player.maxSpeed;
        this.player.y += (dy / len) * this.player.maxSpeed;
        
        if (!this.mouseAiming) {
            const newAngle = Math.atan2(dy, dx);
            if (!isNaN(newAngle)) {
              this.player.angle = newAngle;
              this.lastAngle = newAngle; 
            }
        }
      }
    }
    
    // Continuous Mouse Aiming
    if (this.mouseAiming) {
      this.player.angle = Math.atan2(this.mousePos.y - this.player.y, this.mousePos.x - this.player.x);
    }

    // Clamp player position
    this.player.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.x));
    this.player.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.y));

    // --- Only run main game logic if not dead ---
    if (!this.gameOver) {
        // 2. Bullets Update
        this.bullets.forEach(bullet => {
          bullet.x += bullet.dx;
          bullet.y += bullet.dy;
        });
        this.bullets = this.bullets.filter(b => b.x > 0 && b.x < this.width && b.y > 0 && b.y < this.height);

        // 3. Mouse Aiming: Auto-fire
        if (this.mouseAiming && this.mouseDown) {
          this.shootBullet();
        }

        // 4. Enemy AI: Move toward player and Boss Regen
        this.enemies.forEach(enemy => {
          const dx = this.player.x - enemy.x;
          const dy = this.player.y - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          let speed: number;
          if (enemy.isBoss) {
            // Boss regeneration: 1 HP per second (1 HP / 1000 ms * deltaTime)
            enemy.health = Math.min(enemy.maxHealth, enemy.health + (1 * deltaTime / 1000));
            speed = 0.75; // Boss enemies move slowest
          } else if (enemy.color === '#d2b4de') {
            speed = 3.5; // Minions move fastest 
          } else {
            speed = 1.5; // Regular enemies move average speed
          }

          if (dist > 0) {
            enemy.x += (dx / dist) * speed; 
            enemy.y += (dy / dist) * speed;
          }
        });

        // 5. Collision Detection (Bullets vs Enemies)
        const newBullets: Bullet[] = [];
        
        this.bullets.forEach(bullet => {
          let hit = false;
          this.enemies.forEach(enemy => {
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < bullet.radius + enemy.radius) {
              enemy.health -= 15; 
              hit = true; 
              
              // BOSS MINION SPAWN LOGIC: 50% chance per hit
              if (enemy.isBoss && Math.random() < 0.5) { 
                  this.spawnBossMinion(enemy.x, enemy.y);
              }

              if (enemy.health <= 0) this.score += enemy.scoreValue; 
            }
          });
          if (!hit) {
            newBullets.push(bullet);
          }
        });
        this.bullets = newBullets;

        // 6. Player-Enemy Collision (Damage)
        this.enemies.forEach(enemy => {
          const dx = enemy.x - this.player.x;
          const dy = enemy.y - this.player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < enemy.radius + this.player.radius) {
            this.player.health -= enemy.isBoss ? 1.5 : 0.5; // Bosses deal more damage
          }
        });

        // 7. Post-Collision Cleanup & Wave Progression
        this.enemies = this.enemies.filter(e => e.health > 0);
        
        const hasRegularEnemies = this.enemies.some(e => e.color === '#e74c3c'); 
        const hasBossOrMinions = this.enemies.some(e => e.isBoss || e.color === '#d2b4de');

        if (this.enemies.length === 0) {
            // Case A: Everything is clear
            this.enemySpawnCount++; 
            this.waveCount++;
            this.isRegularWaveActive = false;
            this.spawnEnemies(this.enemySpawnCount, false); // Allow boss roll
        } else if (this.isRegularWaveActive && !hasRegularEnemies) {
            // Case B: Only bosses (and minions) remain, regular wave is cleared.
            this.enemySpawnCount++;
            this.waveCount++;
            this.isRegularWaveActive = false; 
            this.spawnEnemies(this.enemySpawnCount, !hasBossOrMinions); // Prevent new boss roll if one is already present
        }


        // 8. Game Over Check & Animation Start
        if (this.player.health <= 0) {
          this.player.health = 0;
          this.gameOver = true; 
          this.deathAnimationTimeStart = Date.now();
          this.enemiesRemainingForAnimation = [...this.enemies]; 
          this.enemies = []; 
        }
    } else {
        // Game Over, handle death animation
        if (this.deathAnimationTimeStart !== null) {
            this.handleDeathAnimation(Date.now());
        }
    }
  }

  handleDeathAnimation(now: number) {
      if (this.deathAnimationTimeStart === null) return;
      
      const timeElapsed = now - this.deathAnimationTimeStart;
      
      if (timeElapsed >= this.deathAnimationDuration) {
          this.enemiesRemainingForAnimation = [];
          this.deathAnimationTimeStart = null;
          return;
      }
  }
  
  // --- Drawing Functions ---
  
  drawUIOverlay() {
      const healthX = 20;
      const healthY = 20;
      
      // Fix: Ensure text is high contrast (white) over the dark pause/game over overlay
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
    // 1. Set Canvas Background based on Dark Mode
    this.ctx.fillStyle = this.isDarkMode ? '#1e1e1e' : '#f4f4f4';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // --- 2. Draw Player Tank ---
    if (!this.gameOver) {
      this.ctx.save();
      this.ctx.translate(this.player.x, this.player.y);
      this.ctx.rotate(this.player.angle);

      // Draw Barrel (Cannon) 
      this.ctx.fillStyle = '#2980b9'; 
      this.ctx.beginPath();
      const barrelWidth = 14; 
      const barrelLength = this.player.radius * 2.5; 
      this.ctx.rect(-this.player.radius * 0.5, -barrelWidth / 2, barrelLength, barrelWidth);
      this.ctx.fill();
      
      // Draw Tank Body
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.player.color;
      this.ctx.fill();
      
      this.ctx.restore();
    }

    // --- 3. Draw Bullets ---
    this.bullets.forEach(bullet => {
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = bullet.color;
      this.ctx.shadowBlur = 5;
      this.ctx.shadowColor = bullet.color;
      this.ctx.fill();
      this.ctx.shadowBlur = 0; 
    });

    // --- 4. Draw Enemies and Health Bars ---
    let enemiesToDraw = this.enemies;
    if (this.gameOver && this.deathAnimationTimeStart !== null) {
        const totalEnemies = this.enemiesRemainingForAnimation.length;
        const timeElapsed = Date.now() - (this.deathAnimationTimeStart || 0);
        const enemiesToDisappear = Math.floor((timeElapsed / this.deathAnimationDuration) * totalEnemies);
        enemiesToDraw = this.enemiesRemainingForAnimation.slice(enemiesToDisappear);
    } else if (this.gameOver && this.deathAnimationTimeStart === null) {
        enemiesToDraw = []; 
    } else {
        enemiesToDraw = this.enemies;
    }


    enemiesToDraw.forEach(enemy => {
      // Draw Enemy Body (Circle)
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = enemy.color;
      this.ctx.fill();
      
      // Set unique stroke colors/widths
      let strokeColor = '#c0392b';
      let lineWidth = 2;
      let shadowBlur = 0;
      
      if (enemy.isBoss) {
          strokeColor = '#8e44ad'; // Darker purple
          lineWidth = 4;
          shadowBlur = 10;
      } else if (enemy.color === '#d2b4de') {
          strokeColor = '#9b59b6'; // Purple for minions
          lineWidth = 1.5;
      }
      
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = lineWidth;
      this.ctx.stroke();
      
      // Add a shadow effect for the boss
      if (shadowBlur > 0) {
          this.ctx.shadowBlur = shadowBlur;
          this.ctx.shadowColor = enemy.color;
          this.ctx.fill(); // Refill for shadow effect
          this.ctx.shadowBlur = 0;
      }

      // Draw Aesthetic Health Bar
      if (enemy.health < enemy.maxHealth && !enemy.isBoss) { // Only show for regular/minions
          const barWidth = enemy.radius * 2;
          const healthPercent = enemy.health / enemy.maxHealth;
          const healthBarX = enemy.x - enemy.radius;
          const healthBarY = enemy.y - enemy.radius - 15;
          const healthBarHeight = 6;
          
          // Background Bar (Sunken effect)
          this.ctx.fillStyle = '#1e1e1e';
          this.ctx.fillRect(healthBarX, healthBarY, barWidth, healthBarHeight);
          
          // Health Fill
          let healthColor = '#2ecc71'; // Green
          if (healthPercent < 0.5) healthColor = '#f1c40f'; // Yellow
          if (healthPercent < 0.2) healthColor = '#e74c3c'; // Red
          this.ctx.fillStyle = healthColor;
          
          const fillWidth = barWidth * healthPercent;
          this.ctx.fillRect(healthBarX, healthBarY, fillWidth, healthBarHeight);
          
          // Border
          this.ctx.strokeStyle = '#95a5a6';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(healthBarX, healthBarY, barWidth, healthBarHeight);
      }
    });
    
    // --- 7. Game Over Screen ---
    if (this.gameOver && this.deathAnimationTimeStart === null) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.font = 'bold 64px Inter, sans-serif';
      this.ctx.fillStyle = '#f1c40f'; 
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 40);

      this.ctx.font = '32px Inter, sans-serif';
      this.ctx.fillStyle = '#ecf0f1';
      this.ctx.fillText('Final Score: ' + this.score, this.width / 2, this.height / 2 + 10);

      // Draw Replay Button
      const btnX = this.width / 2 - 80;
      const btnY = this.height / 2 + 60;
      const btnW = 160;
      const btnH = 45;

      this.ctx.fillStyle = '#e74c3c'; 
      this.ctx.fillRect(btnX, btnY, btnW, btnH);
      
      this.ctx.strokeStyle = '#c0392b';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(btnX, btnY, btnW, btnH);

      this.ctx.font = 'bold 24px Inter, sans-serif';
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText('REPLAY', this.width / 2, btnY + 30);
    }

    // --- 8. Pause Screen ---
    if (this.isPaused) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.font = 'bold 64px Inter, sans-serif';
      this.ctx.fillStyle = '#f39c12'; 
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', this.width / 2, this.height / 2 - 100);

      // Draw RESUME Button (Center)
      const playBtnX = this.width / 2 - 80;
      const playBtnY = this.height / 2 - 40;
      const playBtnW = 160;
      const playBtnH = 45;
      
      this.ctx.fillStyle = '#2ecc71'; 
      this.ctx.fillRect(playBtnX, playBtnY, playBtnW, playBtnH);
      this.ctx.font = 'bold 24px Inter, sans-serif';
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText('RESUME', this.width / 2, playBtnY + 30);
      
      // Draw Dark Mode Toggle Button (Below Resume)
      const toggleBtnW = 280; // Increased width for text
      const toggleBtnX = this.width / 2 - (toggleBtnW / 2); // Center it
      const toggleBtnY = this.height / 2 + 40;
      const toggleBtnH = 45;

      this.ctx.fillStyle = this.isDarkMode ? '#34495e' : '#ecf0f1'; // Color based on target mode
      this.ctx.fillRect(toggleBtnX, toggleBtnY, toggleBtnW, toggleBtnH);
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(toggleBtnX, toggleBtnY, toggleBtnW, toggleBtnH);

      this.ctx.font = 'bold 18px Inter, sans-serif'; // Reduced font size
      this.ctx.fillStyle = this.isDarkMode ? '#ecf0f1' : '#333'; // Text color
      
      // Updated text for clarity
      const toggleText = this.isDarkMode ? 'CLICK FOR LIGHT MODE 🌞' : 'CLICK FOR DARK MODE 🌙';
      this.ctx.fillText(toggleText, this.width / 2, toggleBtnY + 30);
    }

    // --- 9. Draw UI Overlay (Health, Score, Wave) - Always draw last to ensure visibility ---
    // This is now drawn after the pause screen if paused, making it visible over the overlay.
    this.drawUIOverlay();
    
    // --- 10. Draw In-Game Pause Button (Drawn last for layering fix) ---
    if (!this.gameOver) {
      const btnRadius = 20;
      const btnX = this.width / 2; // Center
      const btnY = 35; // Top center

      this.ctx.fillStyle = 'rgba(52, 152, 219, 0.9)'; // Blue background
      this.ctx.beginPath();
      this.ctx.arc(btnX, btnY, btnRadius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#fff';
      if (this.isPaused) {
        // Draw Play icon (Triangle)
        this.ctx.beginPath();
        this.ctx.moveTo(btnX - 5, btnY - 8);
        this.ctx.lineTo(btnX - 5, btnY + 8);
        this.ctx.lineTo(btnX + 7, btnY);
        this.ctx.closePath();
        this.ctx.fill();
      } else {
        // Draw Pause icon (two vertical lines)
        this.ctx.fillRect(btnX - 6, btnY - 8, 4, 16);
        this.ctx.fillRect(btnX + 2, btnY - 8, 4, 16);
      }
      
      // Add a border when paused to make it stand out against the dark overlay
      if (this.isPaused) {
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
    }
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
        this.draw(); 
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
  }

  restartGame() {
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
    
    this.lastTime = performance.now(); // Reset time
    this.spawnEnemies(this.enemySpawnCount, false);
    this.canvasRef.nativeElement.focus();
    this.gameLoop();
  }
}
