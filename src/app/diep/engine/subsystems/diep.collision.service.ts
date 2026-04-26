import { Injectable } from '@angular/core';
import { Player, Bullet, Enemy } from '../../core/diep.interfaces';
import { EnemySpawnerService } from './diep.enemy-spawner';

@Injectable({
    providedIn: 'root'
})
export class DiepCollisionService {
    constructor(private spawner: EnemySpawnerService) {}

    public handleCollisions(
        player: Player,
        bullets: Bullet[],
        enemies: Enemy[],
        onKillEnemy: (enemy: Enemy) => void
    ) {
        // 1. Bullet vs. Bullet
        this.handleBulletVsBullet(bullets);

        // 2. Bullet vs. Enemy
        bullets.forEach(bullet => {
            if (bullet.ownerType !== 'PLAYER' || bullet.health <= 0) return;
            enemies.forEach(enemy => {
                if (enemy.isGhost || enemy.health <= 0 || bullet.health <= 0) return;
                
                const dist = this.getDist(bullet, enemy);
                const combinedRadius = bullet.radius + enemy.radius;

                if (dist < combinedRadius) {
                    this.resolveHealthTrade(bullet, enemy);
                    
                    if (enemy.type === 'MOTHER' && Math.random() < 0.5) {
                        const angle = Math.random() * Math.PI * 2;
                        this.spawner.spawnBossMinion(enemies, enemy.x + Math.cos(angle) * 55, enemy.y + Math.sin(angle) * 55);
                    }
                    if (enemy.health <= 0) onKillEnemy(enemy);

                    // --- SNAPPY RICOCHET ---
                    const angle = Math.atan2(bullet.y - enemy.y, bullet.x - enemy.x);
                    const overlap = combinedRadius - dist;
                    
                    // High bounce for bullets, low knockback for enemies (feels "heavy")
                    bullet.dx += Math.cos(angle) * overlap * 0.3; 
                    bullet.dy += Math.sin(angle) * overlap * 0.3;
                    
                    enemy.vx -= Math.cos(angle) * overlap * 0.05; 
                    enemy.vy -= Math.sin(angle) * overlap * 0.05;
                }
            });
        });

        // 3. Bullet vs. Player
        bullets.forEach(bullet => {
            if (bullet.ownerType !== 'ENEMY' || bullet.health <= 0) return;
            const dist = this.getDist(bullet, player);
            if (dist < bullet.radius + player.radius) {
                this.resolveHealthTrade(bullet, player);
                // Lower impact recoil so you don't lose control of your tank
                player.vx += bullet.dx * 0.01;
                player.vy += bullet.dy * 0.01;
            }
        });

        // 4. Enemy vs. Player (The "Grind")
        enemies.forEach(enemy => {
            if (enemy.isGhost || enemy.health <= 0) return;
            const dist = this.getDist(player, enemy);
            const combinedRadius = enemy.radius + player.radius;
            if (dist < combinedRadius) {
                this.resolveHealthTrade(player, enemy);
                if (enemy.health <= 0 && !enemy.isInvulnerable) onKillEnemy(enemy);
                
                // Snappy push: Higher strength, but we don't let it stack infinitely
                this.applyOverlapPush(player, enemy, dist, combinedRadius, 0.4);
            }
        });

        // 5. Enemy vs. Enemy
        for (let i = 0; i < enemies.length; i++) {
            for (let j = i + 1; j < enemies.length; j++) {
                const e1 = enemies[i]; const e2 = enemies[j];
                if (e1.health <= 0 || e2.health <= 0 || e1.isGhost || e2.isGhost) continue;
                const dist = this.getDist(e1, e2);
                const combinedRadius = e1.radius + e2.radius;
                if (dist < combinedRadius) {
                    this.applyOverlapPush(e1, e2, dist, combinedRadius, 0.25);
                }
            }
        }

        return {
            bullets: bullets.filter(b => b.health > 0),
            enemies: enemies.filter(e => e.health > 0 || e.isInvulnerable)
        };
    }

    private applyOverlapPush(a: any, b: any, dist: number, combinedRadius: number, strength: number) {
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const overlap = combinedRadius - dist;
        
        // Mass weighting: If an object is "heavier" (larger radius), it moves less
        const weightA = b.radius / (a.radius + b.radius);
        const weightB = a.radius / (a.radius + b.radius);

        a.vx -= Math.cos(angle) * overlap * strength * weightA;
        a.vy -= Math.sin(angle) * overlap * strength * weightA;
        b.vx += Math.cos(angle) * overlap * strength * weightB;
        b.vy += Math.sin(angle) * overlap * strength * weightB;
    }

    private resolveHealthTrade(a: any, b: any) {
        // Diep bullets trade health fast to prevent sticking
        const dmgToA = (b.damage || b.bodyDamage || 15);
        const dmgToB = (a.damage || a.bodyDamage || 15);
        
        a.health -= dmgToA;
        if (!b.isInvulnerable) b.health -= dmgToB;
    }

    private handleBulletVsBullet(bullets: Bullet[]) {
        for (let i = 0; i < bullets.length; i++) {
            for (let j = i + 1; j < bullets.length; j++) {
                const b1 = bullets[i]; const b2 = bullets[j];
                if (b1.ownerType === b2.ownerType || b1.health <= 0 || b2.health <= 0) continue;
                if (this.getDist(b1, b2) < b1.radius + b2.radius) {
                    this.resolveHealthTrade(b1, b2);
                }
            }
        }
    }

    private getDist(obj1: any, obj2: any): number {
        return Math.sqrt(Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2));
    }
}