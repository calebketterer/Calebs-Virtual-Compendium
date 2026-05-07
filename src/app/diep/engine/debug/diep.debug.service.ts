import { Injectable, isDevMode } from '@angular/core';
import { DiepGameEngineService } from '../diep.game-engine.service';
import { DiepAchievementToastRenderer } from '../../ui/hud/diep.achievement-toast';

@Injectable({ providedIn: 'root' })
export class DiepDebugService {
  constructor(private gameEngine: DiepGameEngineService) {}

  public handleDebugInput(event: KeyboardEvent): boolean {
    if (!isDevMode()) return false;

    const key = event.key.toLowerCase();

    switch (key) {
      case 'l':
        this.triggerRandomAchievement();
        return true;
      case 'i':
        this.toggleInvincibility(); // Renamed for clarity
        return true;
      case 'u':
        this.applyUpgrades();
        return true;
      default:
        return false;
    }
  }

  private toggleInvincibility() {
    const p = this.gameEngine.player;
    if (!p) return;

    // Check if we are currently in god mode
    const isCurrentlyGod = p.maxHealth >= 10000;

    if (isCurrentlyGod) {
      // REVERT TO NORMAL
      p.maxHealth = 100;
      p.health = 100;
      p.healthRegen = 1;
      this.notify('DEBUG', 'MORTAL MODE ACTIVE');
    } else {
      // ENABLE GOD MODE
      p.maxHealth = 10000;
      p.health = 10000;
      p.healthRegen = 100;
      this.notify('DEBUG', 'GOD MODE ACTIVE');
    }
  }

  private applyUpgrades() {
    const p = this.gameEngine.player;
    if (!p) return;
    
    p.progression.upgradePoints = 50;
    this.notify('DEBUG', 'ADDED 50 UPGRADE POINTS');
  }

  private triggerRandomAchievement() {
    const achs = this.gameEngine.achievementService.achievements;
    if (achs && achs.length > 0) {
      const randomAch = achs[Math.floor(Math.random() * achs.length)];
      DiepAchievementToastRenderer.add(randomAch);
    }
  }

  private notify(name: string, description: string) {
    DiepAchievementToastRenderer.add({
      id: `debug-${Date.now()}`,
      name: name,
      description: description,
      targetValue: 1,
      currentValue: 1,
      isUnlocked: true,
      type: 'SCORE',
      weight: 666
    });
  }
}