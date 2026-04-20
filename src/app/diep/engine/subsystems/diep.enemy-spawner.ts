import { Injectable } from '@angular/core';
import { Enemy, EnemyType, EnemySpawnWeight } from '../../diep.interfaces';
import { EnemyRegistry } from '../../enemies/enemy.registry';

const ENEMY_SPAWN_WEIGHTS: EnemySpawnWeight[] = [
    { type: 'SMASHER', weight: 1 },
    //{ type: 'CRASHER', weight: 0.05 },
    //{ type: 'SNIPER', weight: 0.05 },
    //{ type: 'BLOATER', weight: 0.05 },
    //{ type: 'GUNNER', weight: 0.05 },
    //{ type: 'MOTHER', weight: 0.05 },
    //{ type: 'ROLLER', weight: 0.3 },
    //{ type: 'HEALER', weight: 0.05 },
    //{ type: 'HAUNTER', weight: 0.05 },
    //{ type: 'BOMBER', weight: 0.1 },
    //{ type: 'BLASTER', weight: 0.1 },
    //{ type: 'CASTER', weight: 0.1 }
];

@Injectable({
    providedIn: 'root'
})
export class EnemySpawnerService {

    /**
     * Spawns a single enemy based on weighted random selection or boss flags.
     * Note: If type is 'CRASHER', it triggers a swarm spawn.
     */
    public spawnSingleEnemy(
        enemies: Enemy[],
        canvasWidth: number,
        canvasHeight: number,
        spawnPadding: number,
        isBoss: boolean
    ): void {
        // 1. Determine the Type
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

        // 2. Calculate Spawn Position (Off-screen)
        const { x, y } = this.calculateSpawnPosition(canvasWidth, canvasHeight, spawnPadding);

        // 3. Create the Enemy Object(s)
        if (type === 'CRASHER') {
            // CRASHER SWARM: Spawn a cluster of 3 to 6 crashers
            const swarmSize = Math.floor(Math.random() * 4) + 3;
            
            for (let i = 0; i < swarmSize; i++) {
                // Add jitter so they spawn in a loose pack
                const jitterX = (Math.random() - 0.5) * 40;
                const jitterY = (Math.random() - 0.5) * 40;
                
                const crasher = EnemyRegistry.createEnemy('CRASHER', x + jitterX, y + jitterY);
                
                if (crasher.onSpawn) {
                    crasher.onSpawn(crasher, canvasWidth, canvasHeight);
                }
                
                enemies.push(crasher as Enemy);
            }
        } else {
            // STANDARD SPAWN: Create a single enemy via the Registry Factory
            const newEnemy = EnemyRegistry.createEnemy(type, x, y);

            // 4. Handle ANY enemy's unique initialization (Generic Hook)
            if (newEnemy.onSpawn) {
                newEnemy.onSpawn(newEnemy, canvasWidth, canvasHeight);
            }

            enemies.push(newEnemy as Enemy);
        }
    }

    /**
     * Helper to determine off-screen coordinates based on a random edge.
     */
    private calculateSpawnPosition(width: number, height: number, padding: number): { x: number, y: number } {
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
            case 0: // Top
                return { x: Math.random() * width, y: -padding };
            case 1: // Right
                return { x: width + padding, y: Math.random() * height };
            case 2: // Bottom
                return { x: Math.random() * width, y: height + padding };
            case 3: // Left
            default:
                return { x: -padding, y: Math.random() * height };
        }
    }

    /**
     * Manual minion spawn (triggered by Mother or Boss logic).
     */
    public spawnBossMinion(enemies: Enemy[], x: number, y: number): void {
        const minion = EnemyRegistry.createEnemy('MINION', x, y);
        
        // Ensure minions also get their onSpawn hook if they have one
        if (minion.onSpawn) {
            minion.onSpawn(minion, 0, 0); 
        }
        
        enemies.push(minion as Enemy);
    }

    /**
     * The main wave orchestrator.
     */
    public spawnEnemies(
        enemies: Enemy[],
        count: number,
        preventBossSpawn: boolean,
        currentWave: number,
        canvasWidth: number,
        canvasHeight: number
    ): void {
        const spawnPadding = 50;

        // Determine if a boss spawn should be attempted (20% chance after wave 0)
        const bossAttempt = !preventBossSpawn && currentWave > 0 && Math.random() < 0.2;
        let regularEnemyCount = count;

        // Miniboss spawn logic: Only after Wave 5
        const spawnMiniboss = bossAttempt && currentWave > 5;

        if (spawnMiniboss) {
            this.spawnSingleEnemy(enemies, canvasWidth, canvasHeight, spawnPadding, true);
            regularEnemyCount = Math.max(0, count - 1); 
        }

        // Spawn remaining regular enemies
        for (let i = 0; i < regularEnemyCount; i++) {
            this.spawnSingleEnemy(enemies, canvasWidth, canvasHeight, spawnPadding, false);
        }
    }
}