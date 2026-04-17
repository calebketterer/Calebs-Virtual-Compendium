import { Injectable } from '@angular/core';
import { DiepGameEngineService } from './diep.game-engine.service';
import { DiepMenus } from './diep.menus';

@Injectable({
  providedIn: 'root'
})
export class DiepButtonHandlerService {
  
  constructor(private gameEngine: DiepGameEngineService) {}

  /**
   * Processes raw MouseEvents, translates coordinates, and executes game logic.
   */
  public handleMouseEvent(
    event: MouseEvent, 
    canvas: HTMLCanvasElement, 
    gameLoopCallback: () => void, 
    drawCallback: () => void
  ): boolean {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const g = this.gameEngine;
    const { width, height } = g;

    // 0. START GAME BUTTON (Restored exact math)
    if (!g.isGameStarted) {
      const startBtnW = 200;
      const startBtnH = 55;
      const startBtnX = width / 2 - (startBtnW / 2);
      const startBtnY = height / 2 + 20;

      if (x >= startBtnX && x <= startBtnX + startBtnW &&
          y >= startBtnY && y <= startBtnY + startBtnH) {
        g.startGame();
        gameLoopCallback();
        return true;
      }
    }

    // 1. TOP-CENTER PAUSE BUTTON
    const btnRadius = 20;
    const btnX = width / 2;
    const btnY = 35;
    const distToPauseBtn = Math.sqrt(Math.pow(x - btnX, 2) + Math.pow(y - btnY, 2));

    if (g.isGameStarted && !g.gameOver && distToPauseBtn < btnRadius) {
      const wasPaused = g.togglePause();
      if (!wasPaused) gameLoopCallback();
      return true;
    }

    // 2. PAUSE MENU BUTTONS
    if (g.isPaused) {
      // Resume Button
      const playBtnX = width / 2 - 80;
      const playBtnY = height / 2 - 40;
      const playBtnW = 160;
      const playBtnH = 45;
      
      if (x >= playBtnX && x <= playBtnX + playBtnW &&
          y >= playBtnY && y <= playBtnY + playBtnH) {
        g.togglePause();
        gameLoopCallback();
        return true;
      }

      // Dark Mode Toggle
      const toggleBtnW = 280;
      const toggleBtnH = 45;
      const toggleBtnX = width / 2 - (toggleBtnW / 2);
      const toggleBtnY = height / 2 + 40;

      if (x >= toggleBtnX && x <= toggleBtnX + toggleBtnW &&
          y >= toggleBtnY && y <= toggleBtnY + toggleBtnH) {
        g.toggleDarkMode();
        drawCallback();
        return true;
      }
    }

    // 3. GAME OVER BUTTONS
    if (g.gameOver && g.deathAnimationTimeStart === null) {
      const btnX_go = width / 2 - 80;
      const btnW_go = 160;
      const btnH_go = 45;

      // Replay Button
      const replayBtnY = height / 2 + 60;
      if (x >= btnX_go && x <= btnX_go + btnW_go &&
          y >= replayBtnY && y <= replayBtnY + btnH_go) {
        g.restartGame();
        gameLoopCallback();
        return true;
      }

      // Main Menu Button (Restored exact math)
      const menuBtnY = height / 2 + 120;
      if (x >= btnX_go && x <= btnX_go + btnW_go &&
          y >= menuBtnY && y <= menuBtnY + btnH_go) {
        g.returnToMainMenu();
        gameLoopCallback();
        return true;
      }
    }

    return false;
  }
}