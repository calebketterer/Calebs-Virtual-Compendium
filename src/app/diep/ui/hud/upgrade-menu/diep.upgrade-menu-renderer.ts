import { Player, DiepButton } from '../../../core/diep.interfaces';
import { UPGRADE_REGISTRY, UpgradePath } from '../../../engine/subsystems/player-upgrades/diep.upgrade-registry';
import { UpgradeBarRenderer } from './upgrade-bar-renderer';
import { UpgradeMenuManager } from './diep.upgrade-menu.manager';

export class DiepUpgradeMenuRenderer {
  private static readonly MENU_WIDTH = 200;
  private static readonly ROW_HEIGHT = 15;
  private static readonly ROW_SPACING = 10;
  private static readonly COLORS = {
    bg: '#3d3d3d',
    stroke: '#444444',
    default: '#999999'
  };
  private static readonly WEIGHTS = {
    master: 5,
    circle: 2.5
  };

  public static draw(ctx: CanvasRenderingContext2D, g: any, height: number): void {
    const player: Player = g.player;
    const hasPoints = player.progression.upgradePoints > 0;

    UpgradeMenuManager.updateSlide(hasPoints, this.MENU_WIDTH);
    if (UpgradeMenuManager.slideX < -this.MENU_WIDTH - 70) return;

    const startY = UpgradeMenuManager.getMenuStartY(height, this.ROW_HEIGHT, this.ROW_SPACING);

    // Points Label
    if (hasPoints) {
      this.drawPointsLabel(ctx, player.progression.upgradePoints, UpgradeMenuManager.slideX, startY - 15);
    }

    UPGRADE_REGISTRY.forEach((path: UpgradePath, i: number) => {
      const rowY = startY + (i * (this.ROW_HEIGHT + this.ROW_SPACING));
      const visualSpent = UpgradeMenuManager.getVisualSpent(path.id, player.upgrades[path.id] || 0);

      UpgradeBarRenderer.draw(
        ctx,
        UpgradeMenuManager.slideX,
        rowY,
        this.MENU_WIDTH,
        this.ROW_HEIGHT,
        path,
        visualSpent,
        { ...this.COLORS, theme: path.color || this.COLORS.default },
        this.WEIGHTS
      );
    });
  }

  private static drawPointsLabel(ctx: CanvasRenderingContext2D, points: number, x: number, y: number): void {
    ctx.save();
    ctx.font = '900 22px Inter, sans-serif';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(`x${points}`, x, y);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`x${points}`, x, y);
    ctx.restore();
  }

  public static getButtons(g: any, height: number): DiepButton[] {
    const player: Player = g.player;
    if (player.progression.upgradePoints <= 0 || UpgradeMenuManager.slideX < -100) return [];

    const startY = UpgradeMenuManager.getMenuStartY(height, this.ROW_HEIGHT, this.ROW_SPACING);

    return UPGRADE_REGISTRY.filter(path => (player.upgrades[path.id] || 0) < 10).map((path, i) => ({
      id: `upgrade-${path.id}`,
      label: '',
      x: UpgradeMenuManager.slideX,
      y: startY + (i * (this.ROW_HEIGHT + this.ROW_SPACING)),
      w: this.MENU_WIDTH + 50,
      h: this.ROW_HEIGHT,
      color: 'transparent',
      borderColor: 'transparent',
      action: () => {
        const spent = player.upgrades[path.id] || 0;
        const bonus = Array.isArray(path.increments) ? path.increments[spent] : path.increments;
        player.progression.upgradePoints--;
        player.upgrades[path.id] = spent + 1;

        if (path.id === 'maxHealth') { player.maxHealth += bonus; player.health += bonus; }
        else if (path.id === 'maxSpeed') player.maxSpeed += bonus;
        else if (path.id === 'bulletDamage') player.bulletDamage += bonus;
      }
    }));
  }
}