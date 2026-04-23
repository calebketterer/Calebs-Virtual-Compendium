import { Injectable } from '@angular/core';
import { Bullet, TrailSegment, Player } from '../../core/diep.interfaces';

@Injectable({
    providedIn: 'root'
})
export class DiepProjectileService {
    public updateBullets(
        bullets: Bullet[], 
        F: number, 
        width: number, 
        height: number, 
        player: Player, 
        deltaTime: number
    ): Bullet[] {
        // PAUSE CHECK: If deltaTime is 0, do absolutely nothing.
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