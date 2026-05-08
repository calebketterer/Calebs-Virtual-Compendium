import { Injectable } from '@angular/core';
import { Achievement } from './diep.interfaces';
import { DiepAchievementToastRenderer } from '../ui/hud/diep.achievement-toast';

const CUSTOM_UPGRADE_THRESHOLD = 7; 

@Injectable({ providedIn: 'root' })
export class AchievementService {
  public achievements: Achievement[] = [
    // --- WAVE / SURVIVOR SERIES ---
    { id: 'wave_1', groupId: 'wave', groupTag: 'Core', tier: 1, name: 'Survivor', description: 'Reach Wave 5', targetValue: 5, currentValue: 0, isUnlocked: false, type: 'WAVE', weight: 5 },
    { id: 'wave_2', groupId: 'wave', groupTag: 'Core', tier: 2, name: 'Survivor', description: 'Reach Wave 10', targetValue: 10, currentValue: 0, isUnlocked: false, type: 'WAVE', weight: 20 },
    { id: 'wave_3', groupId: 'wave', groupTag: 'Core', tier: 3, name: 'Survivor', description: 'Reach Wave 25', targetValue: 25, currentValue: 0, isUnlocked: false, type: 'WAVE', weight: 40 },

    // --- SCORE SERIES ---
    { id: 'score_1', groupId: 'score', groupTag: 'Core', tier: 1, name: 'Novice', description: 'Earn 10,000 score in one game', targetValue: 10000, currentValue: 0, isUnlocked: false, type: 'SCORE', weight: 10 },
    { id: 'score_2', groupId: 'score', groupTag: 'Core', tier: 2, name: 'Pro', description: 'Earn 25,000 score in one game', targetValue: 25000, currentValue: 0, isUnlocked: false, type: 'SCORE', weight: 25 },
    { id: 'score_3', groupId: 'score', groupTag: 'Core', tier: 3, name: 'Expert', description: 'Earn 50,000 score in one game', targetValue: 50000, currentValue: 0, isUnlocked: false, type: 'SCORE', weight: 50 },

    // --- LIFETIME KILL SERIES ---
    { id: 'hunter_life_1', groupId: 'hunter_life', groupTag: 'Core', tier: 1, name: 'Hunter', description: 'Destroy 100 total shapes', targetValue: 100, currentValue: 0, isUnlocked: false, type: 'KILL', weight: 5 },
    { id: 'hunter_life_2', groupId: 'hunter_life', groupTag: 'Core', tier: 2, name: 'Hunter', description: 'Destroy 1,000 total shapes', targetValue: 1000, currentValue: 0, isUnlocked: false, type: 'KILL', weight: 20 },
    { id: 'hunter_life_3', groupId: 'hunter_life', groupTag: 'Core', tier: 3, name: 'Hunter', description: 'Destroy 10,000 total shapes', targetValue: 10000, currentValue: 0, isUnlocked: false, type: 'KILL', weight: 100 },

    // --- SINGLE SESSION KILL SERIES ---
    { id: 'hunter_session_1', groupId: 'hunter_session', groupTag: 'Core', tier: 1, name: 'Rampage', description: 'Destroy 100 shapes in one game', targetValue: 100, currentValue: 0, isUnlocked: false, type: 'KILL', weight: 10, isSingleGame: true },
    { id: 'hunter_session_2', groupId: 'hunter_session', groupTag: 'Core', tier: 2, name: 'Rampage', description: 'Destroy 250 shapes in one game', targetValue: 250, currentValue: 0, isUnlocked: false, type: 'KILL', weight: 25, isSingleGame: true },
    { id: 'hunter_session_3', groupId: 'hunter_session', groupTag: 'Core', tier: 3, name: 'Rampage', description: 'Destroy 500 shapes in one game', targetValue: 500, currentValue: 0, isUnlocked: false, type: 'KILL', weight: 50, isSingleGame: true },

    // --- FACTION SPECIFIC (LIFETIME) ---
    { id: 'f_red_1', groupId: 'f_red', groupTag: 'Color', tier: 1, name: 'Code Red', description: 'Defeat 50 red shapes', targetValue: 50, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Red', weight: 5 },
    { id: 'f_red_2', groupId: 'f_red', groupTag: 'Color', tier: 2, name: 'Code Red', description: 'Defeat 500 red shapes', targetValue: 500, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Red', weight: 20 },
    { id: 'f_orange_1', groupId: 'f_orange', groupTag: 'Color', tier: 1, name: 'Juiced', description: 'Defeat 50 orange shapes', targetValue: 50, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Orange', weight: 5 },
    { id: 'f_orange_2', groupId: 'f_orange', groupTag: 'Color', tier: 2, name: 'Juiced', description: 'Defeat 500 orange shapes', targetValue: 500, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Orange', weight: 20 },
    { id: 'f_yellow_1', groupId: 'f_yellow', groupTag: 'Color', tier: 1, name: 'Showers?', description: 'Defeat 50 yellow shapes', targetValue: 50, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Yellow', weight: 5 },   
    { id: 'f_yellow_2', groupId: 'f_yellow', groupTag: 'Color', tier: 2, name: 'Showers?', description: 'Defeat 500 yellow shapes', targetValue: 500, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Yellow', weight: 20 },
    { id: 'f_green_1', groupId: 'f_green', groupTag: 'Color', tier: 1, name: 'Defoliator', description: 'Defeat 50 green shapes', targetValue: 50, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Green', weight: 5 },
    { id: 'f_green_2', groupId: 'f_green', groupTag: 'Color', tier: 2, name: 'Defoliator', description: 'Defeat 500 green shapes', targetValue: 500, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Green', weight: 20 },
    { id: 'f_blue_1', groupId: 'f_blue', groupTag: 'Color', tier: 1, name: 'Deep Blue', description: 'Defeat 50 blue shapes', targetValue: 50, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Blue', weight: 5 },
    { id: 'f_blue_2', groupId: 'f_blue', groupTag: 'Color', tier: 2, name: 'Deep Blue', description: 'Defeat 500 blue shapes', targetValue: 500, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Blue', weight: 20 },
    { id: 'f_purple_1', groupId: 'f_purple', groupTag: 'Color', tier: 1, name: 'Purple Haze', description: 'Defeat 50 purple shapes', targetValue: 50, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Purple', weight: 5 },
    { id: 'f_purple_2', groupId: 'f_purple', groupTag: 'Color', tier: 2, name: 'Purple Haze', description: 'Defeat 500 purple shapes', targetValue: 500, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Purple', weight: 20 },

    // --- UPGRADE SERIES ---
    { id: 'up_regen', groupTag: 'Upgrades', name: 'Wolverine', description: 'Max out Health Regen', targetValue: 10, currentValue: 0, isUnlocked: false, type: 'UPGRADE', weight: 20, upgradeId: 'healthRegen' },
    { id: 'up_health', groupTag: 'Upgrades', name: 'Titan', description: 'Max out Max Health', targetValue: 10, currentValue: 0, isUnlocked: false, type: 'UPGRADE', weight: 20, upgradeId: 'maxHealth' },
    { id: 'up_dmg', groupTag: 'Upgrades', name: 'Glass Cannon', description: 'Max out Bullet Damage', targetValue: 10, currentValue: 0, isUnlocked: false, type: 'UPGRADE', weight: 20, upgradeId: 'bulletDamage' },
    { id: 'up_reload', groupTag: 'Upgrades', name: 'Minigun', description: 'Max out Reload Speed', targetValue: 10, currentValue: 0, isUnlocked: false, type: 'UPGRADE', weight: 20, upgradeId: 'reloadSpeed' },
    { id: 'up_speed', groupTag: 'Upgrades', name: 'Sonic', description: 'Max out Movement Speed', targetValue: 10, currentValue: 0, isUnlocked: false, type: 'UPGRADE', weight: 20, upgradeId: 'maxSpeed' },
    { id: 'up_count_5', groupTag: 'Upgrades', name: 'Jack of All Trades', description: 'Max out 5 upgrade lines', targetValue: 5, currentValue: 0, isUnlocked: false, type: 'UPGRADE', weight: 50 },
    { id: 'up_count_custom', groupTag: 'Upgrades', name: 'Completionist', description: `Max out more than ${CUSTOM_UPGRADE_THRESHOLD} lines`, targetValue: CUSTOM_UPGRADE_THRESHOLD + 1, currentValue: 0, isUnlocked: false, type: 'UPGRADE', weight: 100 }
  ];

  constructor() { 
    this.load(); 
    this.processTierMetadata();
  }

  private processTierMetadata() {
    this.achievements.forEach(ach => {
      const group = this.achievements.filter(a => a.groupId === ach.groupId);
      const previousTiers = group.filter(a => (a.tier || 1) < (ach.tier || 1));
      
      (ach as any).bankedValue = previousTiers.reduce((sum, a) => sum + (a.weight || 0), 0);
      (ach as any)._totalTiers = group.length;
    });
  }

  public checkUpgradeAchievements(playerUpgrades: Record<string, number>) {
    let changed = false;
    let maxedCount = 0;

    this.achievements.forEach(ach => {
      if (ach.type !== 'UPGRADE' || ach.isUnlocked) return;

      // Track individual line maxing
      if (ach.upgradeId && playerUpgrades[ach.upgradeId] >= 10) {
        ach.currentValue = 10;
        ach.isUnlocked = true;
        DiepAchievementToastRenderer.add(ach);
        changed = true;
      }
    });

    // Count how many lines are currently at max (10)
    maxedCount = Object.values(playerUpgrades).filter(val => val >= 10).length;

    // Track aggregate count achievements
    this.achievements.forEach(ach => {
      if (ach.type === 'UPGRADE' && !ach.upgradeId && !ach.isUnlocked) {
        if (maxedCount >= ach.targetValue) {
          ach.currentValue = maxedCount;
          ach.isUnlocked = true;
          DiepAchievementToastRenderer.add(ach);
          changed = true;
        }
      }
    });

    if (changed) this.save();
  }

  public incrementKills(enemyType?: string, factionColor?: string, sessionKills?: number) {
    let changed = false;
    this.achievements.forEach(ach => {
      if (ach.type === 'KILL' && !ach.isUnlocked) {
        const typeMatch = !ach.enemyType || ach.enemyType === enemyType;
        const factionMatch = !ach.faction || ach.faction === factionColor;

        if (typeMatch && factionMatch) {
          if (ach.isSingleGame && sessionKills !== undefined) {
             if (sessionKills > ach.currentValue) {
                 ach.currentValue = sessionKills;
                 changed = true;
             }
          } else if (!ach.isSingleGame) {
             ach.currentValue++;
             changed = true;
          }
          if (ach.currentValue >= ach.targetValue) {
            ach.isUnlocked = true;
            DiepAchievementToastRenderer.add(ach);
          }
        }
      }
    });
    if (changed) this.save();
  }

  public updateProgress(type: 'WAVE' | 'KILL' | 'SCORE', value: number) {
    let changed = false;
    this.achievements.forEach(ach => {
      if (ach.type === type && !ach.isUnlocked) {
        if (value > ach.currentValue) {
          ach.currentValue = value;
          changed = true;
          if (ach.currentValue >= ach.targetValue) {
            ach.isUnlocked = true;
            DiepAchievementToastRenderer.add(ach);
          }
        }
      }
    });
    if (changed) this.save();
  }

  private save() {
    const data = this.achievements.map(a => ({ id: a.id, val: a.currentValue, unlocked: a.isUnlocked }));
    localStorage.setItem('diep_achievements', JSON.stringify(data));
  }

  private load() {
    const saved = localStorage.getItem('diep_achievements');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      parsed.forEach((s: any) => {
        const ach = this.achievements.find(a => a.id === s.id);
        if (ach) {
          ach.currentValue = s.val;
          ach.isUnlocked = s.unlocked;
        }
      });
    } catch (e) {}
  }
}