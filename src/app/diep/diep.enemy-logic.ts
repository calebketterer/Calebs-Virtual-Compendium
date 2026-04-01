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