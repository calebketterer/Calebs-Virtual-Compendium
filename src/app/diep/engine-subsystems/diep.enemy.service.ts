import { Injectable } from '@angular/core';
import { Enemy, Player, Bullet } from '../diep.interfaces';
import { DiepEnemyLogic } from '../diep.enemy-logic';

@Injectable({ providedIn: 'root' })
export class DiepEnemyService {
    /**
     * Executes AI updates for all enemies.
     */
    public updateAI(
        enemies: Enemy[],
        bullets: Bullet[],
        player: Player,
        deltaTime: number,
        width: number,
        height: number
    ) {
        enemies.forEach(enemy => enemy.onUpdate?.(enemy, player, deltaTime));
        DiepEnemyLogic.updateAllEnemies(enemies, bullets, player, deltaTime, width, height, performance.now());
    }

    /**
     * Filters out dead enemies and those that have despawned off-screen.
     */
    public cleanup(enemies: Enemy[], width: number, height: number): Enemy[] {
        return enemies.filter(e => {
            const isOffScreen = e.x < -150 || e.x > width + 150 || e.y < -150 || e.y > height + 150;
            return !(e.canDespawn && isOffScreen) && e.health > 0;
        });
    }
}