import { HighScore, DiepButton } from '../diep.interfaces';
import { DiepEntities } from './diep.renderer';
import { DiepUIConfig } from './diep.ui-layout';
import { DiepQuadriviumMenu } from './diep.quadrivium-menu';
import { DiepAchievementMenu } from './diep.achievement-menu';

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
      DiepEntities.drawUIOverlay(ctx, g, width);
    }

    // Router - Logic contained in respective files
    if (g.showingQuadrivium) {
      DiepQuadriviumMenu.render(ctx, g, width, height);
    } else if (g.showingAchievements) {
      DiepAchievementMenu.render(ctx, g, width, height);
    } else {
      if (!g.isGameStarted) this.drawStartMenu(ctx, g, width, height);
      if (g.isPaused) this.drawPauseScreen(ctx, g, width, height);
      if (g.gameOver && g.deathAnimationTimeStart === null) this.drawGameOverScreen(ctx, g, width, height);
    }
    
    this.drawInGamePauseButton(ctx, g, width, height);

    if (g.transition) {
      g.transition.draw(ctx, width, height);
    }
  }

  /**
   * Universal Button Renderer - Restored borders and proper text centering
   */
  public static drawButton(ctx: CanvasRenderingContext2D, btn: DiepButton): void {
    // Box
    ctx.fillStyle = btn.color;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    
    // Border
    ctx.strokeStyle = btn.borderColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    // Text
    ctx.font = btn.fontSize || 'bold 20px Inter, sans-serif';
    ctx.fillStyle = btn.textColor || '#fff';
    ctx.textAlign = 'center';
    
    // Vertical centering adjustment for larger font sizes
    const verticalOffset = btn.fontSize?.includes('30px') ? 10 : 7;
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + verticalOffset);
  }

  private static drawStartMenu(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = '900 70px Inter, sans-serif';
    ctx.fillStyle = '#3498db';
    ctx.textAlign = 'center';
    ctx.fillText('Diep Singleplayer', width / 2, height / 2 - 120);

    ctx.font = 'italic bold 20px Inter, sans-serif';
    ctx.fillStyle = '#bdc3c7';
    ctx.fillText('Shape Warfare: Destroy Shapes and Dodge Enemies', width / 2, height / 2 - 60);

    DiepUIConfig.getStartMenuButtons(g, width, height).forEach((btn: DiepButton) => this.drawButton(ctx, btn));

    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = '#7f8c8d';
    ctx.fillText('Use WASD to move and Mouse to aim.', width / 2, height / 2 + 190);
  }

  private static drawGameOverScreen(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = 'bold 64px Inter, sans-serif';
    ctx.fillStyle = '#f1c40f';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', width / 2, height / 2 - 40);

    ctx.font = '32px Inter, sans-serif';
    ctx.fillStyle = '#ecf0f1';
    ctx.fillText('Final Score: ' + g.score, width / 2, height / 2 + 10);

    this.drawHighScoreList(ctx, width * 0.875, height / 2 - 200, g.topScores, g.score, '#3498db');
    DiepUIConfig.getGameOverButtons(g, width, height).forEach((btn: DiepButton) => this.drawButton(ctx, btn));
  }

  private static drawPauseScreen(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = 'bold 64px Inter, sans-serif';
    ctx.fillStyle = '#f39c12';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', width / 2, height / 2 - 100);

    this.drawHighScoreList(ctx, width * 0.875, height / 2 - 200, g.topScores, null, '#f39c12');
    DiepUIConfig.getPauseMenuButtons(g, width, height).forEach((btn: DiepButton) => this.drawButton(ctx, btn));
  }

  private static drawHighScoreList(ctx: CanvasRenderingContext2D, listCenterX: number, listTitleY: number, topScores: HighScore[], highlightScore: number | null, titleColor: string): void {
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillStyle = titleColor;
    ctx.textAlign = 'center';
    ctx.fillText('HIGH SCORES', listCenterX, listTitleY);

    let listY = listTitleY + 35;
    if (!topScores || topScores.length === 0) {
      ctx.font = '16px Inter, sans-serif';
      ctx.fillStyle = '#bdc3c7';
      ctx.fillText('No Scores Yet', listCenterX, listY);
    } else {
      const scoreRightX = listCenterX - 15;
      const dateLeftX = listCenterX + 15;
      topScores.forEach((scoreEntry: HighScore) => {
        const isHighlighted = (highlightScore !== null && scoreEntry.score === highlightScore);
        ctx.font = isHighlighted ? 'bold 20px Inter, sans-serif' : 'bold 16px Inter, sans-serif';
        ctx.fillStyle = isHighlighted ? '#FFD700' : '#FFF';
        ctx.textAlign = 'right';
        ctx.fillText(scoreEntry.score.toString(), scoreRightX, listY);
        ctx.textAlign = 'left';
        ctx.fillText(new Date(scoreEntry.date).toLocaleDateString('en-US', {month:'numeric', day:'numeric', year:'2-digit'}), dateLeftX, listY);
        listY += 25;
      });
    }
    ctx.textAlign = 'center';
  }

  /**
   * Fixed In-Game Pause Button - Restored icons and positioning
   */
  private static drawInGamePauseButton(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    if (!g.gameOver && g.isGameStarted) {
      const btnRadius = 20;
      const btnX = width / 2;
      const btnY = 35;

      // Circle Base
      ctx.fillStyle = 'rgba(52, 152, 219, 0.9)';
      ctx.beginPath();
      ctx.arc(btnX, btnY, btnRadius, 0, Math.PI * 2);
      ctx.fill();

      // Icon (Play/Pause)
      ctx.fillStyle = '#fff';
      if (g.isPaused) {
        // Play Triangle
        ctx.beginPath();
        ctx.moveTo(btnX - 5, btnY - 8);
        ctx.lineTo(btnX - 5, btnY + 8);
        ctx.lineTo(btnX + 7, btnY);
        ctx.fill();
      } else {
        // Pause Bars
        ctx.fillRect(btnX - 6, btnY - 8, 4, 16);
        ctx.fillRect(btnX + 2, btnY - 8, 4, 16);
      }
    }
  }
}