import { DiepEntities } from './diep.renderer';
import { DiepQuadriviumMenu } from './quadrivium/diep.quadrivium-menu';
import { DiepAchievementMenu } from './achievements/diep.achievement-menu';
import { DiepMainMenu } from './main-menu/diep.main-menu';
import { DiepPauseOverlay } from './overlays/pause-overlay';
import { DiepGameOverOverlay } from './overlays/game-over-overlay';
import { DiepHudRenderer } from './diep.hud-renderer';

export class DiepMenus {
  public static renderGame(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    DiepEntities.drawBackground(ctx, g.isDarkMode, width, height);

    if (g.isGameStarted || g.gameOver) {
      DiepEntities.drawToxicTrails(ctx, g.toxicTrails);
      DiepEntities.drawPlayer(ctx, g.player, g.gameOver);
      DiepEntities.drawBullets(ctx, g.bullets);
      DiepEntities.drawEnemiesWithBars(ctx, g.getVisibleEnemies(), g.player, g.bullets);
    }

    if (g.isGameStarted || g.gameOver || g.isPaused) {
      DiepHudRenderer.draw(ctx, g, width);
    }

    // Router - Delegating to modular files
    if (g.showingQuadrivium) {
      DiepQuadriviumMenu.render(ctx, g, width, height);
    } else if (g.showingAchievements) {
      DiepAchievementMenu.render(ctx, g, width, height);
    } else {
      if (!g.isGameStarted) DiepMainMenu.draw(ctx, g, width, height);
      else if (g.isPaused) DiepPauseOverlay.draw(ctx, g, width, height);
      else if (g.gameOver && g.deathAnimationTimeStart === null) DiepGameOverOverlay.draw(ctx, g, width, height);
    }
    
    this.drawInGamePauseButton(ctx, g, width, height);

    if (g.transition) {
      g.transition.draw(ctx, width, height);
    }
  }

  private static drawInGamePauseButton(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    if (!g.gameOver && g.isGameStarted) {
      const btnRadius = 20, btnX = width / 2, btnY = 35;
      ctx.fillStyle = 'rgba(52, 152, 219, 0.9)';
      ctx.beginPath();
      ctx.arc(btnX, btnY, btnRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      if (g.isPaused) {
        ctx.beginPath();
        ctx.moveTo(btnX - 5, btnY - 8);
        ctx.lineTo(btnX - 5, btnY + 8);
        ctx.lineTo(btnX + 7, btnY);
        ctx.fill();
      } else {
        ctx.fillRect(btnX - 6, btnY - 8, 4, 16);
        ctx.fillRect(btnX + 2, btnY - 8, 4, 16);
      }
    }
  }
}