import { Achievement, DiepButton } from '../diep.interfaces';
import { DiepUIConfig } from './diep.ui-layout';

export class DiepAchievementMenu {
  private static scrollY = 0;
  private static targetScrollY = 0;
  private static isDragging = false;
  private static lastMouseY = 0;

  public static render(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    this.handleKeyboardScroll(g);
    this.scrollY += (this.targetScrollY - this.scrollY) * 0.15;

    const totalScore = g.achievementService.achievements
      .filter((a: Achievement) => a.isUnlocked)
      .reduce((sum: number, a: Achievement) => sum + (a.weight || 0), 0);

    const sorted = this.getSortedAchievements(g.achievementService.achievements);
    
    const colCount = 2;
    const rowSpacing = 110;
    const colWidth = (width - 120) / colCount; 
    const totalRows = Math.ceil(sorted.length / colCount);
    const totalHeight = Math.max(height, totalRows * rowSpacing);

    ctx.fillStyle = 'rgba(12, 10, 5, 0.99)'; 
    ctx.fillRect(0, 0, width, height);

    let displayOffset = this.scrollY % totalHeight;
    if (displayOffset > 0) displayOffset -= totalHeight;

    const startY = 80; 
    const viewHeight = height - startY - 20; 

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, startY - 10, width, viewHeight + 10);
    ctx.clip();

    for (let loop = 0; loop < 2; loop++) {
      sorted.forEach((ach, i) => {
        const row = Math.floor(i / colCount);
        const col = i % colCount;
        const x = 60 + (col * colWidth);
        const y = 140 + displayOffset + (row * rowSpacing) + (loop * totalHeight);
        
        if (y < startY - 150 || y > height + 150) return;
        this.drawEntry(ctx, ach, x, y, colWidth - 20, startY, viewHeight);
      });
    }
    ctx.restore();

    this.drawFades(ctx, width, height, startY, viewHeight);
    this.drawHeader(ctx, width, totalScore);
    this.drawScrollbar(ctx, width, startY, viewHeight, totalHeight);

