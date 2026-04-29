import { Player } from '../../../core/diep.interfaces';
import { UPGRADE_REGISTRY } from '../../../engine/subsystems/player-upgrades/diep.upgrade-registry';

export class UpgradeMenuManager {
  public static slideX: number = -300;
  private static visualSpent: Record<string, number> = {};

  public static updateSlide(hasPoints: boolean, menuWidth: number): void {
    const targetX = hasPoints ? 25 : -menuWidth - 80;
    this.slideX += (targetX - this.slideX) * 0.12;
  }

  public static getVisualSpent(id: string, actual: number): number {
    if (this.visualSpent[id] === undefined) this.visualSpent[id] = actual;
    const diff = actual - this.visualSpent[id];
    this.visualSpent[id] += diff * 0.1;
    return this.visualSpent[id];
  }

  public static getMenuStartY(canvasHeight: number, rowHeight: number, rowSpacing: number): number {
    const totalHeight = UPGRADE_REGISTRY.length * (rowHeight + rowSpacing);
    return canvasHeight - totalHeight - 65;
  }
}