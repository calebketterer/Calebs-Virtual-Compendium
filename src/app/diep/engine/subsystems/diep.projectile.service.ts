import { Injectable } from '@angular/core';
import { Bullet, TrailSegment, Player } from '../../core/diep.interfaces';

@Injectable({
    providedIn: 'root'
})
export class DiepProjectileService {
    private lastShotTime = 0;

    /**
     * Handles the logic for creating a bullet, calculating recoil, 
     * and managing the player's fire rate cooldown based on frequency.
     */
    public shootBullet(
        player: Player, 
        mousePos: { x: number; y: number }, 
        mouseAiming: boolean, 
        lastAngle: number, 
        bullets: Bullet[]
    ): void {
        const now = Date.now();
        
        // frequency (shots/sec) to delay (ms) conversion
        const fireDelay = 1000 / player.fireRate;

        if (now - this.lastShotTime < fireDelay) return;
        this.lastShotTime = now;

        const angle = mouseAiming 
            ? Math.atan2(mousePos.y - player.y, mousePos.x - player.x) 
            : lastAngle;
            
        const barrelLength = player.radius * 2.0;
        const radius = 7.5;
        
        // Calculate mass and recoil
        const bulletMass = (Math.pow(radius, 2) * Math.PI) * (player.bulletHealth * 0.001);
        const recoilForce = (bulletMass * player.bulletSpeed) / player.mass;

        // Apply recoil to player velocity
        player.vx -= Math.cos(angle) * recoilForce;
        player.vy -= Math.sin(angle) * recoilForce;

        bullets.push({
            id: Math.random().toString(36).substr(2, 9),
            x: player.x + Math.cos(angle) * barrelLength,
            y: player.y + Math.sin(angle) * barrelLength,
            dx: Math.cos(angle) * player.bulletSpeed,
            dy: Math.sin(angle) * player.bulletSpeed,
            radius: radius,
            mass: bulletMass,
            color: player.color,
            ownerType: 'PLAYER',
            health: player.bulletHealth,
            maxHealth: player.bulletHealth,
            damage: player.bulletDamage
        });
    }

    public resetCooldown(): void {
        this.lastShotTime = 0;
    }

    public updateBullets(
        bullets: Bullet[], 
        F: number, 
        width: number, 
        height: number, 
        player: Player, 
        deltaTime: number
    ): Bullet[] {
        if (deltaTime <= 0) return bullets;

        return bullets.map(b => {
            if (b.isBomb) {
                if (!b.isExploding) {
                    b.dx *= Math.pow(0.98, F);
                    b.dy *= Math.pow(0.98, F);
                } else {
                    b.dx = 0;
                    b.dy = 0;
                }
                
                if (b.timer !== undefined) {
                    b.timer -= deltaTime;
                }
            }

            b.x += b.dx * F;
            b.y += b.dy * F;
            return b;
        }).filter(b => {
            if (b.isBomb) {
                return b.timer !== undefined && b.timer > 0;
            }
            return b.x > -50 && b.x < width + 50 && b.y > -50 && b.y < height + 50;
        });
    }

    public updateTrails(
        trails: TrailSegment[], 
        bullets: Bullet[], 
        player: Player, 
        currentTime: number
    ): TrailSegment[] {
        bullets.forEach(bullet => {
            if (bullet.hasTrail) {
                trails.push({
                    x: bullet.x, y: bullet.y,
                    radius: 5, maxRadius: 20,
                    color: '#27ae60', opacity: 0.6,
                    creationTime: currentTime, lifespan: 1000
                });
            }
        });

        for (let i = trails.length - 1; i >= 0; i--) {
            const t = trails[i];
            const age = currentTime - t.creationTime;
            const lifeRatio = age / t.lifespan;

            if (age > t.lifespan) {
                trails.splice(i, 1);
                continue;
            }

            t.radius = 5 + (t.maxRadius - 5) * lifeRatio;
            t.opacity = 0.6 * (1 - lifeRatio);

            const dx = player.x - t.x;
            const dy = player.y - t.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < t.radius + player.radius) {
                player.health -= 0.04; 
            }
        }
        return trails;
    }
}