    const buttons = DiepUIConfig.getAchievementMenuButtons(g, width, height);
    buttons.forEach(btn => this.drawAchievementButton(ctx, btn));
  }

  private static drawHeader(ctx: CanvasRenderingContext2D, width: number, score: number): void {
    ctx.fillStyle = 'rgba(12, 10, 5, 1)';
    ctx.fillRect(0, 0, width, 75);

    ctx.textAlign = 'center';
    ctx.font = '900 32px Inter, sans-serif';
    ctx.fillStyle = '#f1c40f'; 
    ctx.fillText('ACHIEVEMENTS', width / 2, 45);
    
    ctx.font = '900 9px Inter, sans-serif';
    ctx.fillStyle = 'rgba(241, 196, 18, 0.5)';
    ctx.fillText('DRAG OR USE W AND S TO EXPLORE', width / 2, 62);

    ctx.textAlign = 'right';
    ctx.font = '900 10px Inter, sans-serif';
    ctx.fillStyle = 'rgba(241, 196, 18, 0.6)';
    ctx.fillText('TOTAL SCORE', width - 60, 35);
    ctx.font = '900 24px Inter, sans-serif';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(score.toLocaleString(), width - 60, 60);
  }

  private static drawEntry(ctx: CanvasRenderingContext2D, ach: Achievement, x: number, y: number, width: number, startY: number, viewHeight: number): void {
    const isUnlocked = ach.isUnlocked;
    const progress = Math.min(ach.currentValue / ach.targetValue, 1);
    const cardHeight = 90;
    const halfHeight = cardHeight / 2;
    const bottomEdge = startY + viewHeight;

    const fadeDistance = 40; 
    let alpha = 1;
    if (y - halfHeight < startY + fadeDistance) alpha = Math.min(alpha, ((y - halfHeight) - startY) / fadeDistance);
    if (y + halfHeight > bottomEdge - fadeDistance) alpha = Math.min(alpha, (bottomEdge - (y + halfHeight)) / fadeDistance);

    const cardAlpha = Math.max(0, Math.min(1, alpha));
    if (cardAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = cardAlpha;

    ctx.fillStyle = isUnlocked ? 'rgba(241, 196, 15, 0.1)' : 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.roundRect(x, y - halfHeight, width, cardHeight, 12);
    ctx.fill();

    // COMPLETION BUBBLE COLORS: Gold (Unlocked), Blue (In Progress), Slate (Untouched)
    if (isUnlocked) {
        ctx.fillStyle = '#f1c40f'; // Gold
    } else if (progress > 0) {
        ctx.fillStyle = '#3498db'; // Blue
    } else {
        ctx.fillStyle = '#2c3e50'; // Slate
    }
    
    ctx.beginPath();
    ctx.arc(x + 40, y, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillStyle = isUnlocked ? '#fff' : '#7f8c8d';
    const tierLabel = ach.tier ? ` TIER ${ach.tier}` : '';
    ctx.fillText((ach.name + tierLabel).toUpperCase(), x + 75, y - 10);

    ctx.textAlign = 'right';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = isUnlocked ? '#f1c40f' : '#bdc3c7'; 
    ctx.fillText(`${Math.floor(ach.currentValue)}/${ach.targetValue}`, x + width - 20, y - 10);

    ctx.textAlign = 'left';
    ctx.font = '500 12px Inter, sans-serif';
    ctx.fillStyle = '#95a5a6';
    ctx.fillText(ach.description, x + 75, y + 10);

    const barW = 120;
    const barH = 14;
    const barX = x + width - barW - 20;
    const bottomY = y + 30;

    ctx.font = '900 11px Inter, sans-serif';
    ctx.fillStyle = isUnlocked ? '#f1c40f' : '#5d6d7e';
    ctx.fillText(`VALUE: ${ach.weight}`, x + 75, bottomY);

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.roundRect(barX, bottomY - 11, barW, barH, 4); 
    ctx.fill();

    // PROGRESS BAR FILL: Gold (Unlocked) or Blue (Progress)
    ctx.fillStyle = isUnlocked ? '#f1c40f' : '#3498db';
    if (progress > 0) {
      ctx.beginPath();
      ctx.roundRect(barX, bottomY - 11, barW * progress, barH, 4);
      ctx.fill();
    }

    ctx.textAlign = 'center';
    ctx.font = '900 9px Inter, sans-serif';
    ctx.fillStyle = progress > 0.5 ? '#000' : '#fff';
    ctx.fillText(`${Math.floor(progress * 100)}%`, barX + (barW / 2), bottomY - 1);

    ctx.restore();
  }

  public static getSortedAchievements(achievements: Achievement[]): Achievement[] {
    const groups = new Map<string, Achievement[]>();
    achievements.forEach(ach => {
      const key = ach.groupId || ach.id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(ach);
    });

    const activeAchievements: Achievement[] = [];
    groups.forEach((list) => {
      const sortedTiers = list.sort((a, b) => (a.tier || 0) - (b.tier || 0));
      const currentTask = sortedTiers.find(a => !a.isUnlocked);
      activeAchievements.push(currentTask || sortedTiers[sortedTiers.length - 1]);
    });

    return activeAchievements.sort((a, b) => {
      // 1. Status: Unlocked first
      if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;

      // 2. Sorting for Unlocked Achievements (Highest Weight First)
      if (a.isUnlocked && b.isUnlocked) {
          return b.weight - a.weight;
      }

      // 3. Sorting for Locked Achievements
      // Progress: Higher completion % first
      const aProg = a.currentValue / a.targetValue;
      const bProg = b.currentValue / b.targetValue;
      if (aProg !== bProg) return bProg - aProg;

      // Value: Lower weight first (easier targets first)
      if (a.weight !== b.weight) return a.weight - b.weight;

      // Alphabetical tie-breaker
      return a.name.localeCompare(b.name);
    });
  }

  private static drawAchievementButton(ctx: CanvasRenderingContext2D, btn: DiepButton): void {
    ctx.fillStyle = 'rgba(12, 10, 5, 0.7)';
    ctx.fillRect(btn.x - 5, btn.y - 5, btn.w + 10, btn.h + 10);

    ctx.fillStyle = btn.color;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = btn.borderColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.font = '900 22px Inter, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(btn.label.toUpperCase(), btn.x + btn.w / 2, btn.y + btn.h / 2 + 8);
  }

  private static drawFades(ctx: CanvasRenderingContext2D, w: number, h: number, startY: number, viewH: number): void {
    const fadeColor = 'rgba(12, 10, 5, 1)';
    const transparent = 'rgba(12, 10, 5, 0)';
    
    const topGrad = ctx.createLinearGradient(0, startY - 10, 0, startY + 20);
    topGrad.addColorStop(0, fadeColor);
    topGrad.addColorStop(1, transparent);
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, startY - 10, w, 30);

    const bottomY = startY + viewH;
    const botGrad = ctx.createLinearGradient(0, bottomY - 30, 0, bottomY);
    botGrad.addColorStop(0, transparent);
    botGrad.addColorStop(1, fadeColor);
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, bottomY - 30, w, 30);
  }

  private static drawScrollbar(ctx: CanvasRenderingContext2D, w: number, startY: number, viewH: number, totalH: number): void {
    const barHeight = 80;
    const barX = w - 10;
    const scrollNormalized = ((-this.scrollY % totalH) + totalH) % totalH;
    const scrollPercent = scrollNormalized / totalH;
    const barY = startY + (scrollPercent * (viewH - barHeight));
    ctx.fillStyle = `rgba(241, 196, 15, 0.4)`;
    ctx.beginPath();
    ctx.roundRect(barX, barY, 4, barHeight, 2);
    ctx.fill();
  }

  public static handleInputDown(mouseY: number): void {
    this.isDragging = true;
    this.lastMouseY = mouseY;
  }

  public static handleInputUp(): void {
    this.isDragging = false;
  }

  public static handleInputMove(mouseY: number): void {
    if (!this.isDragging) return;
    this.targetScrollY += (mouseY - this.lastMouseY);
    this.lastMouseY = mouseY;
  }

  private static handleKeyboardScroll(g: any): void {
    const speed = 12;
    if (g.keys['w'] || g.keys['W'] || g.keys['arrowup']) this.targetScrollY += speed;
    if (g.keys['s'] || g.keys['S'] || g.keys['arrowdown']) this.targetScrollY -= speed;
  }
}