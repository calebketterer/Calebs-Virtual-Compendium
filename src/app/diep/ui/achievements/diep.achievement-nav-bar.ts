import { Achievement } from '../../core/diep.interfaces';

export class DiepAchievementNavigator {
  public static groups: string[] = ['ALL'];
  public static activeGroupIndex = 0;

  public static updateGroups(achievements: Achievement[]): void {
    const tags = new Set<string>();
    achievements.forEach(a => {
      if ((a as any).groupTag) tags.add((a as any).groupTag.toUpperCase());
    });
    this.groups = ['ALL', 'CORE', 'COLORS', ...Array.from(tags)];
  }

  public static getFiltered(achs: Achievement[]): Achievement[] {
    const group = this.groups[this.activeGroupIndex];
    if (group === 'ALL') return achs;
    if (group === 'CORE') return achs.filter(a => a.type === 'WAVE' || a.type === 'SCORE');
    if (group === 'COLORS') return achs.filter(a => a.faction);
    return achs.filter(a => (a as any).groupTag?.toUpperCase() === group);
  }

  public static drawTabs(ctx: CanvasRenderingContext2D, width: number): void {
    const tabY = 85;
    const spacing = 120;
    const startX = (width / 2) - ((this.groups.length - 1) * spacing) / 2;

    ctx.textAlign = 'center';
    ctx.font = '900 12px Inter, sans-serif';

    this.groups.forEach((group, i) => {
      const x = startX + (i * spacing);
      const isActive = i === this.activeGroupIndex;

      if (isActive) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(x - 30, tabY + 20, 60, 3);
      }

      ctx.fillStyle = isActive ? '#fff' : 'rgba(255, 255, 255, 0.3)';
      ctx.fillText(group, x, tabY + 10);
    });
  }

  public static getButtons(g: any, width: number): any[] {
    const tabY = 85;
    const spacing = 120;
    const startX = (width / 2) - ((this.groups.length - 1) * spacing) / 2;

    return this.groups.map((group, i) => ({
      id: `nav-tab-${group}`,
      x: startX + (i * spacing) - 50,
      y: tabY - 10,
      w: 100,
      h: 40,
      action: () => {
        this.activeGroupIndex = i;
      }
    }));
  }

  public static handleInput(g: any): void {
    if (g.keys['d'] || g.keys['D'] || g.keys['arrowright']) {
      this.activeGroupIndex = (this.activeGroupIndex + 1) % this.groups.length;
      g.keys['d'] = g.keys['D'] = g.keys['arrowright'] = false;
    }
    if (g.keys['a'] || g.keys['A'] || g.keys['arrowleft']) {
      this.activeGroupIndex = (this.activeGroupIndex - 1 + this.groups.length) % this.groups.length;
      g.keys['a'] = g.keys['A'] = g.keys['arrowleft'] = false;
    }
  }
}