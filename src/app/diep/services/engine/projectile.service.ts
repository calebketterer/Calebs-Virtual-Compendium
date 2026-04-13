import { Injectable } from '@angular/core';
import { Player, Bullet, TrailSegment } from '../../diep.interfaces';

@Injectable({ providedIn: 'root' })
export class ProjectileManagerService {
  
  public updateBullets(bullets: Bullet[], F: number, width: number, height: number): Bullet[] {
    bullets.forEach(b => {
      b.x += b.dx * F;
      b.y += b.dy * F;
    });
    // Remove off-screen bullets
    return bullets.filter(b => b.x > 0 && b.x < width && b.y > 0 && b.y < height);
  }

  public createToxicTrail(bullets: Bullet[], trails: TrailSegment[], currentTime: number): void {
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
  }

  public fireBullet(player: Player, mousePos: {x: number, y: number}, isMouseAiming: boolean, lastAngle: number): Bullet {
    const speed = 8;
    const angle = isMouseAiming 
        ? Math.atan2(mousePos.y - player.y, mousePos.x - player.x)
        : lastAngle;
    
    const barrelLength = player.radius * 2.0;

    return {
      x: player.x + Math.cos(angle) * barrelLength,
      y: player.y + Math.sin(angle) * barrelLength,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      radius: 6,
      color: '#f39c12',
      ownerType: 'PLAYER'
    };
  }
}