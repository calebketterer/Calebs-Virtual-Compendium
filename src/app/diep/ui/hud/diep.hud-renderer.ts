import { DiepXpBarRenderer } from './diep.xp-bar-renderer';
import { DiepHealthBarRenderer } from './diep.health-bar-renderer';

/**
 * DiepHudRenderer handles all fixed-position UI elements.
 * This separates the "Game World" (tanks/bullets) from the "Interface" (bars/text).
 */
export class DiepHudRenderer {

  public static draw(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    const isOverlayActive = g.isPaused || (g.gameOver && g.deathAnimationTimeStart === null);
    const uiTextColor = isOverlayActive ? '#fff' : (g.isDarkMode ? '#ecf0f1' : '#333');

    // Draw Sub-modules
    DiepHealthBarRenderer.draw(ctx, g.player);
    DiepXpBarRenderer.draw(ctx, g.player, width, height);
    
    // Draw remaining global HUD elements
    this.drawSessionStats(ctx, g, width, uiTextColor);
    this.drawNotifications(ctx, width);
  }

  private static drawSessionStats(ctx: CanvasRenderingContext2D, g: any, width: number, textColor: string): void {
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    
    ctx.fillText('SCORE: ' + g.score, width - 20, 35);
    ctx.fillText('WAVE: ' + g.waveManager.waveCount, width - 20, 60);
  }

  /**
   * PLACEHOLDER: For Level Up, Wave Start, or Achievement alerts.
   */
  private static drawNotifications(ctx: CanvasRenderingContext2D, width: number): void {
    // Logic for center-screen announcements or fading alerts goes here.
  }
}