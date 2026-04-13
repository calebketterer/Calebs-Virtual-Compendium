import { Injectable } from '@angular/core';
import { Player, Bullet, Enemy, TrailSegment } from '../../diep.interfaces';

@Injectable({
  providedIn: 'root'
})
export class PhysicsService { // <--- ENSURE 'export' IS HERE
  private readonly FPS_60_TIME = 1000 / 60;

  public getNormalizationFactor(deltaTime: number): number {
    return deltaTime / this.FPS_60_TIME;
  }

  public clampPosition(entity: { x: number, y: number, radius: number }, width: number, height: number): void {
    entity.x = Math.max(entity.radius, Math.min(width - entity.radius, entity.x));
    entity.y = Math.max(entity.radius, Math.min(height - entity.radius, entity.y));
  }

  public checkCircleCollision(obj1: { x: number, y: number, radius: number }, obj2: { x: number, y: number, radius: number }): boolean {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < obj1.radius + obj2.radius;
  }

  public updateToxicTrails(trails: TrailSegment[], player: Player, currentTime: number): void {
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

      if (this.checkCircleCollision(player, t)) {
        player.health -= 0.15;
      }
    }
  }
}