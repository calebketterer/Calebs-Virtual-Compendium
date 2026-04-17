import { HighScore } from './diep.interfaces';
import { DiepEntities } from './diep.entities';

/**
 * diep.menus.ts
 */

interface MenuState {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  isGameStarted: boolean; 
  gameOver: boolean;
  isPaused: boolean;
  score: number;
  isDarkMode: boolean;
  deathAnimationTimeStart: number | null;
  topScores: HighScore[];
}

interface ButtonArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GameOverButtons {
  replay: ButtonArea;
  mainMenu: ButtonArea;
}

export class DiepMenus {

  /**
   * MASTER RENDERER: The only method the component needs to call.
   */
  public static renderGame(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    const menuState: MenuState = {
      ctx, width, height,
      isGameStarted: g.isGameStarted,
      gameOver: g.gameOver,
      isPaused: g.isPaused,
      score: g.score,
      isDarkMode: g.isDarkMode,
      deathAnimationTimeStart: g.deathAnimationTimeStart,
      topScores: g.topScores,
    };

    // 1. Background
    DiepEntities.drawBackground(ctx, g.isDarkMode, width, height);

    // 2. Game World
    if (g.isGameStarted || g.gameOver) {
      DiepEntities.drawToxicTrails(ctx, g.toxicTrails);
      DiepEntities.drawPlayer(ctx, g.player, g.gameOver);
      DiepEntities.drawBullets(ctx, g.bullets);
      DiepEntities.drawEnemiesWithBars(ctx, g.getVisibleEnemies(), g.player, g.bullets);
    }

    // 3. UI Overlay
    if (g.isGameStarted || g.gameOver || g.isPaused) {
      DiepEntities.drawUIOverlay(ctx, g, width);
    }

    // 4. Menus (These are the full versions you had before)
    this.drawGameOverScreen(menuState);
    this.drawPauseScreen(menuState);
    this.drawStartMenu(menuState);
    this.drawInGamePauseButton(menuState);
  }

  private static drawHighScoreList(
    ctx: CanvasRenderingContext2D,
    listCenterX: number,
    listTitleY: number,
    topScores: HighScore[],
    highlightScore: number | null,
    titleColor: string
  ): void {
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillStyle = titleColor;
    ctx.textAlign = 'center';
    ctx.fillText('HIGH SCORES', listCenterX, listTitleY);

    let listY = listTitleY + 35;

    if (topScores.length === 0) {
      ctx.font = '16px Inter, sans-serif';
      ctx.fillStyle = '#bdc3c7';
      ctx.textAlign = 'center';
      ctx.fillText('No Scores Yet', listCenterX, listY);
    } else {
      const scoreRightX = listCenterX - 15;
      const dateLeftX = listCenterX + 15;

      topScores.forEach((scoreEntry: HighScore) => {
        const dateObj = new Date(scoreEntry.date);
        const dateString = dateObj.toLocaleDateString('en-US', {
          month: 'numeric', day: 'numeric', year: '2-digit'
        });

        const isHighlighted = (highlightScore !== null && scoreEntry.score === highlightScore);
        const scoreColor = isHighlighted ? '#FFD700' : '#FFF';

        ctx.font = isHighlighted ? 'bold 20px Inter, sans-serif' : 'bold 16px Inter, sans-serif';
        ctx.fillStyle = scoreColor;

        ctx.textAlign = 'right';
        ctx.fillText(scoreEntry.score.toString(), scoreRightX, listY);

        ctx.textAlign = 'left';
        ctx.fillText(dateString, dateLeftX, listY);

        listY += 25;
      });
    }
    ctx.textAlign = 'center';
  }

  public static drawStartMenu(state: MenuState): ButtonArea | null {
    const { ctx, width, height, isGameStarted } = state;

    if (!isGameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = '900 70px Inter, sans-serif';
      ctx.fillStyle = '#3498db';
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 10;
      ctx.textAlign = 'center';
      ctx.fillText('Diep Singleplayer', width / 2, height / 2 - 120);

      ctx.font = 'italic bold 20px Inter, sans-serif';
      ctx.fillStyle = '#bdc3c7';
      ctx.fillText('Shape Warfare: Destroy Shapes and Dodge Enemies', width / 2, height / 2 - 60);

      const btnW = 200;
      const btnH = 55;
      const btnX = width / 2 - (btnW / 2);
      const btnY = height / 2 + 20;

      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 4;
      ctx.strokeRect(btnX, btnY, btnW, btnH);

      ctx.font = 'bold 30px Inter, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('START', width / 2, btnY + 37);

      ctx.font = '16px Inter, sans-serif';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText('Use WASD to move and Mouse to aim.', width / 2, height / 2 + 120);

      return { x: btnX, y: btnY, w: btnW, h: btnH };
    }
    return null;
  }

