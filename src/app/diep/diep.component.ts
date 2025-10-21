import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// Only required external dependencies: Drawing utilities and the Game Engine
import { DiepMenus } from './diep.menus';
import { DiepEntities } from './diep.entities';
import { DiepGameEngineService } from './diep.game-engine.service'; 
import { DiepButtonHandlerService } from './diep.button-handler.service'; 
import { Enemy } from './diep.interfaces'; 

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
  // CRITICAL: Time tracker for frame independence
  private lastTime: number = 0; 

  // Read canvas dimensions from the service now, but keep local for template binding
  width = 800;
  height = 600;

  // Injection of the Game Engine Service and the new Button Handler
  constructor(
    public gameEngine: DiepGameEngineService, // Inject the new service publicly for template access
    private buttonHandler: DiepButtonHandlerService // Inject the button handler
  ) { 
    this.width = gameEngine.width;
    this.height = gameEngine.height;
  }

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.canvasRef.nativeElement.focus(); 
    this.lastTime = performance.now(); // Initialize time tracking
    this.gameLoop(this.lastTime); // Start the loop 
  }

  // --- Input Listeners (HostListener) ---

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    this.gameEngine.keys[key] = true;

    if (key === 'p') {
      const wasPaused = this.gameEngine.togglePause();
      if (!wasPaused) { // If unpaused, resume the loop
        // When unpausing, we manually start the loop with the current time
        // to prevent a massive deltaTime jump in the next frame.
        this.gameLoop(performance.now()); 
      }
      event.preventDefault(); 
      return;
    }
    
    // Manual fire button (Space or K)
    if ((key === ' ' || key === 'k') && !this.gameEngine.mouseAiming) {
      this.gameEngine.shootBullet();
      event.preventDefault(); 
    }

    if (key === 'm') {
      this.gameEngine.mouseAiming = !this.gameEngine.mouseAiming;
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent) {
    this.gameEngine.keys[event.key.toLowerCase()] = false;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    // Update service's mouse position
    this.gameEngine.mousePos.x = event.clientX - rect.left;
    this.gameEngine.mousePos.y = event.clientY - rect.top;
  }

  @HostListener('document:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    // Check if the click is within the canvas bounds
    if (event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom) {
          
          const g = this.gameEngine;
          if (g.mouseAiming && event.button === 0 && !g.isPaused && !g.gameOver && g.isGameStarted) {
            g.mouseDown = true; // Update service state
          }
          this.handleClick(event);
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (event.button === 0) {
      this.gameEngine.mouseDown = false; // Update service state
    }
  }

  // --- Game Loop and Update ---

  /**
   * The core game loop using requestAnimationFrame.
   * Calculates deltaTime and passes it to the engine for frame-rate independence.
   */
  gameLoop(time: number) {
    // Check only for pause and game start status from the engine
    if (this.gameEngine.isPaused) {
      this.draw(); // Draw final paused frame
      this.lastTime = 0; // Reset lastTime so a huge delta doesn't happen on resume
      return;
    }
    
    // Calculate Delta Time for frame-rate independent movement
    let deltaTime = time - this.lastTime;
    
    // If lastTime is 0 (i.e., just unpaused or starting up), reset the timer.
    // Clamp deltaTime to a small, safe value (e.g., 1/60th of a second) to prevent large jumps
    if (this.lastTime === 0) {
        this.lastTime = time;
        deltaTime = 1000 / 60; // Use a default delta for the first frame after a reset/pause
    } else {
        this.lastTime = time;
    }
    
    // Delegate ALL physics and state logic to the engine, passing the time difference
    this.gameEngine.update(deltaTime); 
    
    this.draw();
    
    // Only continue the loop if the death animation is running or the game is active/not over
    if (!this.gameEngine.gameOver || (this.gameEngine.gameOver && this.gameEngine.deathAnimationTimeStart !== null)) {
      // Pass the current time to the recursive call
      this.animationFrameId = requestAnimationFrame((newTime) => this.gameLoop(newTime)); 
    } else if (this.gameEngine.gameOver && this.gameEngine.deathAnimationTimeStart === null) {
      // Game over state reached and animation finished, stop the loop
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  // --- Drawing Functions remain unchanged ---
  drawUIOverlay() {
    const g = this.gameEngine; // Reference the engine for clean access

    const healthX = 20;
    const healthY = 20;
    
    const isOverlayActive = g.isPaused || (g.gameOver && g.deathAnimationTimeStart === null);
    const uiTextColor = isOverlayActive ? '#fff' : (g.isDarkMode ? '#ecf0f1' : '#333');

    // Player Health Bar (Top Left)
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthRatio = g.player.health / g.player.maxHealth;

    this.ctx.fillStyle = '#34495e';
    this.ctx.fillRect(healthX - 2, healthY - 2, healthBarWidth + 4, healthBarHeight + 4); 

    this.ctx.fillStyle = healthRatio > 0.3 ? '#27ae60' : '#e67e22'; 
    this.ctx.fillRect(healthX, healthY, healthBarWidth * healthRatio, healthBarHeight);
    
    this.ctx.font = 'bold 12px Inter, sans-serif';
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`PLAYER HEALTH: ${Math.ceil(g.player.health)}%`, healthX + 5, healthY + 14);


    // Score (Top Right)
    this.ctx.font = 'bold 20px Inter, sans-serif';
    this.ctx.fillStyle = uiTextColor;
    this.ctx.textAlign = 'right';
    this.ctx.fillText('SCORE: ' + g.score, this.width - 20, 35);

    // Wave Counter (Top Right, below Score)
    this.ctx.font = 'bold 20px Inter, sans-serif';
    this.ctx.fillStyle = uiTextColor;
    this.ctx.textAlign = 'right';
    this.ctx.fillText('WAVE: ' + g.waveCount, this.width - 20, 60);
  }

  /**
   * Main drawing function.
   */
  draw() {
    const g = this.gameEngine; // Reference the engine for clean access
    
    const menuState = {
      ctx: this.ctx,
      width: this.width,
      height: this.height,
      isGameStarted: g.isGameStarted,
      gameOver: g.gameOver,
      isPaused: g.isPaused,
      score: g.score,
      isDarkMode: g.isDarkMode,
      deathAnimationTimeStart: g.deathAnimationTimeStart,
      topScores: g.topScores,
    };
    
    // --- 1. Set Canvas Background based on Dark Mode ---
    this.ctx.fillStyle = g.isDarkMode ? '#1e1e1e' : '#f4f4f4';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Only draw game entities if the game has started
    if (g.isGameStarted || g.gameOver) { 
      // --- 2. Draw Player Tank ---
      DiepEntities.drawPlayer(this.ctx, g.player, g.gameOver);

      // --- 3. Draw Bullets ---
      DiepEntities.drawBullets(this.ctx, g.bullets);

      // --- 4. Draw Enemies and Health Bars ---
      let enemiesToDraw: Enemy[]; 
      if (g.gameOver && g.deathAnimationTimeStart !== null) {
        // DEATH ANIMATION LOGIC (Reads from engine's state)
        const totalEnemies = g.enemiesRemainingForAnimation.length;
        const deathDuration = 1000; 
        const timeElapsed = Date.now() - (g.deathAnimationTimeStart || 0);
        const enemiesToDisappear = Math.floor((timeElapsed / deathDuration) * totalEnemies);
        enemiesToDraw = g.enemiesRemainingForAnimation.slice(enemiesToDisappear);
      } else if (g.gameOver && g.deathAnimationTimeStart === null) {
        enemiesToDraw = [];
      } else {
        enemiesToDraw = g.enemies;
      }
    
      DiepEntities.drawEnemiesWithBars(this.ctx, enemiesToDraw, g.player);
    }
    
    // --- 7. Game Over Screen ---
    DiepMenus.drawGameOverScreen(menuState as any);

    // --- 8. Pause Screen ---
    DiepMenus.drawPauseScreen(menuState as any);
    
    // --- 9. Draw UI Overlay (Health, Score, Wave) ---
    if (g.isGameStarted || g.gameOver || g.isPaused) {
      this.drawUIOverlay();
    }
    
    // --- 10. Draw Start Menu (Always draw this last if the game hasn't started) ---
    DiepMenus.drawStartMenu(menuState as any);

    // --- 11. Draw In-Game Pause Button (Drawn last for layering) ---
    DiepMenus.drawInGamePauseButton(menuState as any);
  }

  // --- Button Click Handler (Now delegated to a service) ---

  /**
   * Handles all mouse click logic for UI buttons and shooting by delegating to the ButtonHandlerService.
   */
  handleClick(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // First, check for button presses using the dedicated service.
    // The service handles all the coordinate checks and state changes (start, pause, restart).
    const buttonWasClicked = this.buttonHandler.handleCanvasClick(
      x, 
      y, 
      this.width, 
      this.height, 
      () => this.gameLoop(performance.now()) // Pass current time when resuming loop
    );
    
    // If a button was clicked, we return early to prevent the autofire/shooting logic.
    if (buttonWasClicked) {
      // Focus canvas if game is active, so keyboard controls still work after unpausing
      if (this.gameEngine.isGameStarted && !this.gameEngine.gameOver) {
        this.canvasRef.nativeElement.focus();
      }
      return;
    }

    // 4. Autofire on click (Only runs if no UI button was clicked)
    const g = this.gameEngine;
    if (g.mouseAiming && !g.isPaused && !g.gameOver && g.isGameStarted) {
      g.shootBullet();
    }
  }
}
