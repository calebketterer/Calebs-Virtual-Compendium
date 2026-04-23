import { DiepButton } from '../../core/diep.interfaces';
import { DiepDynamicTitle } from './diep.dynamic-title';
import { DiepTipsManager } from './diep.tips-manager';

export class DiepMainMenu {
  public static draw(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, width, height);

    DiepDynamicTitle.draw(ctx, width / 2, height / 2 - 120, g.frameCounter || 0);

    ctx.font = 'italic bold 20px Inter, sans-serif';
    ctx.fillStyle = '#bdc3c7';
    ctx.textAlign = 'center';
    ctx.fillText('Shape Warfare: Destroy Shapes and Dodge Enemies', width / 2, height / 2 - 60);

    this.getButtons(g, width, height).forEach((btn) => this.drawButton(ctx, btn));

    DiepTipsManager.draw(ctx, width, height);
  }

  public static handleInteraction(x: number, y: number, width: number, height: number, isDoubleClick: boolean): void {
    DiepDynamicTitle.handleClick(isDoubleClick);
    // Updated to match the function name in DiepTipsManager
    DiepTipsManager.handleInteraction(x, y, width, height);
  }

  public static getButtons(g: any, width: number, height: number): DiepButton[] {
    return [
      { id: 'start-btn', label: 'START GAME', x: width / 2 - 100, y: height / 2 - 20, w: 200, h: 50, color: '#2ecc71', borderColor: '#27ae60', action: () => g.startGameWithFade() },
      { id: 'quadrivium-btn', label: 'QUADRIVIUM', x: width / 2 - 100, y: height / 2 + 50, w: 200, h: 50, color: '#9b59b6', borderColor: '#7c4592', action: () => g.transition.fadeOut(() => g.showingQuadrivium = true) },
      { id: 'achievements-btn', label: 'ACHIEVEMENTS', x: width / 2 - 100, y: height / 2 + 120, w: 200, h: 50, color: '#f1c40f', borderColor: '#f39c12', action: () => g.transition.fadeOut(() => g.showingAchievements = true) }
    ];
  }

  public static drawButton(ctx: CanvasRenderingContext2D, btn: DiepButton): void {
    ctx.fillStyle = btn.color;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = btn.borderColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.font = btn.fontSize || 'bold 20px Inter, sans-serif';
    ctx.fillStyle = btn.textColor || '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + (btn.fontSize?.includes('30px') ? 10 : 7));
  }
}