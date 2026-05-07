import { DiepButton } from '../../core/diep.interfaces';
import { DiepDynamicTitle } from './diep.dynamic-title';
import { DiepTipsManager } from './diep.tips-manager';
import { DiepSettingsManager } from './diep.arena-settings-manager';
import { DiepArenaCheckboxRenderer } from './diep.arena-checkbox-renderer';

export class DiepMainMenu {
  public static draw(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, width, height);

    const frame = g.frameCounter || 0;
    DiepDynamicTitle.draw(ctx, width / 2, height / 2 - 120, frame);

    ctx.font = 'italic bold 20px Inter, sans-serif';
    ctx.fillStyle = '#bdc3c7';
    ctx.textAlign = 'center';
    ctx.fillText('Shape Warfare: Destroy Shapes and Dodge Enemies', width / 2, height / 2 - 60);

    const buttons = this.getButtons(g, width, height);
    const isArenaEnabled = g.hazardDirector?.enabled === true;

    buttons.forEach((btn) => {
      this.drawButton(ctx, btn);
      
      if (btn.id === 'arena-toggle-btn') {
        DiepArenaCheckboxRenderer.draw(ctx, btn.x, btn.y, btn.w, isArenaEnabled, frame);

        ctx.textAlign = 'left';
        const labelX = btn.x + btn.w + 12;
        const labelYBase = btn.y + 16;

        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Dynamic Arena', labelX, labelYBase);

        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillStyle = isArenaEnabled ? '#3498db' : '#7f8c8d';
        ctx.fillText('Beta', labelX, labelYBase + 16);
      }
    });

    DiepTipsManager.draw(ctx, width, height);
  }

  public static handleInteraction(x: number, y: number, width: number, height: number, isDoubleClick: boolean): void {
    DiepDynamicTitle.handleClick(isDoubleClick);
    DiepTipsManager.handleInteraction(x, y, width, height);
  }

  public static getButtons(g: any, width: number, height: number): DiepButton[] {
    const centerX = width / 2;
    const centerY = height / 2;
    const isActive = g.hazardDirector?.enabled === true;

    return [
      { id: 'start-btn', label: 'START GAME', x: centerX - 100, y: centerY - 20, w: 200, h: 50, color: '#2ecc71', borderColor: '#27ae60', action: () => g.startGameWithFade() },
      { id: 'quadrivium-btn', label: 'QUADRIVIUM', x: centerX - 100, y: centerY + 50, w: 200, h: 50, color: '#9b59b6', borderColor: '#7c4592', action: () => g.transition.fadeOut(() => g.showingQuadrivium = true) },
      { id: 'achievements-btn', label: 'ACHIEVEMENTS', x: centerX - 100, y: centerY + 120, w: 200, h: 50, color: '#f1c40f', borderColor: '#f39c12', action: () => g.transition.fadeOut(() => g.showingAchievements = true) },
      
      { 
        id: 'arena-toggle-btn', 
        label: '', 
        x: centerX + 120, y: centerY - 15, w: 40, h: 40, 
        color: '#1a1a1a', 
        borderColor: isActive ? '#3498db' : '#444', 
        action: () => DiepSettingsManager.toggleArena(g) 
      }
    ];
  }

  public static drawButton(ctx: CanvasRenderingContext2D, btn: DiepButton): void {
    ctx.fillStyle = btn.color;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = btn.borderColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    if (btn.label) {
      ctx.font = btn.fontSize || 'bold 20px Inter, sans-serif';
      ctx.fillStyle = btn.textColor || '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + (btn.fontSize?.includes('30px') ? 10 : 7));
    }
  }
}