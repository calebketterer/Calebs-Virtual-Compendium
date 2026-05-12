import { Achievement } from '../../core/diep.interfaces';

export class DiepAchievementNavigator {
  public static groups: string[] = ['ALL'];
  public static activeGroupIndex = 0;
  public static statusFilter: 'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'UNTOUCHED' = 'ALL';

  // Animation state: tracks current scale (0 to 1) for each filter type
  private static animStates: Map<string, number> = new Map([
    ['COMPLETED', 0], ['IN_PROGRESS', 0], ['UNTOUCHED', 0]
  ]);

  private static headerX = 30;
  private static headerY = 32;
  private static statusSpacing = 32;
  private static tabSpacing = 120;
  private static tabY = 75;

  // Animation constants
  private static readonly BASE_SIZE = 20;
  private static readonly GROW_SIZE = 6; 
  private static readonly LERP_SPEED = 0.15; 

  public static updateGroups(achievements: Achievement[]): void {
    const tags = new Set<string>();
    achievements.forEach(a => {
      if ((a as any).groupTag) tags.add((a as any).groupTag.toUpperCase());
    });
    this.groups = ['ALL', ...Array.from(tags)];
  }

  public static getFiltered(achs: Achievement[]): Achievement[] {
    const group = this.groups[this.activeGroupIndex];
    let filtered = group === 'ALL' ? achs : achs.filter(a => (a as any).groupTag?.toUpperCase() === group);

    if (this.statusFilter === 'COMPLETED') filtered = filtered.filter(a => a.isUnlocked);
    else if (this.statusFilter === 'IN_PROGRESS') filtered = filtered.filter(a => !a.isUnlocked && a.currentValue > 0);
    else if (this.statusFilter === 'UNTOUCHED') filtered = filtered.filter(a => !a.isUnlocked && a.currentValue === 0);

    return filtered;
  }

  private static getDarkerColor(hex: string): string {
    const darkMap: { [key: string]: string } = {
      '#f1c40f': '#b8950b',
      '#3498db': '#217dbb',
      '#7f8c8d': '#5a6263'
    };
    return darkMap[hex] || '#000';
  }

  public static drawTabs(ctx: CanvasRenderingContext2D, width: number): void {
    const statuses = [
      { id: 'COMPLETED', color: '#f1c40f' }, 
      { id: 'IN_PROGRESS', color: '#3498db' }, 
      { id: 'UNTOUCHED', color: '#7f8c8d' }
    ];

    statuses.forEach((s, i) => {
      // 1. Update Animation State
      let current = this.animStates.get(s.id) || 0;
      const target = this.statusFilter === s.id ? 1 : 0;
      current += (target - current) * this.LERP_SPEED;
      this.animStates.set(s.id, current);

      // 2. Calculate dynamic dimensions
      const extraSize = current * this.GROW_SIZE;
      const size = this.BASE_SIZE + extraSize;
      const x = this.headerX + (i * this.statusSpacing) - (extraSize / 2);
      const y = this.headerY - (extraSize / 2);
      
      // 3. Draw Healer-style thick outline
      ctx.lineJoin = 'round';
      ctx.strokeStyle = this.getDarkerColor(s.color);
      ctx.lineWidth = 3 + (current * 1); 
      ctx.strokeRect(x, y, size, size);

      // 4. Fill main color
      ctx.fillStyle = s.color;
      ctx.fillRect(x, y, size, size);

      // 5. Active Indicator
      if (current > 0.1) {
        ctx.save();
        ctx.globalAlpha = current;
        ctx.fillStyle = '#fff';
        const dotSize = 6 * current;
        ctx.fillRect(x + (size/2 - dotSize/2), y + (size/2 - dotSize/2), dotSize, dotSize);
        ctx.restore();
      }
    });

    // --- CATEGORY TABS ---
    const startX = (width / 2) - ((this.groups.length - 1) * this.tabSpacing) / 2;
    ctx.textAlign = 'center';
    ctx.font = '900 12px Inter, sans-serif';

    this.groups.forEach((group, i) => {
      const x = startX + (i * this.tabSpacing);
      const isActive = i === this.activeGroupIndex;

      if (isActive) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(x - 30, this.tabY + 20, 60, 3);
      }
      ctx.fillStyle = isActive ? '#fff' : 'rgba(255, 255, 255, 0.3)';
      ctx.fillText(group, x, this.tabY + 10);
    });
  }

  public static getButtons(g: any, width: number): any[] {
    const startX = (width / 2) - ((this.groups.length - 1) * this.tabSpacing) / 2;

    const navButtons = this.groups.map((group, i) => ({
      id: `nav-tab-${group}`,
      x: startX + (i * this.tabSpacing) - 50,
      y: this.tabY - 10,
      w: 100,
      h: 40,
      action: () => { this.activeGroupIndex = i; }
    }));

    const statusButtons = (['COMPLETED', 'IN_PROGRESS', 'UNTOUCHED'] as const).map((s, i) => {
      const current = this.animStates.get(s) || 0;
      const size = this.BASE_SIZE + (current * this.GROW_SIZE);
      return {
        id: `status-filter-${s}`,
        x: this.headerX + (i * this.statusSpacing) - (current * this.GROW_SIZE / 2),
        y: this.headerY - (current * this.GROW_SIZE / 2),
        w: size,
        h: size,
        action: () => {
          // Cast as any to satisfy the TS compiler for the union type assignment
          this.statusFilter = (this.statusFilter === s) ? 'ALL' : (s as any);
        }
      };
    });

    return [...navButtons, ...statusButtons];
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