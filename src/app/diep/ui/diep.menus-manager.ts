import { DiepQuadriviumMenu } from './quadrivium/diep.quadrivium-menu';
import { DiepAchievementMenu } from './achievements/diep.achievement-menu';
import { DiepMainMenu } from './main-menu/diep.main-menu';
import { DiepPauseOverlay } from './overlays/pause-overlay';
import { DiepGameOverOverlay } from './overlays/game-over-overlay';

export class DiepMenus {
  /**
   * UI ROUTER: Only handles menus and overlays.
   * Arena rendering has been moved to DiepArenaRenderer.
   */
  public static renderUI(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    // 1. Menu Routing
    if (g.showingQuadrivium) {
      DiepQuadriviumMenu.render(ctx, g, width, height);
    } else if (g.showingAchievements) {
      DiepAchievementMenu.render(ctx, g, width, height);
    } else {
      if (!g.isGameStarted) {
        DiepMainMenu.draw(ctx, g, width, height);
      } else if (g.isPaused) {
        DiepPauseOverlay.draw(ctx, g, width, height);
      } else if (g.gameOver && g.deathAnimationTimeStart === null) {
        DiepGameOverOverlay.draw(ctx, g, width, height);
      }
    }

    if (g.transition) {
      g.transition.draw(ctx, width, height);
    }
  }
}