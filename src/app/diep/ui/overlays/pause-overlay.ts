import { DiepButton } from '../../core/diep.interfaces';
import { DiepMainMenu } from '../main-menu/diep.main-menu';
import { DiepHighScoreRenderer } from '../diep.high-score-renderer';

export class DiepPauseOverlay {
  public static draw(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = 'bold 64px Inter, sans-serif';
    ctx.fillStyle = '#f39c12';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', width / 2, height / 2 - 100);

    DiepHighScoreRenderer.drawList(ctx, width * 0.875, height / 2 - 200, g.topScores, null, '#f39c12');
    this.getButtons(g, width, height).forEach((btn) => DiepMainMenu.drawButton(ctx, btn));
  }

  public static getButtons(g: any, width: number, height: number): DiepButton[] {
    return [
      {
        id: 'resume-btn',
        label: 'RESUME',
        x: width / 2 - 100, y: height / 2 - 30, w: 200, h: 50,
        color: '#2ecc71', borderColor: '#27ae60',
        action: () => g.togglePause()
      },
      {
        id: 'main-menu-pause-btn',
        label: 'MAIN MENU',
        x: width / 2 - 100, y: height / 2 + 40, w: 200, h: 50,
        color: '#e74c3c', borderColor: '#c0392b',
        action: () => g.returnToMainMenuWithFade()
      },
      {
        id: 'dark-mode-btn',
        label: g.isDarkMode ? 'LIGHT MODE' : 'DARK MODE',
        x: width / 2 - 100, y: height / 2 + 110, w: 200, h: 40,
        color: '#95a5a6', borderColor: '#7f8c8d',
        action: () => g.toggleDarkMode()
      }
    ];
  }
}