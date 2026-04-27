import { Player, Enemy, Bullet, TrailSegment } from '../core/diep.interfaces';
import { EnemyRegistry } from '../enemies/enemy.registry';

/**
 * DiepEntities acts as the master drawing coordinator for the game world.
 * It handles the player, bullets, and world objects directly.
 */
export class DiepEntities {

  public static drawEnemiesWithBars(ctx: CanvasRenderingContext2D, enemies: Enemy[], player: Player, bullets: Bullet[]): void {
    enemies.forEach(enemy => {
      EnemyRegistry.draw(ctx, enemy, player, bullets);
      this.drawHealthBar(ctx, enemy);
    });
  }

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

  public static drawBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[]): void {
    bullets.forEach(bullet => {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fillStyle = bullet.color;
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (bullet.health < bullet.maxHealth) {
        this.drawBulletHealthBar(ctx, bullet);
      }
    });
  }

  private static drawBulletHealthBar(ctx: CanvasRenderingContext2D, bullet: Bullet): void {
    const barWidth = bullet.radius * 2.5;
    const barHeight = 3;
    const x = bullet.x - barWidth / 2;
    const y = bullet.y - bullet.radius - 8;

    ctx.fillStyle = 'rgba(52, 73, 94, 0.5)';
    ctx.fillRect(x, y, barWidth, barHeight);

    const healthPct = bullet.health / bullet.maxHealth;
    ctx.fillStyle = healthPct > 0.4 ? '#2ecc71' : '#e67e22';
    ctx.fillRect(x, y, barWidth * healthPct, barHeight);
  }

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

  public static drawBackground(ctx: CanvasRenderingContext2D, isDarkMode: boolean, width: number, height: number): void {
    ctx.fillStyle = isDarkMode ? '#1e1e1e' : '#f4f4f4';
    ctx.fillRect(0, 0, width, height);
  }
}