import { DiepXpBarRenderer } from './diep.xp-bar-renderer';
import { DiepHealthBarRenderer } from './diep.health-bar-renderer';
import { DiepUpgradeMenuRenderer } from './upgrade-menu/diep.upgrade-menu-renderer';
import { DiepPauseButtonRenderer } from './diep.pause-button-renderer';
import { DiepAchievementToastRenderer } from './diep.achievement-toast';

/**
 * DiepHudRenderer handles all fixed-position UI elements.
 * This separates the "Game World" (tanks/bullets) from the "Interface" (bars/text).
 */
export class DiepHudRenderer {

  public static draw(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    // 1. Internal Visibility Check
    if (!g.isGameStarted) return;

    const isOverlayActive = g.isPaused || (g.gameOver && g.deathAnimationTimeStart === null);
    const uiTextColor = isOverlayActive ? '#fff' : (g.isDarkMode ? '#ecf0f1' : '#333');

    // 2. Draw Sub-modules (Bars and Menus)
    DiepHealthBarRenderer.draw(ctx, g.player);
    DiepXpBarRenderer.draw(ctx, g.player, width, height);
    DiepUpgradeMenuRenderer.draw(ctx, g, height);
    
    // 3. Draw Global Stats (Score/Wave/Notifs)
    this.drawSessionStats(ctx, g, width, uiTextColor);
    this.drawNotifications(ctx, g, width);

    // 4. Draw the Pause Button Toggle
    DiepPauseButtonRenderer.draw(ctx, g, width);
  }

  private static drawSessionStats(ctx: CanvasRenderingContext2D, g: any, width: number, textColor: string): void {
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    
    ctx.fillText('SCORE: ' + g.score, width - 20, 35);
    ctx.fillText('WAVE: ' + g.waveManager.waveCount, width - 20, 60);
  }

  private static drawNotifications(ctx: CanvasRenderingContext2D, g: any, width: number): void {
    DiepAchievementToastRenderer.draw(ctx, width);
  }
}