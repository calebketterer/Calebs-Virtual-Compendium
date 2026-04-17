import { Injectable } from '@angular/core';
import { Player } from '../diep.interfaces';

@Injectable({ providedIn: 'root' })
export class DiepPlayerService {
    /**
     * Handles movement logic, rotation, and health regeneration.
     */
    public update(
        player: Player,
        keys: { [key: string]: boolean },
        mousePos: { x: number; y: number },
        mouseAiming: boolean,
        width: number,
        height: number,
        F: number,
        deltaTime: number
    ): { lastAngle: number } {
        let moved = false, dx = 0, dy = 0, lastAngle = player.angle;

        // 1. Movement Calculation
        if (keys['w']) { dy -= 1; moved = true; }
        if (keys['s']) { dy += 1; moved = true; }
        if (keys['a']) { dx -= 1; moved = true; }
        if (keys['d']) { dx += 1; moved = true; }

        if (moved) {
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
                player.x += (dx / len) * player.maxSpeed * F;
                player.y += (dy / len) * player.maxSpeed * F;
                
                if (!mouseAiming) {
                    const newAngle = Math.atan2(dy, dx);
                    if (!isNaN(newAngle)) {
                        player.angle = newAngle;
                        lastAngle = newAngle;
                    }
                }
            }
        }

        // 2. Rotation
        if (mouseAiming) {
            player.angle = Math.atan2(mousePos.y - player.y, mousePos.x - player.x);
        }

        // 3. Boundary Clamping & Health Regen
        player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));
        player.health = Math.min(player.maxHealth, player.health + (0.5 * deltaTime / 1000));

        return { lastAngle };
    }
}