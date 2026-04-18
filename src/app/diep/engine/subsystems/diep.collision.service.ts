import { Injectable } from '@angular/core';
import { Player, Bullet, Enemy } from '../../diep.interfaces';
import { EnemySpawnerService } from './diep.enemy-spawner';

@Injectable({
    providedIn: 'root'
})
export class DiepCollisionService {
    constructor(private spawner: EnemySpawnerService) {}

    /**
     * Handles all physics-based collision checks.
     * Logic moved from the main engine to keep the core loop clean.
     */
    public handleCollisions(
        player: Player,
        bullets: Bullet[],
        enemies: Enemy[],
        onKillEnemy: (enemy: Enemy) => void
    ) {
        const collisionDamageFraction = 0.25;
        const remainingBullets: Bullet[] = [];

        // 1. Bullets vs Enemies / Player
        bullets.forEach(bullet => {
            let hit = false;

            if (bullet.ownerType === 'PLAYER') {
                enemies.forEach(enemy => {
                    if (enemy.isGhost || enemy.health <= 0 || hit) return;

                    const dx = bullet.x - enemy.x;
                    const dy = bullet.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < bullet.radius + enemy.radius) {
                        // Consumes the bullet
                        hit = true;

                        // Only deal damage if NOT invulnerable
                        if (!enemy.isInvulnerable) {
                            enemy.health -= 15;

                            // Mother Boss specific mid-combat spawn logic
                            if (enemy.type === 'MOTHER' && Math.random() < 0.5) {
                                const angle = Math.random() * Math.PI * 2;
                                const spawnX = enemy.x + Math.cos(angle) * (enemy.radius + 5);
                                const spawnY = enemy.y + Math.sin(angle) * (enemy.radius + 5);
                                this.spawner.spawnBossMinion(enemies, spawnX, spawnY);
                            }

                            if (enemy.health <= 0) onKillEnemy(enemy);
                        }
                    }
                });
            } else if (bullet.ownerType === 'ENEMY') {
                const dx = bullet.x - player.x;
                const dy = bullet.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < bullet.radius + player.radius) {
                    player.health -= 10;
                    hit = true;
                }
            }

            if (!hit) remainingBullets.push(bullet);
        });

        // 2. Player vs Enemy Body Collision
        const remainingEnemies: Enemy[] = [];
        enemies.forEach(enemy => {
            // Ghosts can't be touched physically
            if (enemy.isGhost) {
                remainingEnemies.push(enemy);
                return;
            }

            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < enemy.radius + player.radius) {
                // Player always takes damage for touching a physical enemy
                const damageToPlayer = (enemy.health || 100) * collisionDamageFraction;
                player.health -= damageToPlayer;

                // Only kill the enemy on impact if it's NOT invulnerable
                if (!enemy.isInvulnerable) {
                    onKillEnemy(enemy);
                } else {
                    // Invulnerable enemies survive the collision
                    remainingEnemies.push(enemy);
                }
            } else {
                remainingEnemies.push(enemy);
            }
        });

        return {
            bullets: remainingBullets,
            enemies: remainingEnemies
        };
    }
}