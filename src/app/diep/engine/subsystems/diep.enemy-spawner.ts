import { Injectable } from '@angular/core';
import { Enemy, EnemyType, EnemySpawnWeight } from '../../diep.interfaces';
import { EnemyRegistry } from '../../enemies/enemy.registry';

const ENEMY_SPAWN_WEIGHTS: EnemySpawnWeight[] = [
    { type: 'SMASHER', weight: 0.05 },
    { type: 'CRASHER', weight: 0.05 },
    { type: 'SNIPER', weight: 0.05 },
    { type: 'BLOATER', weight: 0.05 },
    { type: 'GUNNER', weight: 0.05 },
    { type: 'MOTHER', weight: 0.05 },
    { type: 'ROLLER', weight: 0.3 },
    { type: 'HEALER', weight: 0.05 },
    { type: 'HAUNTER', weight: 0.05 },
    { type: 'BOMBER', weight: 0.1 },
    { type: 'BLASTER', weight: 0.1 },
    { type: 'CASTER', weight: 0.1 }
];

@Injectable({
    providedIn: 'root'
})
export class EnemySpawnerService {

    public spawnSingleEnemy(
        enemies: Enemy[],
        canvasWidth: number,
        canvasHeight: number,
        spawnPadding: number,
        isBoss: boolean
    ): void {
        let type: EnemyType = 'ROLLER';

        if (isBoss) {
            type = 'BOSS';
        } else {
            const totalWeight = ENEMY_SPAWN_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
            let randomRoll = Math.random() * totalWeight;

            for (const item of ENEMY_SPAWN_WEIGHTS) {
                if (randomRoll < item.weight) {
                    type = item.type;
                    break;
                }
                randomRoll -= item.weight;
            }
        }

        const { x, y } = this.calculateSpawnPosition(canvasWidth, canvasHeight, spawnPadding);

        if (type === 'CRASHER') {
            const swarmSize = Math.floor(Math.random() * 4) + 3;
            for (let i = 0; i < swarmSize; i++) {
                const jitterX = (Math.random() - 0.5) * 40;
                const jitterY = (Math.random() - 0.5) * 40;
                
                const crasher = EnemyRegistry.createEnemy('CRASHER', x + jitterX, y + jitterY);
                
                // Attach Metadata so Achievements can track Faction/Type
                (crasher as any).metadata = EnemyRegistry.getMetadata('CRASHER');

                if (crasher.onSpawn) {
                    crasher.onSpawn(crasher, canvasWidth, canvasHeight);
                }
                enemies.push(crasher as Enemy);
            }
        } else {
            const newEnemy = EnemyRegistry.createEnemy(type, x, y);

            // Attach Metadata so Achievements can track Faction/Type
            (newEnemy as any).metadata = EnemyRegistry.getMetadata(type);

            if (newEnemy.onSpawn) {
                newEnemy.onSpawn(newEnemy, canvasWidth, canvasHeight);
            }
            enemies.push(newEnemy as Enemy);
        }
    }

    private calculateSpawnPosition(width: number, height: number, padding: number): { x: number, y: number } {
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
            case 0: return { x: Math.random() * width, y: -padding };
            case 1: return { x: width + padding, y: Math.random() * height };
            case 2: return { x: Math.random() * width, y: height + padding };
            case 3: default: return { x: -padding, y: Math.random() * height };
        }
    }

    public spawnBossMinion(enemies: Enemy[], x: number, y: number): void {
        const minion = EnemyRegistry.createEnemy('MINION', x, y);
        (minion as any).metadata = EnemyRegistry.getMetadata('MINION');
        
        if (minion.onSpawn) {
            minion.onSpawn(minion, 0, 0); 
        }
        enemies.push(minion as Enemy);
    }

    public spawnEnemies(
        enemies: Enemy[],
        count: number,
        preventBossSpawn: boolean,
        currentWave: number,
        canvasWidth: number,
        canvasHeight: number
    ): void {
        const spawnPadding = 50;
        const bossAttempt = !preventBossSpawn && currentWave > 0 && Math.random() < 0.2;
        let regularEnemyCount = count;
        const spawnMiniboss = bossAttempt && currentWave > 5;

        if (spawnMiniboss) {
            this.spawnSingleEnemy(enemies, canvasWidth, canvasHeight, spawnPadding, true);
            regularEnemyCount = Math.max(0, count - 1); 
        }

        for (let i = 0; i < regularEnemyCount; i++) {
            this.spawnSingleEnemy(enemies, canvasWidth, canvasHeight, spawnPadding, false);
        }
    }
}