import { Achievement } from '../../core/diep.interfaces';

export class DiepAchievementNavigator {
  public static groups: string[] = ['ALL'];
  public static activeGroupIndex = 0;
  public static statusFilter: 'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'UNTOUCHED' = 'ALL';

  // Position settings for the Top-Left Header area
  private static headerX = 30;  // Pixels from the left edge
  private static headerY = 32;  // Centered vertically with the "ACHIEVEMENTS" text
  private static statusSpacing = 28; 
  private static tabSpacing = 120;

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

    if (this.statusFilter === 'COMPLETED') {
      filtered = filtered.filter(a => a.isUnlocked);
    } else if (this.statusFilter === 'IN_PROGRESS') {
      filtered = filtered.filter(a => !a.isUnlocked && a.currentValue > 0);
    } else if (this.statusFilter === 'UNTOUCHED') {
      filtered = filtered.filter(a => !a.isUnlocked && a.currentValue === 0);
    }

    return filtered;
  }

  public static drawTabs(ctx: CanvasRenderingContext2D, width: number): void {
    // --- 1. DRAW STATUS SQUARES (Top Left Header) ---
    const statuses = [
      { id: 'COMPLETED', color: '#f1c40f' }, 
      { id: 'IN_PROGRESS', color: '#3498db' }, 
      { id: 'UNTOUCHED', color: '#7f8c8d' }
    ];

    statuses.forEach((s, i) => {
      const x = this.headerX + (i * this.statusSpacing);
      const y = this.headerY;
      
      ctx.fillStyle = s.color;
      ctx.fillRect(x, y, 20, 20);

      if (this.statusFilter === s.id) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 2, y - 2, 24, 24);
      }
    });

    // --- 2. DRAW CATEGORY TABS (Existing Location) ---
    const tabY = 85;
    const startX = (width / 2) - ((this.groups.length - 1) * this.tabSpacing) / 2;

    ctx.textAlign = 'center';
    ctx.font = '900 12px Inter, sans-serif';

    this.groups.forEach((group, i) => {
      const x = startX + (i * this.tabSpacing);
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
    const startX = (width / 2) - ((this.groups.length - 1) * this.tabSpacing) / 2;

    // Group Tab Hitboxes
    const navButtons = this.groups.map((group, i) => ({
      id: `nav-tab-${group}`,
      x: startX + (i * this.tabSpacing) - 50,
      y: tabY - 10,
      w: 100,
      h: 40,
      action: () => { this.activeGroupIndex = i; }
    }));

    // Status Square Hitboxes (Now in Header)
    const statusButtons = ['COMPLETED', 'IN_PROGRESS', 'UNTOUCHED'].map((s: any, i) => ({
      id: `status-filter-${s}`,
      x: this.headerX + (i * this.statusSpacing),
      y: this.headerY,
      w: 20,
      h: 20,
      action: () => {
        this.statusFilter = (this.statusFilter === s) ? 'ALL' : s;
      }
    }));

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