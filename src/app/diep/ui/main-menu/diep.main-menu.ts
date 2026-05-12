import { DiepButton } from '../../core/diep.interfaces';
import { DiepDynamicTitle } from './diep.dynamic-title';
import { DiepTipsManager } from './diep.tips-manager';
import { DiepSettingsManager } from './diep.arena-settings-manager';
import { DiepArenaCheckboxRenderer } from './diep.arena-checkbox-renderer';
import { DiepButtonRenderer } from '../diep.button-renderer';

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
      // The Renderer handles the hover check and animator logic internally
      DiepButtonRenderer.draw(ctx, btn, g);
      
      if (btn.id === 'arena-toggle-btn') {
        // Pass the work to the specialized renderer
        DiepArenaCheckboxRenderer.draw(ctx, btn, g, isArenaEnabled, frame);
        
        ctx.textAlign = 'left';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Dynamic Arena', btn.x + btn.w + 12, btn.y + 16);

        // Beta Label
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillStyle = isArenaEnabled ? '#3498db' : '#7f8c8d';
        ctx.fillText('Beta', btn.x + btn.w + 12, btn.y + 32);
      }
    });

    DiepTipsManager.draw(ctx, width, height);
  }

  public static getButtons(g: any, width: number, height: number): DiepButton[] {
    const centerX = width / 2;
    const centerY = height / 2;
    const isActive = g.hazardDirector?.enabled === true;

    return [
      { id: 'start-btn', label: 'START GAME', x: centerX - 100, y: centerY - 20, w: 200, h: 50, color: '#2ecc71', borderColor: '#27ae60', hoverEffect: 'grow', action: () => g.startGameWithFade() },
      { id: 'quadrivium-btn', label: 'QUADRIVIUM', x: centerX - 100, y: centerY + 50, w: 200, h: 50, color: '#9b59b6', borderColor: '#7c4592', hoverEffect: 'grow', action: () => g.transition.fadeOut(() => g.showingQuadrivium = true) },
      { id: 'achievements-btn', label: 'ACHIEVEMENTS', x: centerX - 100, y: centerY + 120, w: 200, h: 50, color: '#f1c40f', borderColor: '#f39c12', hoverEffect: 'grow', action: () => g.transition.fadeOut(() => g.showingAchievements = true) },
      { id: 'arena-toggle-btn', label: '', x: centerX + 120, y: centerY - 15, w: 40, h: 40, color: '#1a1a1a', borderColor: isActive ? '#3498db' : '#444', action: () => DiepSettingsManager.toggleArena(g) }
    ];
  }
}