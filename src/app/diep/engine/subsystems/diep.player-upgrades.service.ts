import { Injectable } from '@angular/core';
import { PlayerProgression, DifficultyMode } from '../../core/diep.interfaces';

@Injectable({ providedIn: 'root' })
export class DiepPlayerUpgradesService {
  private readonly INITIAL_XP_NEEDED = 100;
  private readonly XP_INCREMENT_PER_LEVEL = 50;

  public getDefaultProgression(difficulty: DifficultyMode = 'MEDIUM', carryOverXp: number = 0): PlayerProgression {
    const startingXp = this.calculateCarryOver(difficulty, carryOverXp);
    
    let state: PlayerProgression = {
      level: 1,
      currentXp: startingXp,
      nextLevelXp: this.getXpForLevel(1),
      totalXpEarned: startingXp,
      upgradePoints: 0,
      difficulty: difficulty
    };

    while (state.currentXp >= state.nextLevelXp) {
      state.currentXp -= state.nextLevelXp;
      state.level++;
      state.upgradePoints++;
      state.nextLevelXp = this.getXpForLevel(state.level);
    }

    return state;
  }

  public getXpForLevel(level: number): number {
    return this.INITIAL_XP_NEEDED + (level - 1) * this.XP_INCREMENT_PER_LEVEL;
  }

  public addXp(progression: PlayerProgression, amount: number): boolean {
    const multiplier = this.getDifficultyMultiplier(progression.difficulty);
    const actualXp = amount * multiplier;

    progression.currentXp += actualXp;
    progression.totalXpEarned += actualXp;

    let leveledUp = false;
    while (progression.currentXp >= progression.nextLevelXp) {
      this.levelUp(progression);
      leveledUp = true;
    }
    return leveledUp;
  }

  private levelUp(progression: PlayerProgression): void {
    progression.currentXp -= progression.nextLevelXp;
    progression.level++;
    progression.upgradePoints++;
    progression.nextLevelXp = this.getXpForLevel(progression.level);
  }

  private getDifficultyMultiplier(mode: DifficultyMode): number {
    switch (mode) {
      case 'EASY': return 0.5; case 'MEDIUM': return 1.0; case 'HARD': return 1.5;
      default: return 1.0;
    }
  }

  private calculateCarryOver(mode: DifficultyMode, xp: number): number {
    switch (mode) {
      case 'EASY': return xp; case 'MEDIUM': return xp * 0.5;
      default: return 0;
    }
  }
}