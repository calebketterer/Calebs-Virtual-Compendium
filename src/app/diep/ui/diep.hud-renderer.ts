import { Player } from '../core/diep.interfaces';

/**
 * DiepHudRenderer handles all fixed-position UI elements.
 * This separates the "Game World" (tanks/bullets) from the "Interface" (bars/text).
 */
export class DiepHudRenderer {

  public static draw(ctx: CanvasRenderingContext2D, g: any, width: number): void {
    const isOverlayActive = g.isPaused || (g.gameOver && g.deathAnimationTimeStart === null);
    const uiTextColor = isOverlayActive ? '#fff' : (g.isDarkMode ? '#ecf0f1' : '#333');

    this.drawPlayerHealth(ctx, g.player);
    this.drawSessionStats(ctx, g, width, uiTextColor);
    this.drawNotifications(ctx, width);
  }

  private static drawPlayerHealth(ctx: CanvasRenderingContext2D, player: Player): void {
    const healthX = 20;
    const healthY = 20;
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthRatio = player.health / player.maxHealth;

    // Background/Border
    ctx.fillStyle = '#34495e';
    ctx.fillRect(healthX - 2, healthY - 2, healthBarWidth + 4, healthBarHeight + 4); 

    // Health Fill
    ctx.fillStyle = healthRatio > 0.75 ? '#27ae60' : 
                    healthRatio > 0.50 ? '#f1c40f' : 
                    healthRatio > 0.25 ? '#e67e22' : '#e74c3c';
    ctx.fillRect(healthX, healthY, healthBarWidth * healthRatio, healthBarHeight);
    
    // Label
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(`PLAYER HEALTH: ${Math.ceil(player.health)}%`, healthX + 5, healthY + 14);
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