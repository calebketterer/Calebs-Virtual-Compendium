import { Player, Enemy, Bullet } from './diep.interfaces';
import { EnemyRegistry } from './enemies/enemy.registry';

/**
 * DiepEntities acts as the master drawing coordinator for the game world.
 * It handles the player and bullets directly, but delegates complex 
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

    // Background (Gray)
    ctx.fillStyle = '#34495e';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Foreground (Green/Orange based on health)
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
      
      // Bullet Border
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }
}