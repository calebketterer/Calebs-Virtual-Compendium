import { Injectable } from '@angular/core';
import { Bullet, TrailSegment, Player } from '../diep.interfaces';

@Injectable({
    providedIn: 'root'
})
export class DiepProjectileService {
    /**
     * Updates bullet positions and filters out those that leave the stage boundaries.
     */
    public updateBullets(bullets: Bullet[], F: number, width: number, height: number): Bullet[] {
        return bullets
            .map(b => {
                b.x += b.dx * F;
                b.y += b.dy * F;
                return b;
            })
            .filter(b => b.x > 0 && b.x < width && b.y > 0 && b.y < height);
    }

    /**
     * Manages the lifecycle of toxic trails: creation from bullets, growth, fading, and player damage.
     */
    public updateTrails(
        trails: TrailSegment[], 
        bullets: Bullet[], 
        player: Player, 
        currentTime: number
    ): TrailSegment[] {
        // 1. Spawn new segments from active bullets with the 'hasTrail' flag
        bullets.forEach(bullet => {
            if (bullet.hasTrail) {
                trails.push({
                    x: bullet.x,
                    y: bullet.y,
                    radius: 5,
                    maxRadius: 20,
                    color: '#27ae60',
                    opacity: 0.6,
                    creationTime: currentTime,
                    lifespan: 1000
                });
            }
        });

        // 2. Update existing segments and handle collisions
        for (let i = trails.length - 1; i >= 0; i--) {
            const t = trails[i];
            const age = currentTime - t.creationTime;
            const lifeRatio = age / t.lifespan;

            if (age > t.lifespan) {
                trails.splice(i, 1);
                continue;
            }

            // Visual progression
            t.radius = 5 + (t.maxRadius - 5) * lifeRatio;
            t.opacity = 0.6 * (1 - lifeRatio);

            // Collision with Player
            const dx = player.x - t.x;
            const dy = player.y - t.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < t.radius + player.radius) {
                player.health -= 0.05; // Rapid tick damage
            }
        }
        return trails;
    }
}