import { EnemyRegistry } from '../../enemies/enemy.registry';
import { DiepUIConfig } from '../diep.ui-layout';
import { QuadriviumSorter } from './diep.quadrivium-sorter';
import { QuadriviumEntryRenderer } from './quadrivium-entry.renderer';

export class DiepQuadriviumMenu {
  private static rotation = 0;
  private static scrollY = 0;
  private static targetScrollY = 0;
  private static maxScroll = 0;
  private static isDragging = false;
  private static lastMouseY = 0;

  public static render(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    this.handleKeyboardScroll(g);
    this.scrollY += (this.targetScrollY - this.scrollY) * 0.15;
    this.rotation += 0.015;

    ctx.fillStyle = 'rgba(8, 8, 15, 0.99)';
    ctx.fillRect(0, 0, width, height);

    const rawTypes = EnemyRegistry.getRegisteredTypes();
    const sortedTypes = QuadriviumSorter.sortEnemies(rawTypes);

    const startY = 145;
    const itemHeight = 110;
    const padding = 60;
    const listBottomMargin = 130; 

    const rows = Math.ceil(sortedTypes.length / 2);
    const viewHeight = height - startY - listBottomMargin;
    this.maxScroll = Math.max(0, (rows * itemHeight) - viewHeight);
    this.constrainScroll();

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, startY - 60, width, viewHeight + 100);
    ctx.clip();

    sortedTypes.forEach((type, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const columnWidth = (width - 140) / 2;
      const x = padding + (col * (columnWidth + 40));
      const y = startY + (row * itemHeight) + this.scrollY;

      if (y > startY - itemHeight && y < height + itemHeight) {
        QuadriviumEntryRenderer.drawEntry(ctx, type, x, y, columnWidth, this.rotation);
      }
    });
    ctx.restore();

    this.drawFades(ctx, width, height, startY, viewHeight);
    this.drawHeader(ctx, width);
    
    if (this.maxScroll > 0) {
      this.drawScrollbar(ctx, width, height, startY, viewHeight);
    }

    const buttons = DiepUIConfig.getQuadriviumButtons(g, width, height);
    buttons.forEach(btn => this.drawMenuButton(ctx, btn));
  }

  private static drawHeader(ctx: CanvasRenderingContext2D, width: number): void {
    ctx.fillStyle = 'rgba(8, 8, 15, 1)';
    ctx.fillRect(0, 0, width, 95);

    ctx.textAlign = 'center';
    ctx.font = '900 40px Inter, sans-serif';
    ctx.fillStyle = '#9b59b6'; 
    ctx.fillText('THE QUADRIVIUM', width / 2, 65);
    
    ctx.font = '900 10px Inter, sans-serif';
    ctx.fillStyle = 'rgba(155, 89, 182, 0.5)';
    ctx.fillText('DRAG OR USE W AND S TO EXPLORE', width / 2, 85);
  }

  private static drawFades(ctx: CanvasRenderingContext2D, w: number, h: number, startY: number, viewH: number): void {
    const fadeColor = 'rgba(8, 8, 15, 1)';
    const transparent = 'rgba(8, 8, 15, 0)';

    const topGrad = ctx.createLinearGradient(0, startY - 55, 0, startY - 5);
    topGrad.addColorStop(0, fadeColor);
    topGrad.addColorStop(1, transparent);
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, startY - 55, w, 50);

    const bottomY = startY + viewH;
    const botGrad = ctx.createLinearGradient(0, bottomY, 0, bottomY + 50);
    botGrad.addColorStop(0, transparent);
    botGrad.addColorStop(1, fadeColor);
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, bottomY, w, 50);

    ctx.fillStyle = fadeColor;
    ctx.fillRect(0, bottomY + 50, w, h - (bottomY + 50));
  }

  private static drawScrollbar(ctx: CanvasRenderingContext2D, w: number, h: number, startY: number, viewH: number): void {
    const scrollPercent = Math.abs(this.scrollY) / (this.maxScroll || 1);
    const barHeight = 80;
    const barX = w - 15;
    const barY = startY + (scrollPercent * (viewH - barHeight));
    
    ctx.fillStyle = 'rgba(155, 89, 182, 0.4)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, 4, barHeight, 2);
    ctx.fill();
  }

  private static drawMenuButton(ctx: CanvasRenderingContext2D, btn: any): void {
    ctx.fillStyle = btn.color;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.font = '900 22px Inter, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 7);
  }

  public static handleInputDown(mouseY: number): void { this.isDragging = true; this.lastMouseY = mouseY; }
  public static handleInputUp(): void { this.isDragging = false; }
  public static handleInputMove(mouseY: number): void {
    if (!this.isDragging) return;
    this.targetScrollY += (mouseY - this.lastMouseY);
    this.lastMouseY = mouseY;
    this.constrainScroll();
  }
  private static handleKeyboardScroll(g: any): void {
    const scrollSpeed = 10; 
    if (g.keys['w'] || g.keys['arrowup']) this.targetScrollY += scrollSpeed;
    if (g.keys['s'] || g.keys['arrowdown']) this.targetScrollY -= scrollSpeed;
    this.constrainScroll();
  }
  private static constrainScroll(): void {
    if (this.targetScrollY > 0) this.targetScrollY = 0;
    if (this.targetScrollY < -this.maxScroll) this.targetScrollY = -this.maxScroll;
  }
}