import { DiepEntities } from './diep.renderer';
import { DiepQuadriviumMenu } from './quadrivium/diep.quadrivium-menu';
import { DiepAchievementMenu } from './achievements/diep.achievement-menu';
import { DiepMainMenu } from './main-menu/diep.main-menu';
import { DiepPauseOverlay } from './overlays/pause-overlay';
import { DiepGameOverOverlay } from './overlays/game-over-overlay';
import { DiepHudRenderer } from './hud/diep.hud-renderer';
import { DiepBackgroundRenderer } from './diep.background-renderer';

export class DiepMenus {
  public static renderGame(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    const tiles = g.arenaManager?.getAllTiles() || [];
    const tileSize = g.arenaManager?.tileSize || 50;
    const isArenaActive = g.arenaEnabled !== false;

    // 1. Draw Ground (Grid and Holes)
    if (g.arenaManager) {
      DiepBackgroundRenderer.drawGround(ctx, width, height, tileSize, tiles);
    } else {
      DiepEntities.drawBackground(ctx, g.isDarkMode, width, height);
    }

    // 2. Draw World Objects (Ground Layer)
    if (g.isGameStarted || g.gameOver) {
      DiepEntities.drawToxicTrails(ctx, g.toxicTrails);
      
      const visibleEnemies = g.getVisibleEnemies();
      const groundEnemies = visibleEnemies.filter((e: any) => !e.isFlying);
      DiepEntities.drawEnemiesWithBars(ctx, groundEnemies, g.player, g.bullets);
      
      DiepEntities.drawPlayer(ctx, g.player, g.gameOver);
      DiepEntities.drawBullets(ctx, g.bullets);
    }

    // 3. PASS 2: Draw Walls
    // Only draw walls if the dynamic arena feature is toggled on.
    if (g.arenaManager && isArenaActive) {
      DiepBackgroundRenderer.drawWalls(ctx, tileSize, tiles);
    }

    // 4. Draw Flying Entities
    if (g.isGameStarted || g.gameOver) {
        const visibleEnemies = g.getVisibleEnemies();
        const flyingEnemies = visibleEnemies.filter((e: any) => e.isFlying);
        if (flyingEnemies.length > 0) {
            DiepEntities.drawEnemiesWithBars(ctx, flyingEnemies, g.player, g.bullets);
        }
    }

    // 5. Draw HUD
    if (g.isGameStarted || g.gameOver || g.isPaused) {
      DiepHudRenderer.draw(ctx, g, width, height);
    }

    // 6. UI Router
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