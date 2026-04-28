import { Player } from '../core/diep.interfaces';

/**
 * DiepHudRenderer handles all fixed-position UI elements.
 * This separates the "Game World" (tanks/bullets) from the "Interface" (bars/text).
 */
export class DiepHudRenderer {
  // Local UI state for smooth animation
  private static lerpXp: number = 0;
  private static lastLevel: number = 1;

  public static draw(ctx: CanvasRenderingContext2D, g: any, width: number, height: number): void {
    const isOverlayActive = g.isPaused || (g.gameOver && g.deathAnimationTimeStart === null);
    const uiTextColor = isOverlayActive ? '#fff' : (g.isDarkMode ? '#ecf0f1' : '#333');

    this.drawPlayerHealth(ctx, g.player);
    this.drawDiepStyleXpBar(ctx, g.player, width, height);
    this.drawSessionStats(ctx, g, width, uiTextColor);
    this.drawNotifications(ctx, width);
  }

  private static drawPlayerHealth(ctx: CanvasRenderingContext2D, player: Player): void {
    const healthX = 20;
    const healthY = 20;
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthRatio = player.health / player.maxHealth;

    // Background/Border
    ctx.fillStyle = '#34495e';
    ctx.fillRect(healthX - 2, healthY - 2, healthBarWidth + 4, healthBarHeight + 4); 

    // Health Fill
    ctx.fillStyle = healthRatio > 0.75 ? '#27ae60' : 
                    healthRatio > 0.50 ? '#f1c40f' : 
                    healthRatio > 0.25 ? '#e67e22' : '#e74c3c';
    ctx.fillRect(healthX, healthY, healthBarWidth * healthRatio, healthBarHeight);
    
    // Label
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(`PLAYER HEALTH: ${Math.ceil(player.health)}%`, healthX + 5, healthY + 14);
  }

  private static drawDiepStyleXpBar(ctx: CanvasRenderingContext2D, player: Player, width: number, height: number): void {
    const prog = player.progression;
    if (!prog) return;

    // Handle Animation Logic
    if (prog.level !== this.lastLevel) {
      this.lerpXp = 0;
      this.lastLevel = prog.level;
    }

    const speed = 0.1; 
    const diff = prog.currentXp - this.lerpXp;
    if (Math.abs(diff) > 0.1) {
      this.lerpXp += diff * speed;
    } else {
      this.lerpXp = prog.currentXp;
    }

    const barHeight = 22;
    const barWidth = 350;
    const x = (width - barWidth) / 2;
    const y = height - 45;
    const radius = barHeight / 2;
    const visualRatio = Math.max(0, Math.min(1, this.lerpXp / prog.nextLevelXp));
    
    // 1. XP Info Text
    const fractionText = `${Math.floor(prog.currentXp)} / ${prog.nextLevelXp}`;
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2; 
    ctx.strokeText(fractionText, width / 2, y - 10);
    ctx.fillText(fractionText, width / 2, y - 10);

    // 2. Background Capsule 
    // We draw the stroke first with a larger width so it acts as an "outer" border
    const strokeWidth = 6; 
    this.drawCapsule(ctx, x, y, barWidth, barHeight, radius, '#555555', '#444444', strokeWidth);

    // 3. Animated Fill
    // We draw this on top. Since the background stroke was centered, 
    // this fill will cover the inner half of that stroke.
    const fillWidth = Math.max(barHeight, barWidth * visualRatio);
    this.drawCapsule(ctx, x, y, fillWidth, barHeight, radius, '#ffe46b', 'transparent', 0);

    // 4. Level Label
    const levelText = `Lvl ${prog.level}`;
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 3;
    ctx.strokeText(levelText, width / 2, y + radius);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(levelText, width / 2, y + radius);
    
    // Reset baseline for other draw calls
    ctx.textBaseline = 'alphabetic';
  }

  private static drawCapsule(
    ctx: CanvasRenderingContext2D, 
    x: number, y: number, 
    w: number, h: number, 
    r: number, 
    fill: string, 
    stroke: string, 
    weight: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    // To prevent the stroke from bleeding into the fill, we stroke first then fill
    if (stroke !== 'transparent' && weight > 0) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = weight; 
      ctx.stroke();
    }

    ctx.fillStyle = fill;
    ctx.fill();
  }

  private static drawSessionStats(ctx: CanvasRenderingContext2D, g: any, width: number, textColor: string): void {
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    
    ctx.fillText('SCORE: ' + g.score, width - 20, 35);
    ctx.fillText('WAVE: ' + g.waveManager.waveCount, width - 20, 60);
  }

  /**
   * PLACEHOLDER: For Level Up, Wave Start, or Achievement alerts.
   */
  private static drawNotifications(ctx: CanvasRenderingContext2D, width: number): void {
    // Logic for center-screen announcements or fading alerts goes here.
  }
}