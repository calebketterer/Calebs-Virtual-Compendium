import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiepMenus } from './diep.menus';
import { DiepEntities } from './diep.entities';
import { DiepGameEngineService } from './diep.game-engine.service'; 
import { Enemy } from './diep.interfaces';

@Component({
  selector: 'app-diep',
  standalone: true,
  imports: [CommonModule],
  // --- Always use external files ---
  templateUrl: './diep.component.html',
  styleUrls: ['./diep.component.css'], 
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class DiepComponent implements AfterViewInit { 
  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number = 0;

  // Read canvas dimensions from the service now, but keep local for template binding
  width = 800;
  height = 600;

  // Injection of the Game Engine Service - this service holds ALL game state and logic
  constructor(
    public gameEngine: DiepGameEngineService // Inject the new service publicly for template access
  ) { 
    this.width = gameEngine.width;
    this.height = gameEngine.height;
  }

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.canvasRef.nativeElement.focus(); 
    this.gameLoop(); // Start the loop to draw the initial start menu
  }

  // --- Input Listeners (HostListener) ---
  // The component captures input and updates the service's state directly, 
  // or calls a control method on the service.

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    this.gameEngine.keys[key] = true;

    if (key === 'p') {
      const wasPaused = this.gameEngine.togglePause();
      if (!wasPaused) { // If unpaused, resume the loop
        this.gameLoop();
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

  gameLoop() {
    // Check only for pause and game start status from the engine
    if (this.gameEngine.isPaused) {
      this.draw(); // Draw final paused frame
      return;
    }
    
    // Delegate ALL physics and state logic to the engine
    this.gameEngine.update();
    
    this.draw();
    
    // Only continue the loop if the death animation is running or the game is active/not over
    if (!this.gameEngine.gameOver || (this.gameEngine.gameOver && this.gameEngine.deathAnimationTimeStart !== null)) {
      this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    } else if (this.gameEngine.gameOver && this.gameEngine.deathAnimationTimeStart === null) {
      // Game over state reached and animation finished, stop the loop
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  // --- Drawing Functions ---
  
  /**
   * Draws the main HUD elements (Health, Score, Wave Count).
   */
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
      let enemiesToDraw: Enemy[]; // FIXED: Explicitly typed as Enemy[]
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

  // --- Button Click Handler (Temporary: Will be moved in Phase 2) ---

  /**
   * Handles all mouse click logic for UI buttons and shooting.
   */
  handleClick(event: MouseEvent) {
    const g = this.gameEngine;
    
    // Get mouse position relative to canvas
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 0. Start Game Button (ONLY active when game has NOT started)
    if (!g.isGameStarted) {
      const startBtnW = 200;
      const startBtnH = 55;
      const startBtnX = this.width / 2 - (startBtnW / 2);
      const startBtnY = this.height / 2 + 20;

      if (
        x >= startBtnX && x <= startBtnX + startBtnW &&
        y >= startBtnY && y <= startBtnY + startBtnH
      ) {
        g.startGame(); // DELEGATE to service
        this.canvasRef.nativeElement.focus();
        return;
      }
    }
    
    // 1. Small Top-Center Pause/Play button
    const btnRadius = 20;
    const btnX = this.width / 2;
    const btnY = 35;
    const distToPauseBtn = Math.sqrt(Math.pow(x - btnX, 2) + Math.pow(y - btnY, 2));

    if (g.isGameStarted && !g.gameOver && distToPauseBtn < btnRadius) {
      const wasPaused = g.togglePause(); // DELEGATE to service
      if (!wasPaused) this.gameLoop(); // Resume loop if unpaused
      return;
    }

    // 2. Pause Menu Buttons 
    if (g.isPaused) {
      // Resume Button
      const playBtnX = this.width / 2 - 80;
      const playBtnY = this.height / 2 - 40;
      const playBtnW = 160;
      const playBtnH = 45;
      
      if (x >= playBtnX && x <= playBtnX + playBtnW &&
          y >= playBtnY && y <= playBtnY + playBtnH) {
        g.togglePause(); // DELEGATE to service
        this.gameLoop(); // Resume loop
        return;
      }

      // Dark Mode Toggle Button
      const toggleBtnW = 280;
      const toggleBtnX = this.width / 2 - (toggleBtnW / 2);
      const toggleBtnY = this.height / 2 + 40;
      const toggleBtnH = 45;

      if (x >= toggleBtnX && x <= toggleBtnX + toggleBtnW &&
          y >= toggleBtnY && y <= toggleBtnY + toggleBtnH) {
        g.toggleDarkMode(); // DELEGATE to service
        this.draw(); 
        return;
      }
      return;
    }
    
    // 3. Game Over Buttons 
    if (g.gameOver && g.deathAnimationTimeStart === null) {
      // REPLAY Button check
      const btnX_go = this.width / 2 - 80;
      const btnY_go = this.height / 2 + 60; 
      const btnW_go = 160;
      const btnH_go = 45;
      
      if (x >= btnX_go && x <= btnX_go + btnW_go &&
          y >= btnY_go && y <= btnY_go + btnH_go) {
        g.restartGame(); // DELEGATE to service
        this.gameLoop();
        return;
      }
      
      // MAIN MENU Button check
      const menuBtnY_go = this.height / 2 + 120;

      if (x >= btnX_go && x <= btnX_go + btnW_go &&
          y >= menuBtnY_go && y <= menuBtnY_go + btnH_go) {
        g.returnToMainMenu(); // DELEGATE to service
        this.gameLoop();
        return;
      }
    }
    
    // 4. Autofire on click 
    if (g.mouseAiming && !g.isPaused && !g.gameOver && g.isGameStarted) {
      g.shootBullet();
    }
  }
}
