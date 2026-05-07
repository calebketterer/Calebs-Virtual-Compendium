import { Player, Enemy, Bullet, TrailSegment } from '../core/diep.interfaces';
import { EnemyRegistry } from '../enemies/enemy.registry';
import { DiepBackgroundRenderer } from './diep.background-renderer';

export class DiepWorldRenderer {
  /**
   * This is the NEW Master Render Call. 
   * It handles the correct layering (Ground -> World -> Walls -> Flying).
   */
  public static renderWorld(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    const tiles = g.arenaManager?.getAllTiles() || [];
    const tileSize = g.arenaManager?.tileSize || 50;
    const isArenaActive = g.arenaEnabled !== false;

    // 1. Layer: Ground (Grid and Holes)
    if (g.arenaManager) {
      DiepBackgroundRenderer.drawGround(ctx, width, height, tileSize, tiles);
    } else {
      this.drawSimpleBackground(ctx, g.isDarkMode, width, height);
    }

    // 2. Layer: World Objects & Ground Enemies
    if (g.isGameStarted || g.gameOver) {
      this.drawToxicTrails(ctx, g.toxicTrails);
      
      const visibleEnemies = g.getVisibleEnemies();
      const groundEnemies = visibleEnemies.filter((e: any) => !e.isFlying);
      
      this.drawEnemiesWithBars(ctx, groundEnemies, g.player, g.bullets);
      this.drawPlayer(ctx, g.player, g.gameOver);
      this.drawBullets(ctx, g.bullets);
    }

    // 3. Layer: Walls (Decision: Drawn on top of ground entities for depth)
    if (g.arenaManager && isArenaActive) {
      DiepBackgroundRenderer.drawWalls(ctx, tileSize, tiles);
    }

    // 4. Layer: Flying Entities (Drawn over walls)
    if (g.isGameStarted || g.gameOver) {
      const visibleEnemies = g.getVisibleEnemies();
      const flyingEnemies = visibleEnemies.filter((e: any) => e.isFlying);
      if (flyingEnemies.length > 0) {
        this.drawEnemiesWithBars(ctx, flyingEnemies, g.player, g.bullets);
      }
    }
  }

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

  private static drawSimpleBackground(ctx: CanvasRenderingContext2D, isDarkMode: boolean, width: number, height: number): void {
    ctx.fillStyle = isDarkMode ? '#1e1e1e' : '#f4f4f4';
    ctx.fillRect(0, 0, width, height);
  }
}