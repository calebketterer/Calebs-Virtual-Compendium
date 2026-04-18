import { Injectable } from '@angular/core';
import { DiepGameEngineService } from './diep.game-engine.service';
import { DiepButtonHandlerService } from '../ui/diep.interaction.service';

@Injectable({
  providedIn: 'root'
})
export class DiepInputService {
  constructor(
    private gameEngine: DiepGameEngineService,
    private buttonHandler: DiepButtonHandlerService
  ) {}

  public handleKeyDown(event: KeyboardEvent, drawCallback: () => void, gameLoopCallback: () => void) {
    const key = event.key.toLowerCase();
    this.gameEngine.keys[key] = true;

    if (key === 'p'|| key === ' ') {
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
    this.gameEngine.mousePos.x = event.clientX - rect.left;
    this.gameEngine.mousePos.y = event.clientY - rect.top;
  }

  public handleMouseDown(
    event: MouseEvent, 
    canvas: HTMLCanvasElement, 
    gameLoopCallback: () => void, 
    drawCallback: () => void
  ) {
    const rect = canvas.getBoundingClientRect();

    // 1. Boundary Check
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) {
      return;
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
    if (event.button === 0) {
      this.gameEngine.mouseDown = false;
    }
  }
}