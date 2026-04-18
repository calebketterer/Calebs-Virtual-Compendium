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
                    if (enemy.isGhost || enemy.health <= 0) return;

                    const dx = bullet.x - enemy.x;
                    const dy = bullet.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < bullet.radius + enemy.radius) {
                        enemy.health -= 15;
                        hit = true;

                        // Mother Boss specific mid-combat spawn logic
                        if (enemy.type === 'MOTHER' && Math.random() < 0.5) {
                            const angle = Math.random() * Math.PI * 2;
                            const spawnX = enemy.x + Math.cos(angle) * (enemy.radius + 5);
                            const spawnY = enemy.y + Math.sin(angle) * (enemy.radius + 5);
                            this.spawner.spawnBossMinion(enemies, spawnX, spawnY);
                        }

                        if (enemy.health <= 0) onKillEnemy(enemy);
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
            if (enemy.isGhost) {
                remainingEnemies.push(enemy);
                return;
            }

            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < enemy.radius + player.radius) {
                const damageToPlayer = enemy.health * collisionDamageFraction;
                player.health -= damageToPlayer;
                onKillEnemy(enemy);
                // Enemy is "killed" on impact, so it's not pushed to remainingEnemies
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