import { Injectable } from '@angular/core';
import { DiepGameEngineService } from './diep.game-engine.service';
import { DiepInteractionService } from '../ui/diep.interaction.service';
import { DiepQuadriviumMenu } from '../ui/quadrivium/diep.quadrivium-menu';
import { DiepAchievementMenu } from '../ui/achievements/diep.achievement-menu';
import { DiepDynamicTitle } from '../ui/main-menu/diep.dynamic-title';

@Injectable({
  providedIn: 'root'
})
export class DiepInputService {
  constructor(
    private gameEngine: DiepGameEngineService,
    private buttonHandler: DiepInteractionService
  ) {}

  public handleKeyDown(event: KeyboardEvent, drawCallback: () => void, gameLoopCallback: () => void) {
    const key = event.key.toLowerCase();
    this.gameEngine.keys[key] = true;

    // Prevent browser scroll when navigating sub-menus
    if (this.gameEngine.showingQuadrivium || this.gameEngine.showingAchievements) {
      if (['arrowup', 'arrowdown', 'w', 's', ' '].includes(key)) {
        event.preventDefault();
      }
    }

    if (key === 'p' || key === ' ') {
      const wasPaused = this.gameEngine.togglePause();
      drawCallback();
      if (!wasPaused) gameLoopCallback();
      event.preventDefault();
      return;
    }

    if ((key === 'k') && !this.gameEngine.mouseAiming) {
      this.gameEngine.shootBullet();
      event.preventDefault();
    }

    if (key === 'm') this.gameEngine.mouseAiming = !this.gameEngine.mouseAiming;
  }

  public handleKeyUp(event: KeyboardEvent) {
    this.gameEngine.keys[event.key.toLowerCase()] = false;
  }

  public handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    this.gameEngine.mousePos.x = mouseX;
    this.gameEngine.mousePos.y = mouseY;

    // Scroll Hooks
    if (this.gameEngine.showingQuadrivium) {
      DiepQuadriviumMenu.handleInputMove(mouseY);
    } else if (this.gameEngine.showingAchievements) {
      DiepAchievementMenu.handleInputMove(mouseY);
    }
  }

  public handleMouseDown(
    event: MouseEvent, 
    canvas: HTMLCanvasElement, 
    gameLoopCallback: () => void, 
    drawCallback: () => void
  ) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 1. Boundary Check
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) {
      return;
    }

    // Dynamic Title Interaction Hook
    // We check if the game hasn't started (Main Menu) and if the click is in the upper title area
    if (!this.gameEngine.isGameStarted && mouseY < 250) {
      // event.detail is 1 for single click, 2 for double click
      const isDoubleClick = event.detail === 2;
      DiepDynamicTitle.handleClick(isDoubleClick);
    }

    // Scroll Hooks
    if (this.gameEngine.showingQuadrivium) {
      DiepQuadriviumMenu.handleInputDown(mouseY);
    } else if (this.gameEngine.showingAchievements) {
      DiepAchievementMenu.handleInputDown(mouseY);
    }

    // 2. UI Interception
    const wasButtonClicked = this.buttonHandler.handleMouseEvent(
      event, 
      canvas, 
      gameLoopCallback, 
      drawCallback
    );

    // 3. Gameplay Logic
    if (wasButtonClicked) {
      canvas.focus();
    } else {
      const g = this.gameEngine;
      if (g.mouseAiming && event.button === 0 && !g.isPaused && !g.gameOver && g.isGameStarted) {
        g.mouseDown = true;
        g.shootBullet();
      }
    }
  }

  public handleMouseUp(event: MouseEvent) {
    // Scroll Hooks
    if (this.gameEngine.showingQuadrivium) {
      DiepQuadriviumMenu.handleInputUp();
    } else if (this.gameEngine.showingAchievements) {
      DiepAchievementMenu.handleInputUp();
    }

    if (event.button === 0) {
      this.gameEngine.mouseDown = false;
    }
  }
}