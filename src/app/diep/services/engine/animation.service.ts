import { Injectable } from '@angular/core';
import { Enemy } from '../../diep.interfaces';

@Injectable({ providedIn: 'root' })
export class AnimationManagerService {
  public deathAnimationDuration = 1000;

  public handleDeathAnimation(
    now: number, 
    startTime: number | null, 
    enemies: Enemy[]
  ): { startTime: number | null, remainingEnemies: Enemy[] } {
    if (startTime === null) return { startTime: null, remainingEnemies: [] };

    const timeElapsed = now - startTime;

    if (timeElapsed >= this.deathAnimationDuration) {
      return { startTime: null, remainingEnemies: [] };
    }
    
    return { startTime, remainingEnemies: enemies };
  }
}