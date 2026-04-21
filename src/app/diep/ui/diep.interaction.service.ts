import { Injectable } from '@angular/core';
import { DiepGameEngineService } from '../engine/diep.game-engine.service';
import { DiepButton } from '../diep.interfaces';
import { DiepUIConfig } from './diep.ui-layout';

@Injectable({ providedIn: 'root' })
export class DiepInteractionService {
  constructor(private gameEngine: DiepGameEngineService) {}

  public handleMouseEvent(event: MouseEvent, canvas: HTMLCanvasElement, gameLoopCallback: () => void, drawCallback: () => void): boolean {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const g = this.gameEngine;
    const { width, height } = g;

    // 1. Check In-Game Pause Circle (only if not in a menu)
    if (g.isGameStarted && !g.gameOver && !g.showingQuadrivium) {
      const dist = Math.sqrt(Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - 35, 2));
      if (dist < 20) {
        const wasPaused = g.togglePause();
        if (!wasPaused) gameLoopCallback();
        return true;
      }
    }

    // 2. Identify which UI button set to check based on state
    let activeButtons: DiepButton[] = [];
    if (g.showingQuadrivium) {
      activeButtons = DiepUIConfig.getQuadriviumButtons(g, width, height);
    } else if (g.showingAchievements) {
      activeButtons = DiepUIConfig.getAchievementMenuButtons(g, width, height);
    }else if (!g.isGameStarted) {
      activeButtons = DiepUIConfig.getStartMenuButtons(g, width, height);
    } else if (g.isPaused) {
      activeButtons = DiepUIConfig.getPauseMenuButtons(g, width, height);
    } else if (g.gameOver && g.deathAnimationTimeStart === null) {
      activeButtons = DiepUIConfig.getGameOverButtons(g, width, height);
    }

    // 3. Collision detection for buttons
    for (const btn of activeButtons) {
      if (mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h) {
        btn.action();
        
        // Handle engine ticker state
        if (!g.isPaused && g.isGameStarted) gameLoopCallback();
        
        drawCallback();
        return true; // The click hit a button, stop further processing
      }
    }

    return false; // Click hit empty space
  }
}