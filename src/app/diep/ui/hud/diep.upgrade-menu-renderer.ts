import { Player, DiepButton } from '../../core/diep.interfaces';
import { UPGRADE_REGISTRY, UpgradePath } from '../../engine/subsystems/player-upgrades/diep.upgrade-registry';

export class DiepUpgradeMenuRenderer {
  private static slideX: number = -300; 
  private static readonly MENU_WIDTH = 200;
  private static readonly ROW_HEIGHT = 15; 
  private static readonly ROW_SPACING = 10;
  private static readonly CIRCLE_RADIUS = 9; 
  private static readonly DEFAULT_COLOR = '#999999';
  private static readonly STROKE_COLOR = '#444444';
  private static readonly BG_COLOR = '#3d3d3d'; 

  // MANUAL STROKE ADJUSTMENT
  private static readonly MASTER_STROKE_WEIGHT = 5;    // Outline of the bars
  private static readonly CIRCLE_STROKE_WEIGHT = 2.5;

  private static visualSpent: Record<string, number> = {};

  public static draw(ctx: CanvasRenderingContext2D, g: any, height: number): void {
    const player: Player = g.player;
    const hasPoints = player.progression.upgradePoints > 0;
    
    const targetX = hasPoints ? 25 : -this.MENU_WIDTH - 80;
    this.slideX += (targetX - this.slideX) * 0.12;

    if (this.slideX < -this.MENU_WIDTH - 70) return;

    const totalHeight = UPGRADE_REGISTRY.length * (this.ROW_HEIGHT + this.ROW_SPACING);
    const startY = height - totalHeight - 65;

    // 1. Points Label
    if (hasPoints) {
      ctx.save();
      ctx.font = '900 22px Inter, sans-serif';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(`x${player.progression.upgradePoints}`, this.slideX, startY - 15);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`x${player.progression.upgradePoints}`, this.slideX, startY - 15);
      ctx.restore();
    }

    UPGRADE_REGISTRY.forEach((path: UpgradePath, i: number) => {
      const rowY = startY + (i * (this.ROW_HEIGHT + this.ROW_SPACING));
      const actualSpent = player.upgrades[path.id] || 0;
      const themeColor = path.color || this.DEFAULT_COLOR;
      const r = this.ROW_HEIGHT / 2;

      if (this.visualSpent[path.id] === undefined) this.visualSpent[path.id] = actualSpent;
      const diff = actualSpent - this.visualSpent[path.id];
      this.visualSpent[path.id] += diff * 0.1;

      // 2. Main Background Capsule
      this.drawCapsule(ctx, this.slideX, rowY, this.MENU_WIDTH, this.ROW_HEIGHT, r, this.BG_COLOR, this.STROKE_COLOR, this.MASTER_STROKE_WEIGHT);

      // 3. Animated Fill
      ctx.save();
      this.drawCapsule(ctx, this.slideX, rowY, this.MENU_WIDTH, this.ROW_HEIGHT, r, 'transparent', 'transparent', 0);
      ctx.clip();

      const fillWidth = this.MENU_WIDTH * (this.visualSpent[path.id] / 10);
      ctx.fillStyle = themeColor;
      ctx.fillRect(this.slideX, rowY, fillWidth, this.ROW_HEIGHT);

      // 4. Dividers
      ctx.fillStyle = this.BG_COLOR;
      const slotWidth = this.MENU_WIDTH / 10;
      for (let s = 1; s < 10; s++) {
        ctx.fillRect(this.slideX + (s * slotWidth) - 1.5, rowY, 3, this.ROW_HEIGHT);
      }
      ctx.restore();

      // 5. Upgrade Name
      ctx.save();
      ctx.font = '900 10px Inter, sans-serif'; 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = this.BG_COLOR; 
      ctx.lineWidth = 3; 
      ctx.lineJoin = 'round'; 
      
      const textY = rowY + r + 1.5; 
      const centerX = this.slideX + (this.MENU_WIDTH / 2);
      const maxTextWidth = this.MENU_WIDTH * 0.85;

      ctx.strokeText(path.name.toUpperCase(), centerX, textY, maxTextWidth);
      ctx.fillText(path.name.toUpperCase(), centerX, textY, maxTextWidth);
      ctx.restore();

      // 6. Circle Plus Button
      const circleX = this.slideX + this.MENU_WIDTH + 25;
      const circleY = rowY + r;

      ctx.save();
      ctx.beginPath();
      ctx.arc(circleX, circleY, this.CIRCLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = themeColor;
      ctx.fill();
      
      // Using the manual weight for the circle border
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = this.CIRCLE_STROKE_WEIGHT; 
      ctx.stroke();

      // Sharp "+" Icon
      ctx.strokeStyle = this.STROKE_COLOR; 
      ctx.lineWidth = 3;
      ctx.lineCap = 'butt'; 
      ctx.beginPath();
      ctx.moveTo(circleX - 4, circleY); ctx.lineTo(circleX + 4, circleY);
      ctx.moveTo(circleX, circleY - 4); ctx.lineTo(circleX, circleY + 4);
      ctx.stroke();
      ctx.restore();
    });
  }

  public static getButtons(g: any, height: number): DiepButton[] {
    const player: Player = g.player;
    const buttons: DiepButton[] = [];
    if (player.progression.upgradePoints <= 0 || this.slideX < -100) return [];

    const totalHeight = UPGRADE_REGISTRY.length * (this.ROW_HEIGHT + this.ROW_SPACING);
    const startY = height - totalHeight - 65;

    UPGRADE_REGISTRY.forEach((path: UpgradePath, i: number) => {
      const spent = player.upgrades[path.id] || 0;
      if (spent >= 10) return;

      buttons.push({
        id: `upgrade-${path.id}`,
        label: '', 
        x: this.slideX,
        y: startY + (i * (this.ROW_HEIGHT + this.ROW_SPACING)),
        w: this.MENU_WIDTH + 50,
        h: this.ROW_HEIGHT,
        color: 'transparent',
        borderColor: 'transparent',
        action: () => {
          const bonus = Array.isArray(path.increments) ? path.increments[spent] : path.increments;
          player.progression.upgradePoints--;
          player.upgrades[path.id] = spent + 1;

          if (path.id === 'maxHealth') {
            player.maxHealth += bonus;
            player.health += bonus; 
          } else if (path.id === 'maxSpeed') {
            player.maxSpeed += bonus;
          } else if (path.id === 'bulletDamage') {
            player.bulletDamage += bonus;
          }
        }
      });
    });

    return buttons;
  }

  private static drawCapsule(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke: string, weight: number): void {
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
    
    if (stroke !== 'transparent' && weight > 0) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = weight;
      ctx.stroke();
    }
    if (fill !== 'transparent') {
      ctx.fillStyle = fill;
      ctx.fill();
    }
  }
}