import { DiepButton } from '../../core/diep.interfaces';

export class DiepMainMenu {
  public static draw(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = '900 70px Inter, sans-serif';
    ctx.fillStyle = '#3498db';
    ctx.textAlign = 'center';
    ctx.fillText('Diep Singleplayer', width / 2, height / 2 - 120);

    ctx.font = 'italic bold 20px Inter, sans-serif';
    ctx.fillStyle = '#bdc3c7';
    ctx.fillText('Shape Warfare: Destroy Shapes and Dodge Enemies', width / 2, height / 2 - 60);

    this.getButtons(g, width, height).forEach((btn) => this.drawButton(ctx, btn));

    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = '#7f8c8d';
    ctx.fillText('Use WASD to move and Mouse to aim.', width / 2, height / 2 + 225);
  }

  public static getButtons(g: any, width: number, height: number): DiepButton[] {
    return [
      {
        id: 'start-btn',
        label: 'START GAME',
        x: width / 2 - 100, y: height / 2 - 20, w: 200, h: 50,
        color: '#2ecc71', borderColor: '#27ae60',
        action: () => g.startGameWithFade()
      },
      {
        id: 'quadrivium-btn',
        label: 'QUADRIVIUM',
        x: width / 2 - 100, y: height / 2 + 50, w: 200, h: 50,
        color: '#9b59b6', borderColor: '#7c4592',
        action: () => g.transition.fadeOut(() => g.showingQuadrivium = true)
      },
      {
        id: 'achievements-btn',
        label: 'ACHIEVEMENTS',
        x: width / 2 - 100, y: height / 2 + 120, w: 200, h: 50,
        color: '#f1c40f', borderColor: '#f39c12',
        action: () => g.transition.fadeOut(() => g.showingAchievements = true)
      }
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
    const verticalOffset = btn.fontSize?.includes('30px') ? 10 : 7;
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + verticalOffset);
  }
}