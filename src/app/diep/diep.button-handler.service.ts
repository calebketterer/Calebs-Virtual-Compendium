import { Injectable } from '@angular/core';
import { DiepGameEngineService } from './diep.game-engine.service';

@Injectable({
  providedIn: 'root'
})
export class DiepButtonHandlerService {
  
  constructor(private gameEngine: DiepGameEngineService) {}
  
  /**
   * Handles all mouse click logic for UI buttons and shooting.
   * NOTE: This method requires the canvas dimensions (width, height) 
   * and the canvas bounding rectangle for coordinate translation.
   * @param x The translated mouse X coordinate.
   * @param y The translated mouse Y coordinate.
   * @param width The canvas width.
   * @param height The canvas height.
   * @param gameLoopCallback A function to call to resume the game loop if a button unpauses or starts the game.
   * @returns true if a button was clicked and handled, false otherwise.
   */
  public handleCanvasClick(x: number, y: number, width: number, height: number, gameLoopCallback: () => void): boolean {
    const g = this.gameEngine;
    
    // Check if the click should result in a game state change (button press)
    let buttonClicked = false;

    // 0. Start Game Button (ONLY active when game has NOT started)
    if (!g.isGameStarted) {
      const startBtnW = 200;
      const startBtnH = 55;
      const startBtnX = width / 2 - (startBtnW / 2);
      const startBtnY = height / 2 + 20;

      if (
        x >= startBtnX && x <= startBtnX + startBtnW &&
        y >= startBtnY && y <= startBtnY + startBtnH
      ) {
        g.startGame(); // DELEGATE to engine
        gameLoopCallback();
        buttonClicked = true;
      }
    }
    
    // 1. Small Top-Center Pause/Play button
    const btnRadius = 20;
    const btnX = width / 2;
    const btnY = 35;
    const distToPauseBtn = Math.sqrt(Math.pow(x - btnX, 2) + Math.pow(y - btnY, 2));

    if (g.isGameStarted && !g.gameOver && distToPauseBtn < btnRadius) {
      const wasPaused = g.togglePause(); // DELEGATE to engine
      if (!wasPaused) gameLoopCallback(); // Resume loop if unpaused
      buttonClicked = true;
    }

    // 2. Pause Menu Buttons 
    if (g.isPaused) {
      // Resume Button
      const playBtnX = width / 2 - 80;
      const playBtnY = height / 2 - 40;
      const playBtnW = 160;
      const playBtnH = 45;
      
      if (x >= playBtnX && x <= playBtnX + playBtnW &&
          y >= playBtnY && y <= playBtnY + playBtnH) {
        g.togglePause(); // DELEGATE to engine
        gameLoopCallback(); // Resume loop
        buttonClicked = true;
      }

      // Dark Mode Toggle Button
      const toggleBtnW = 280;
      const toggleBtnX = width / 2 - (toggleBtnW / 2);
      const toggleBtnY = height / 2 + 40;
      const toggleBtnH = 45;

      if (x >= toggleBtnX && x <= toggleBtnX + toggleBtnW &&
          y >= toggleBtnY && y <= toggleBtnY + toggleBtnH) {
        g.toggleDarkMode(); // DELEGATE to engine
        buttonClicked = true; // Drawing will happen via draw on next frame
      }
    }
    
    // 3. Game Over Buttons 
    if (g.gameOver && g.deathAnimationTimeStart === null) {
      // REPLAY Button check
      const btnX_go = width / 2 - 80;
      const btnY_go = height / 2 + 60; 
      const btnW_go = 160;
      const btnH_go = 45;
      
      if (x >= btnX_go && x <= btnX_go + btnW_go &&
          y >= btnY_go && y <= btnY_go + btnH_go) {
        g.restartGame(); // DELEGATE to engine
        gameLoopCallback();
        buttonClicked = true;
      }
      
      // MAIN MENU Button check
      const menuBtnY_go = height / 2 + 120;

      if (x >= btnX_go && x <= btnX_go + btnW_go &&
          y >= menuBtnY_go && y <= menuBtnY_go + btnH_go) {
        g.returnToMainMenu(); // DELEGATE to engine
        gameLoopCallback();
        buttonClicked = true;
      }
    }
    
    // Return true if a button was clicked, false otherwise
    return buttonClicked;
  }
}
