import { Injectable } from '@angular/core';
import { Enemy, EnemyType, EnemySpawnWeight } from './diep.interfaces';
import { EnemyRegistry } from './Enemies/enemy.registry';

const ENEMY_SPAWN_WEIGHTS: EnemySpawnWeight[] = [
    { type: 'SMASHER', weight: 0.1 },
    { type: 'CRASHER', weight: 0.1 },
    { type: 'SNIPER', weight: 0.1 },
    { type: 'AURA', weight: 0.1 },
    { type: 'GUARD', weight: 0.1 },
    { type: 'REGULAR', weight: 0.5 },
];

@Injectable({
    providedIn: 'root'
})
export class EnemySpawnerService {

    /**
     * Spawns a single enemy based on weighted random selection or boss flags.
     */
    public spawnSingleEnemy(
        enemies: Enemy[],
        canvasWidth: number,
        canvasHeight: number,
        spawnPadding: number,
        isBoss: boolean
    ): void {
        // 1. Determine the Type
        let type: EnemyType = 'REGULAR';

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

        // 3. Create the Enemy Object via the Registry Factory
        const newEnemy = EnemyRegistry.createEnemy(type, x, y);

        // 4. Handle context-specific initialization (Canvas-dependent properties)
        if (type === 'AURA') {
            newEnemy.targetX = Math.random() * canvasWidth;
            newEnemy.targetY = Math.random() * canvasHeight;
        }

        enemies.push(newEnemy);
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
     * Manual minion spawn (usually triggered by Boss logic).
     */
    public spawnBossMinion(enemies: Enemy[], x: number, y: number): void {
        const minion = EnemyRegistry.createEnemy('MINION', x, y);
        enemies.push(minion);
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