import { Injectable } from '@angular/core';
import { DiepGameEngineService } from '../engine/diep.game-engine.service';
import { DiepButton } from '../diep.interfaces';
import { DiepUIConfig } from './diep.ui-layout';

@Injectable({ providedIn: 'root' })
export class DiepButtonHandlerService {
  constructor(private gameEngine: DiepGameEngineService) {}

  public handleMouseEvent(event: MouseEvent, canvas: HTMLCanvasElement, gameLoopCallback: () => void, drawCallback: () => void): boolean {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const g = this.gameEngine;
    const { width, height } = g;

    if (g.isGameStarted && !g.gameOver) {
      const dist = Math.sqrt(Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - 35, 2));
      if (dist < 20) {
        const wasPaused = g.togglePause();
        if (!wasPaused) gameLoopCallback();
        return true;
      }
    }

    let activeButtons: DiepButton[] = [];
    if (!g.isGameStarted) {
      activeButtons = DiepUIConfig.getStartMenuButtons(g, width, height);
    } else if (g.isPaused) {
      activeButtons = DiepUIConfig.getPauseMenuButtons(g, width, height);
    } else if (g.gameOver && g.deathAnimationTimeStart === null) {
      activeButtons = DiepUIConfig.getGameOverButtons(g, width, height);
    }

    for (const btn of activeButtons) {
      if (mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h) {
        btn.action();
        if (!g.isPaused && g.isGameStarted) gameLoopCallback();
        drawCallback();
        return true;
      }
    }

    return false;
  }
}