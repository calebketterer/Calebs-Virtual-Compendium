import { Player, Enemy, Bullet, TrailSegment } from './diep.interfaces';
import { EnemyRegistry } from './enemies/enemy.registry';

/**
 * DiepEntities acts as the master drawing coordinator for the game world.
 * It handles the player, bullets, and UI directly, but delegates complex 
 * enemy visuals to the EnemyRegistry.
 */
export class DiepEntities {

  /**
   * Main entry point for drawing the enemy layer.
   */
  public static drawEnemiesWithBars(ctx: CanvasRenderingContext2D, enemies: Enemy[], player: Player, bullets: Bullet[]): void {
    enemies.forEach(enemy => {
      // 1. Delegate specific shape drawing to the individual enemy files via the Registry
      EnemyRegistry.draw(ctx, enemy, player, bullets);
      
      // 2. Draw the Health Bar (Common UI element for all enemies)
      this.drawHealthBar(ctx, enemy);
    });
  }

  /**
   * Draws the health bar above an enemy if they have taken damage.
   */
  private static drawHealthBar(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
    if (enemy.health >= enemy.maxHealth) return;

    const barWidth = enemy.radius * 2;
    const barHeight = 4;
    const x = enemy.x - enemy.radius;
    const y = enemy.y - enemy.radius - 12;

    ctx.fillStyle = '#34495e';
    ctx.fillRect(x, y, barWidth, barHeight);

    const healthPct = enemy.health / enemy.maxHealth;
    ctx.fillStyle = healthPct > 0.4 ? '#2ecc71' : '#e67e22';
    ctx.fillRect(x, y, barWidth * healthPct, barHeight);
  }

  /**
   * Draws the player tank and its barrel.
   */
  public static drawPlayer(ctx: CanvasRenderingContext2D, player: Player, isGameOver: boolean): void {
    if (isGameOver) return;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Barrel
    ctx.fillStyle = '#95a5a6';
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 2;
    ctx.fillRect(0, -player.radius * 0.4, player.radius * 1.8, player.radius * 0.8);
    ctx.strokeRect(0, -player.radius * 0.4, player.radius * 1.8, player.radius * 0.8);

    // Body
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.strokeStyle = '#2980b9';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draws all active bullets on the screen.
   */
  public static drawBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[]): void {
    bullets.forEach(bullet => {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fillStyle = bullet.color;
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  /**
   * NEW: Draws the toxic trails (called before player/enemies for layering)
   */
  public static drawToxicTrails(ctx: CanvasRenderingContext2D, trails: TrailSegment[]): void {
    trails.forEach(trail => {
      ctx.beginPath();
      ctx.globalAlpha = trail.opacity;
      ctx.fillStyle = trail.color;
      ctx.arc(trail.x, trail.y, trail.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
    });
    ctx.globalAlpha = 1.0; 
  }

  /**
   * NEW: Draws the HUD (Player Health, Score, Wave)
   */
  public static drawUIOverlay(ctx: CanvasRenderingContext2D, gameEngine: any, width: number): void {
    const g = gameEngine;
    const isOverlayActive = g.isPaused || (g.gameOver && g.deathAnimationTimeStart === null);
    const uiTextColor = isOverlayActive ? '#fff' : (g.isDarkMode ? '#ecf0f1' : '#333');

    // Health Bar
    const healthX = 20;
    const healthY = 20;
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthRatio = g.player.health / g.player.maxHealth;

    ctx.fillStyle = '#34495e';
    ctx.fillRect(healthX - 2, healthY - 2, healthBarWidth + 4, healthBarHeight + 4); 

    ctx.fillStyle = healthRatio > 0.3 ? '#27ae60' : '#e67e22'; 
    ctx.fillRect(healthX, healthY, healthBarWidth * healthRatio, healthBarHeight);
    
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(`PLAYER HEALTH: ${Math.ceil(g.player.health)}%`, healthX + 5, healthY + 14);

    // Score & Wave
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillStyle = uiTextColor;
    ctx.textAlign = 'right';
    ctx.fillText('SCORE: ' + g.score, width - 20, 35);
    ctx.fillText('WAVE: ' + g.waveManager.waveCount, width - 20, 60);
  }

  /**
   * NEW: Handles the background fill
   */
  public static drawBackground(ctx: CanvasRenderingContext2D, isDarkMode: boolean, width: number, height: number): void {
    ctx.fillStyle = isDarkMode ? '#1e1e1e' : '#f4f4f4';
    ctx.fillRect(0, 0, width, height);
  }
}