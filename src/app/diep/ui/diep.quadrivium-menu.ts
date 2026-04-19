import { DiepGameEngineService } from '../engine/diep.game-engine.service';
import { DiepUIConfig } from './diep.ui-layout';
import { DiepButton } from '../diep.interfaces';

export class DiepQuadriviumMenu {
  public static render(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    // 1. Background & Title
    ctx.fillStyle = 'rgba(15, 15, 25, 0.95)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = '900 60px Inter, sans-serif';
    ctx.fillStyle = '#9b59b6'; 
    ctx.textAlign = 'center';
    ctx.fillText('THE QUADRIVIUM', width / 2, 80);

    ctx.font = 'italic 20px Inter, sans-serif';
    ctx.fillStyle = '#bdc3c7';
    ctx.fillText('A record of known geometric entities', width / 2, 115);

    // 2. Draw the Entities (The actual content)
    this.drawEntityArchive(ctx, width, height);

    // 3. DRAW THE BUTTONS (Crucial for the Back Button to show up)
    // We fetch the buttons from the UI config and render them using the standard button style
    const buttons = DiepUIConfig.getQuadriviumButtons(g, width, height);
    buttons.forEach(btn => this.drawMenuButton(ctx, btn));
  }

  private static drawEntityArchive(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Placeholder for where your enemy list logic goes
    ctx.strokeStyle = '#34495e';
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(width / 2 - 300, 150, 600, 300);
    ctx.setLineDash([]);

    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillStyle = '#7f8c8d';
    ctx.fillText('DATA ENTRIES: HEALER | HAUNTER | CASTER', width / 2, 300);
  }

  private static drawMenuButton(ctx: CanvasRenderingContext2D, btn: DiepButton): void {
    ctx.fillStyle = btn.color;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    
    ctx.strokeStyle = btn.borderColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    ctx.font = btn.fontSize || 'bold 20px Inter, sans-serif';
    ctx.fillStyle = btn.textColor || '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 7);
  }
}