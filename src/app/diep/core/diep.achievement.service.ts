import { Injectable } from '@angular/core';
import { Achievement } from './diep.interfaces';

@Injectable({ providedIn: 'root' })
export class AchievementService {
  public achievements: Achievement[] = [
    // --- WAVE / SURVIVOR SERIES (Session Max) ---
    { id: 'wave_1', groupId: 'wave', tier: 1, name: 'Survivor', description: 'Reach Wave 5', targetValue: 5, currentValue: 0, isUnlocked: false, type: 'WAVE', weight: 5 },
    { id: 'wave_2', groupId: 'wave', tier: 2, name: 'Survivor', description: 'Reach Wave 10', targetValue: 10, currentValue: 0, isUnlocked: false, type: 'WAVE', weight: 20 },
    { id: 'wave_3', groupId: 'wave', tier: 3, name: 'Survivor', description: 'Reach Wave 25', targetValue: 25, currentValue: 0, isUnlocked: false, type: 'WAVE', weight: 40 },

    // --- SCORE SERIES (Session Max) ---
    { id: 'score_1', groupId: 'score', tier: 1, name: 'Novice', description: 'Earn 10,000 score in one game', targetValue: 10000, currentValue: 0, isUnlocked: false, type: 'SCORE', weight: 10 },
    { id: 'score_2', groupId: 'score', tier: 2, name: 'Professional', description: 'Earn 25,000 score in one game', targetValue: 25000, currentValue: 0, isUnlocked: false, type: 'SCORE', weight: 25 },
    { id: 'score_3', groupId: 'score', tier: 3, name: 'Expert', description: 'Earn 50,000 score in one game', targetValue: 50000, currentValue: 0, isUnlocked: false, type: 'SCORE', weight: 50 },

    // --- LIFETIME KILL SERIES ---
    { id: 'hunter_life_1', groupId: 'hunter_life', tier: 1, name: 'Hunter', description: 'Destroy 100 total shapes', targetValue: 100, currentValue: 0, isUnlocked: false, type: 'KILL', weight: 5 },
    { id: 'hunter_life_2', groupId: 'hunter_life', tier: 2, name: 'Hunter', description: 'Destroy 1,000 total shapes', targetValue: 1000, currentValue: 0, isUnlocked: false, type: 'KILL', weight: 20 },
    { id: 'hunter_life_3', groupId: 'hunter_life', tier: 3, name: 'Hunter', description: 'Destroy 10,000 total shapes', targetValue: 10000, currentValue: 0, isUnlocked: false, type: 'KILL', weight: 100 },

    // --- SINGLE SESSION KILL SERIES ---
    { id: 'hunter_session_1', groupId: 'hunter_session', tier: 1, name: 'Rampage', description: 'Destroy 100 shapes in one game', targetValue: 100, currentValue: 0, isUnlocked: false, type: 'KILL', weight: 10, isSingleGame: true },
    { id: 'hunter_session_2', groupId: 'hunter_session', tier: 2, name: 'Rampage', description: 'Destroy 250 shapes in one game', targetValue: 250, currentValue: 0, isUnlocked: false, type: 'KILL', weight: 25, isSingleGame: true },
    { id: 'hunter_session_3', groupId: 'hunter_session', tier: 3, name: 'Rampage', description: 'Destroy 500 shapes in one game', targetValue: 500, currentValue: 0, isUnlocked: false, type: 'KILL', weight: 50, isSingleGame: true },

    // --- FACTION SPECIFIC (LIFETIME) ---
    { id: 'f_red_1', groupId: 'f_red', tier: 1, name: 'Code Red', description: 'Defeat 50 red shapes', targetValue: 50, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Red', weight: 5 },
    { id: 'f_red_2', groupId: 'f_red', tier: 2, name: 'Code Red', description: 'Defeat 500 red shapes', targetValue: 500, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Red', weight: 20 },
    { id: 'f_orange_1', groupId: 'f_orange', tier: 1, name: 'Juiced', description: 'Defeat 50 orange shapes', targetValue: 50, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Orange', weight: 5 },
    { id: 'f_orange_2', groupId: 'f_orange', tier: 2, name: 'Juiced', description: 'Defeat 500 orange shapes', targetValue: 500, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Orange', weight: 20 },
    { id: 'f_yellow_1', groupId: 'f_yellow', tier: 1, name: 'Showers?', description: 'Defeat 50 yellow shapes', targetValue: 50, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Yellow', weight: 5 },   
    { id: 'f_yellow_2', groupId: 'f_yellow', tier: 2, name: 'Showers?', description: 'Defeat 500 yellow shapes', targetValue: 500, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Yellow', weight: 20 },
    { id: 'f_green_1', groupId: 'f_green', tier: 1, name: 'Defoliator', description: 'Defeat 50 green shapes', targetValue: 50, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Green', weight: 5 },
    { id: 'f_green_2', groupId: 'f_green', tier: 2, name: 'Defoliator', description: 'Defeat 500 green shapes', targetValue: 500, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Green', weight: 20 },
    { id: 'f_blue_1', groupId: 'f_blue', tier: 1, name: 'Deep Blue', description: 'Defeat 50 blue shapes', targetValue: 50, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Blue', weight: 5 },
    { id: 'f_blue_2', groupId: 'f_blue', tier: 2, name: 'Deep Blue', description: 'Defeat 500 blue shapes', targetValue: 500, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Blue', weight: 20 },
    { id: 'f_purple_1', groupId: 'f_purple', tier: 1, name: 'Purple Haze', description: 'Defeat 50 purple shapes', targetValue: 50, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Purple', weight: 5 },
    { id: 'f_purple_2', groupId: 'f_purple', tier: 2, name: 'Purple Haze', description: 'Defeat 500 purple shapes', targetValue: 500, currentValue: 0, isUnlocked: false, type: 'KILL', faction: 'Purple', weight: 20 },

    //
    // --- ENEMY TYPE SPECIFIC ---
    //{ id: 'slay_haunter_1', groupId: 'slay_haunter', tier: 1, name: 'Exorcist', description: 'Banish 20 Haunters', targetValue: 20, currentValue: 0, isUnlocked: false, type: 'KILL', enemyType: 'Haunter', weight: 15 },
    //{ id: 'slay_healer_1', groupId: 'slay_healer', tier: 1, name: 'Malpractice', description: 'Destroy 20 Healers', targetValue: 20, currentValue: 0, isUnlocked: false, type: 'KILL', enemyType: 'Healer', weight: 15 }
  ];

  constructor() { this.load(); }

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
          if (ach.currentValue >= ach.targetValue) ach.isUnlocked = true;
        }
      }
    });
    if (changed) this.save();
  }

  // Renamed back to updateProgress to fix your Engine errors
  public updateProgress(type: 'WAVE' | 'KILL' | 'SCORE', value: number) {
    let changed = false;
    this.achievements.forEach(ach => {
      if (ach.type === type && !ach.isUnlocked) {
        if (value > ach.currentValue) {
          ach.currentValue = value;
          changed = true;
          if (ach.currentValue >= ach.targetValue) ach.isUnlocked = true;
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