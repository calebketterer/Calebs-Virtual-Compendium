import { Injectable } from '@angular/core';
import { Player, Bullet, Enemy } from '../../core/diep.interfaces';
import { EnemySpawnerService } from '../../enemies/diep.enemy-spawner';
import { DiepArenaManager, TileType } from './diep.arena-manager';

@Injectable({ providedIn: 'root' })
export class DiepCollisionService {
    constructor(
        private spawner: EnemySpawnerService,
        private arenaManager: DiepArenaManager 
    ) {}

    public handleCollisions(
        player: Player,
        bullets: Bullet[],
        enemies: Enemy[],
        onKillEnemy: (enemy: Enemy) => void
    ) {
        this.handleEnvironmentCollision(player);
        enemies.forEach(e => this.handleEnvironmentCollision(e));
        
        for (let i = bullets.length - 1; i >= 0; i--) {
            if (this.handleEnvironmentCollision(bullets[i], true)) {
                bullets.splice(i, 1);
            }
        }

        this.handleBulletVsBullet(bullets);

        bullets.forEach(bullet => {
            if (bullet.ownerType !== 'PLAYER' || bullet.health <= 0) return;
            enemies.forEach(enemy => {
                if (enemy.isGhost || enemy.health <= 0 || bullet.health <= 0) return;
                const dist = this.getDist(bullet, enemy);
                const combinedRadius = bullet.radius + enemy.radius;

                if (dist < combinedRadius) {
                    this.resolveHealthTrade(bullet, enemy);
                    if (enemy.onHit) enemy.onHit(enemies, this.spawner, bullet);
                    if (enemy.health <= 0) {
                        if (enemy.onDeath) enemy.onDeath(enemies, this.spawner, enemy, player);
                        onKillEnemy(enemy);
                    }
                    const angle = Math.atan2(bullet.y - enemy.y, bullet.x - enemy.x);
                    const overlap = combinedRadius - dist;
                    bullet.dx += Math.cos(angle) * overlap * 0.3; 
                    bullet.dy += Math.sin(angle) * overlap * 0.3;
                    enemy.vx -= Math.cos(angle) * overlap * 0.05; 
                    enemy.vy -= Math.sin(angle) * overlap * 0.05;
                }
            });
        });

        bullets.forEach(bullet => {
            if (bullet.ownerType !== 'ENEMY' || bullet.health <= 0) return;
            const dist = this.getDist(bullet, player);
            if (dist < bullet.radius + player.radius) {
                this.resolveHealthTrade(bullet, player);
                player.vx += bullet.dx * 0.01;
                player.vy += bullet.dy * 0.01;
            }
        });

        enemies.forEach(enemy => {
            if (enemy.isGhost || enemy.health <= 0) return;
            const dist = this.getDist(player, enemy);
            const combinedRadius = enemy.radius + player.radius;
            if (dist < combinedRadius) {
                this.resolveHealthTrade(player, enemy);
                if (enemy.health <= 0 && !enemy.isInvulnerable) {
                    if (enemy.onDeath) enemy.onDeath(enemies, this.spawner, enemy, player);
                    onKillEnemy(enemy);
                }
                this.applyOverlapPush(player, enemy, dist, combinedRadius, 0.4);
            }
        });

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

    public handleEnvironmentCollision(entity: any, isBullet: boolean = false): boolean {
        // GHOSTS bypass all environment collisions entirely
        if (entity.isGhost) return false;

        const tileSize = this.arenaManager.tileSize;
        const margin = isBullet ? 2 : 0;
        const left = entity.x - entity.radius - margin;
        const right = entity.x + entity.radius + margin;
        const top = entity.y - entity.radius - margin;
        const bottom = entity.y + entity.radius + margin;

        const gridLeft = Math.floor(left / tileSize);
        const gridRight = Math.floor(right / tileSize);
        const gridTop = Math.floor(top / tileSize);
        const gridBottom = Math.floor(bottom / tileSize);

        for (let gy = gridTop; gy <= gridBottom; gy++) {
            for (let gx = gridLeft; gx <= gridRight; gx++) {
                const tile = this.arenaManager.getTileAt(gx * tileSize + 1, gy * tileSize + 1);
                if (!tile) continue;

                // 1. HOLE LOGIC: isFlying objects ignore holes. Everyone else dies.
                if (tile.type === TileType.HOLE && tile.transition > 0.8 && !entity.isFlying) {
                    const centerTile = this.arenaManager.getTileAt(entity.x, entity.y);
                    if (centerTile === tile) {
                        entity.health = 0;
                        return true;
                    }
                }

                // 2. WALL LOGIC: Both normal AND isFlying objects hit walls.
                const wallThreshold = isBullet ? 0.2 : 0.5;
                if (tile.type === TileType.WALL && tile.transition > wallThreshold) {
                    if (isBullet) {
                        entity.health = 0;
                        entity.dx = 0;
                        entity.dy = 0;
                        return true;
                    }

                    const tileCenterX = (gx * tileSize) + tileSize / 2;
                    const tileCenterY = (gy * tileSize) + tileSize / 2;
                    const diffX = entity.x - tileCenterX;
                    const diffY = entity.y - tileCenterY;
                    const overlapX = (tileSize / 2 + entity.radius) - Math.abs(diffX);
                    const overlapY = (tileSize / 2 + entity.radius) - Math.abs(diffY);

                    if (overlapX > 0 && overlapY > 0) {
                        if (overlapX < overlapY) {
                            entity.x += diffX > 0 ? overlapX : -overlapX;
                            entity.vx = 0;
                        } else {
                            entity.y += diffY > 0 ? overlapY : -overlapY;
                            entity.vy = 0;
                        }
                    }
                }
            }
        }
        return false;
    }

    private applyOverlapPush(a: any, b: any, dist: number, combinedRadius: number, strength: number) {
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const overlap = combinedRadius - dist;
        const weightA = b.radius / (a.radius + b.radius);
        const weightB = a.radius / (a.radius + b.radius);
        a.vx -= Math.cos(angle) * overlap * strength * weightA;
        a.vy -= Math.sin(angle) * overlap * strength * weightA;
        b.vx += Math.cos(angle) * overlap * strength * weightB;
        b.vy += Math.sin(angle) * overlap * strength * weightB;
    }

    private resolveHealthTrade(a: any, b: any) {
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