  public static drawGameOverScreen(state: MenuState): GameOverButtons | null {
    const { ctx, width, height, gameOver, deathAnimationTimeStart, score, topScores } = state;

    if (gameOver && deathAnimationTimeStart === null) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = 'bold 64px Inter, sans-serif';
      ctx.fillStyle = '#f1c40f';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', width / 2, height / 2 - 40);

      ctx.font = '32px Inter, sans-serif';
      ctx.fillStyle = '#ecf0f1';
      ctx.fillText('Final Score: ' + score, width / 2, height / 2 + 10);

      const hsListXRatio = 0.875;
      const listCenterX = width * hsListXRatio;
      let listTitleY = height / 2 - 200;

      DiepMenus.drawHighScoreList(ctx, listCenterX, listTitleY, topScores, score, '#3498db');

      const btnW = 160;
      const btnH = 45;
      const btnX = width / 2 - 80;

      const replayBtnY = height / 2 + 60;
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(btnX, replayBtnY, btnW, btnH);
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 3;
      ctx.strokeRect(btnX, replayBtnY, btnW, btnH);
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('REPLAY', width / 2, replayBtnY + 30);

      const menuBtnY = height / 2 + 120;
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(btnX, menuBtnY, btnW, btnH);
      ctx.strokeStyle = '#34495e';
      ctx.lineWidth = 3;
      ctx.strokeRect(btnX, menuBtnY, btnW, btnH);
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('MAIN MENU', width / 2, menuBtnY + 30);

      return {
        replay: { x: btnX, y: replayBtnY, w: btnW, h: btnH },
        mainMenu: { x: btnX, y: menuBtnY, w: btnW, h: btnH }
      };
    }
    return null;
  }

  public static drawPauseScreen(state: MenuState): void {
    const { ctx, width, height, isPaused, isDarkMode, topScores } = state;

    if (isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = 'bold 64px Inter, sans-serif';
      ctx.fillStyle = '#f39c12';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', width / 2, height / 2 - 100);

      const playBtnW = 160;
      const playBtnH = 45;
      const playBtnX = width / 2 - (playBtnW / 2);
      const playBtnY = height / 2 - 40;

      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(playBtnX, playBtnY, playBtnW, playBtnH);
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 3;
      ctx.strokeRect(playBtnX, playBtnY, playBtnW, playBtnH);

      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('RESUME', width / 2, playBtnY + 30);

      const toggleBtnW = 280;
      const toggleBtnH = 45;
      const toggleBtnX = width / 2 - (toggleBtnW / 2);
      const toggleBtnY = height / 2 + 40;

      ctx.fillStyle = isDarkMode ? '#34495e' : '#ecf0f1';
      ctx.fillRect(toggleBtnX, toggleBtnY, toggleBtnW, toggleBtnH);
      ctx.strokeStyle = isDarkMode ? '#2c3e50' : '#bdc3c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(toggleBtnX, toggleBtnY, toggleBtnW, toggleBtnH);

      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillStyle = isDarkMode ? '#ecf0f1' : '#333';
      const toggleText = isDarkMode ? 'CLICK FOR LIGHT MODE 🌞' : 'CLICK FOR DARK MODE 🌙';
      ctx.fillText(toggleText, width / 2, toggleBtnY + 30);

      const hsListXRatio = 0.875;
      const listCenterX = width * hsListXRatio;
      let listTitleY = height / 2 - 200;

      DiepMenus.drawHighScoreList(ctx, listCenterX, listTitleY, topScores, null, '#f39c12');
      ctx.textAlign = 'center';
    }
  }

  public static drawInGamePauseButton(state: MenuState): ButtonArea | null {
    const { ctx, width, gameOver, isPaused, isGameStarted } = state;

    if (!gameOver && isGameStarted) {
      const btnRadius = 20;
      const btnX = width / 2;
      const btnY = 35;
      
      ctx.fillStyle = 'rgba(52, 152, 219, 0.9)';
      ctx.beginPath();
      ctx.arc(btnX, btnY, btnRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      if (isPaused) {
        ctx.beginPath();
        ctx.moveTo(btnX - 5, btnY - 8);
        ctx.lineTo(btnX - 5, btnY + 8);
        ctx.lineTo(btnX + 7, btnY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillRect(btnX - 6, btnY - 8, 4, 16);
        ctx.fillRect(btnX + 2, btnY - 8, 4, 16);
      }
      return { x: btnX - btnRadius, y: btnY - btnRadius, w: btnRadius * 2, h: btnRadius * 2 };
    }
    return null;
  }
}