import { Injectable } from '@angular/core';
import { Enemy, EnemyType, EnemySpawnWeight, Player } from './diep.interfaces';
// import { drawEnemy } from '../drawing/enemy-renderer'; // REMOVED: Unused import

// Assuming your original component defines an array like this for weighted spawning
const ENEMY_SPAWN_WEIGHTS: EnemySpawnWeight[] = [
    { type: 'SMASHER', weight: 0.1 },
    { type: 'CRASHER', weight: 0.1 },
    { type: 'SNIPER', weight: 0.1 },
    { type: 'AURA', weight: 0.05 },
    { type: 'REGULAR', weight: 0.65 },
];


@Injectable({
  providedIn: 'root'
})
export class EnemySpawnerService {
    
    // --- Method 1: spawnSingleEnemy ---
    // This method needs the enemies array to push the new enemy object into it.
    public spawnSingleEnemy(
        enemies: Enemy[],
        canvasWidth: number, 
        canvasHeight: number, 
        spawnPadding: number, 
        isBoss: boolean
    ): void {
        let radius: number = 20; 
        let maxHealth: number = 50;
        let scoreValue: number = 10;
        let color: string = '#e74c3c'; // Red
        let type: EnemyType = 'REGULAR';
        let speedMultiplier = 1;

        if (isBoss) {
            // Purple Miniboss/Boss Enemy Stats
            radius = 50;
            maxHealth = 500;
            scoreValue = 1000;
            color = '#9b59b6'; // Purple
            type = 'BOSS'; // Assuming MINIBOSS is classified as 'BOSS' here
        } else {
            // --- Weighted Random Selection Logic ---
            const totalWeight = ENEMY_SPAWN_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
            let randomRoll = Math.random() * totalWeight;
            let selectedEnemyType: EnemyType = 'REGULAR'; 

            for (const item of ENEMY_SPAWN_WEIGHTS) {
                if (randomRoll < item.weight) {
                    selectedEnemyType = item.type;
                    break;
                }
                randomRoll -= item.weight;
            }
            type = selectedEnemyType;

            // --- Type-Specific Initialization ---
            switch (type) {
                case 'REGULAR':
                    radius = 10 + Math.random() * 20; // Radius between 10 and 30
                    color = '#e74c3c'; 
                    maxHealth = Math.floor(radius * 4.5 + 10);
                    scoreValue = Math.floor(10 + (radius - 18) * 1.5);

                    // Speed based on size (8.0 to 6.0 multiplier)
                    const newMaxRange = 20; 
                    const normalizedRadius = (radius - 10) / newMaxRange; 
                    speedMultiplier = 8.0 - normalizedRadius * 2.0; 
                    break;

                case 'SMASHER':
                    radius = 25; 
                    color = '#000000'; // Black outer shell
                    maxHealth = 250;
                    scoreValue = 300;
                    // Smasher properties need to be set in the enemy object creation
                    break;
                
                case 'CRASHER':
                    radius = 15;
                    color = '#ff69b4'; // Pink
                    maxHealth = 40;
                    scoreValue = 50;
                    speedMultiplier = 1.8; // Fast triangle
                    break;

                case 'SNIPER':
                    radius = 22;
                    color = '#e74c3c'; // Red
                    maxHealth = 80;
                    scoreValue = 120;
                    // lastShotTime property will need to be initialized on the enemy object
                    break;
                    
                case 'AURA':
                    radius = 35;
                    color = '#33cc33'; // Green
                    maxHealth = 150;
                    scoreValue = 400;
                    // targetX/Y will need to be initialized on the enemy object
                    break;
            }
        }

        // Calculate spawn position outside the screen
        const spawnEdge = Math.floor(Math.random() * 4);
        let x: number, y: number;

        switch (spawnEdge) {
            case 0: // Top
                x = Math.random() * canvasWidth;
                y = -spawnPadding;
                break;
            case 1: // Right
                x = canvasWidth + spawnPadding;
                y = Math.random() * canvasHeight;
                break;
            case 2: // Bottom
                x = Math.random() * canvasWidth;
                y = canvasHeight + spawnPadding;
                break;
            case 3: // Left
                x = -spawnPadding;
                y = Math.random() * canvasHeight;
                break;
            default:
                // Should not happen, default to top left corner
                x = -spawnPadding;
                y = -spawnPadding;
        }

        const newEnemy: Enemy = {
            x,
            y,
            radius,
            color,
            health: maxHealth,
            maxHealth,
            scoreValue,
            isBoss,
            type,
            speedMultiplier: speedMultiplier > 0 ? speedMultiplier : 1, // Ensure positive speed
            
            // Initialize required properties for specific types
            smasherState: type === 'SMASHER' ? 'APPROACH' : undefined,
            rotationAngle: type === 'SMASHER' ? Math.random() * 2 * Math.PI : undefined,
            smasherOrbitDirection: type === 'SMASHER' ? (Math.random() < 0.5 ? 1 : -1) : undefined,
            smasherAttackRange: type === 'SMASHER' ? 200 : undefined, // Example
            lastShotTime: type === 'SNIPER' ? 0 : undefined,
            targetX: type === 'AURA' ? Math.random() * canvasWidth : undefined,
            targetY: type === 'AURA' ? Math.random() * canvasHeight : undefined,
        };

        enemies.push(newEnemy);
    }
    
    // --- Method 2: spawnBossMinion (Helper method, likely needs to be moved if it exists) ---
    // Assuming this method exists and calls spawnSingleEnemy, 
    // it will now need to accept the 'enemies' array and the coordinates.
    public spawnBossMinion(enemies: Enemy[], x: number, y: number): void {
        const minion: Enemy = {
            x,
            y,
            radius: 10,
            color: '#d2b4de', // Light purple
            health: 20,
            maxHealth: 20,
            scoreValue: 5,
            isBoss: false,
            type: 'MINION',
            speedMultiplier: 1.2,
        };
        enemies.push(minion);
    }

    // --- Method 3: spawnEnemies (The wave orchestrator) ---
    // This needs the enemies array, wave count, and canvas dimensions.
    public spawnEnemies(
        enemies: Enemy[], 
        count: number, 
        preventBossSpawn: boolean, 
        currentWave: number, 
        canvasWidth: number, 
        canvasHeight: number
    ): void {
        const spawnPadding = 50; 

        // 1. Determine if a boss spawn should be attempted (chance, flag)
        const bossAttempt = !preventBossSpawn && currentWave > 0 && Math.random() < 0.2;
        let regularEnemyCount = count;
        
        // Miniboss spawn logic: Only after Wave 5
        const spawnMiniboss = bossAttempt && currentWave > 5;
        
        if (spawnMiniboss) {
            // The 'true' flag triggers the purple miniboss logic in spawnSingleEnemy.
            this.spawnSingleEnemy(enemies, canvasWidth, canvasHeight, spawnPadding, true); 
            regularEnemyCount = Math.max(0, count - 1); // Replace one regular enemy with the boss
        }

        // Spawn regular enemies
        for (let i = 0; i < regularEnemyCount; i++) {
            this.spawnSingleEnemy(enemies, canvasWidth, canvasHeight, spawnPadding, false);
        }
    }
}
