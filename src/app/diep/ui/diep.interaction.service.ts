import { Injectable } from '@angular/core';
import { DiepGameEngineService } from '../engine/diep.game-engine.service';
import { DiepButton } from '../core/diep.interfaces';
import { DiepQuadriviumMenu } from './quadrivium/diep.quadrivium-menu';
import { DiepAchievementMenu } from './achievements/diep.achievement-menu';
import { DiepMainMenu } from './main-menu/diep.main-menu';
import { DiepPauseOverlay } from './overlays/pause-overlay';
import { DiepGameOverOverlay } from './overlays/game-over-overlay';

@Injectable({ providedIn: 'root' })
export class DiepInteractionService {
  constructor(private gameEngine: DiepGameEngineService) {}

  public handleMouseEvent(
    event: MouseEvent, 
    canvas: HTMLCanvasElement, 
    gameLoopCallback: () => void, 
    drawCallback: () => void
  ): boolean {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const g = this.gameEngine;
    const { width, height } = g;

    // 1. Check In-Game Pause Circle (only if not in a full-screen menu)
    if (g.isGameStarted && !g.gameOver && !g.showingQuadrivium && !g.showingAchievements) {
      const dist = Math.sqrt(Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - 35, 2));
      if (dist < 20) {
        const wasPaused = g.togglePause();
        // If we just unpaused, we need to restart the engine ticker
        if (!wasPaused) gameLoopCallback();
        return true;
      }
    }

    // 2. Identify active button set by delegating to the specific Menu/Overlay classes
    let activeButtons: DiepButton[] = [];

    if (g.showingQuadrivium) {
      activeButtons = DiepQuadriviumMenu.getButtons(g, width, height);
    } else if (g.showingAchievements) {
      activeButtons = DiepAchievementMenu.getButtons(g, width, height);
    } else if (!g.isGameStarted) {
      activeButtons = DiepMainMenu.getButtons(g, width, height);
    } else if (g.isPaused) {
      activeButtons = DiepPauseOverlay.getButtons(g, width, height);
    } else if (g.gameOver && g.deathAnimationTimeStart === null) {
      activeButtons = DiepGameOverOverlay.getButtons(g, width, height);
    }

    // 3. Collision detection for buttons
    for (const btn of activeButtons) {
      if (
        mouseX >= btn.x && 
        mouseX <= btn.x + btn.w && 
        mouseY >= btn.y && 
        mouseY <= btn.y + btn.h
      ) {
        // Execute the button's action
        btn.action();
        
        // If the action results in the game being active and unpaused, trigger ticker
        if (!g.isPaused && g.isGameStarted) {
          gameLoopCallback();
        }
        
        // Force a re-draw to show UI changes immediately
        drawCallback();
        return true; 
      }
    }

    return false; // Click didn't hit any interactive elements
  }
}