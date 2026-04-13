import { Enemy, Player, Bullet } from './diep.interfaces';
import { EnemyRegistry } from './Enemies/enemy.registry';

/**
 * Utility class dedicated to updating the state, position, and actions
 * of all enemy types each frame via the EnemyRegistry.
 */
export class DiepEnemyLogic {

    /**
     * Executes the update logic for all enemies in the game.
     */
    public static updateAllEnemies(
        enemies: Enemy[], 
        bullets: Bullet[], 
        player: Player, 
        deltaTime: number,
        canvasWidth: number,
        canvasHeight: number,
        currentTime: number
    ): void {
    
        enemies.forEach(enemy => {
            // This calls the registry, which finds the correct .ts file (Sniper, Guard, Smasher, etc.)
            // and runs the specific update logic we moved there.
            EnemyRegistry.update(enemy, player, bullets, deltaTime, currentTime);

            // Global logic (like bounds checking or player collision) stays here
            this.handleGlobalCollision(enemy, player);
        });

        // NEW: Apply separation logic after individual movements to prevent stacking
        // This ensures that even if they are all targeting the player, they nudge each other apart.
        this.handleEnemySeparation(enemies);
    }

    /**
     * Prevents enemies from overlapping with one another by pushing them apart.
     * Uses circle-circle intersection math to calculate a soft repulsive force.
     */
    private static handleEnemySeparation(enemies: Enemy[]): void {
        const pushStrength = 0.2; // Adjust for "softer" (0.1) or "firmer" (0.5) separation

        for (let i = 0; i < enemies.length; i++) {
            const e1 = enemies[i];
            for (let j = i + 1; j < enemies.length; j++) {
                const e2 = enemies[j];

                const dx = e2.x - e1.x;
                const dy = e2.y - e1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = e1.radius + e2.radius;

                // Check if the distance between centers is less than the combined radii
                if (distance < minDistance && distance > 0) {
                    // Calculate how much they overlap
                    const overlap = minDistance - distance;
                    
                    // Normal vector (normalized direction of the overlap)
                    const nx = dx / distance;
                    const ny = dy / distance;

                    // Calculate the displacement vector based on pushStrength
                    const moveX = nx * overlap * pushStrength;
                    const moveY = ny * overlap * pushStrength;

                    // Apply the push in opposite directions to both enemies
                    // No damage is dealt here, just coordinate adjustment
                    e1.x -= moveX;
                    e1.y -= moveY;
                    e2.x += moveX;
                    e2.y += moveY;
                }
            }
        }
    }

    /**
     * Simple collision check to damage player and push enemies back.
     */
    private static handleGlobalCollision(enemy: Enemy, player: Player): void {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < enemy.radius + player.radius) {
            // Damage player
            player.health -= 0.5;

            // Simple knockback
            const angle = Math.atan2(dy, dx);
            const knockbackForce = 2;
            enemy.x -= Math.cos(angle) * knockbackForce;
            enemy.y -= Math.sin(angle) * knockbackForce;
        }
    }
}