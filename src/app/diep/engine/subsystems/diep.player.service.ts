import { Injectable } from '@angular/core';
import { Player, DifficultyMode } from '../../core/diep.interfaces';
import { DiepPlayerUpgradesService } from './diep.player-upgrades.service';

@Injectable({ providedIn: 'root' })
export class DiepPlayerService {

    constructor(private upgradeService: DiepPlayerUpgradesService) {}

    /**
     * Centralized source for starting player stats.
     */
    public getDefaultPlayer(difficulty: DifficultyMode = 'MEDIUM', carryOverXp: number = 0): Player {
        return { 
            x: 400, y: 300, vx: 0, vy: 0, 
            radius: 20, 
            mass: 25,
            angle: 0, 
            maxSpeed: 3, 
            color: '#3498db', 
            health: 100, maxHealth: 100, 
            fireRate: 200, 
            bodyDamage: 20,
            bulletDamage: 10,
            bulletHealth: 10,
            bulletSpeed: 7.5,
            progression: this.upgradeService.getDefaultProgression(difficulty, carryOverXp)
        }
    }

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
        let lastAngle = player.angle;
        const FRICTION = Math.pow(0.9, F); 
        const ACCELERATION = 0.5 * F;

        if (keys['w']) player.vy -= ACCELERATION;
        if (keys['s']) player.vy += ACCELERATION;
        if (keys['a']) player.vx -= ACCELERATION;
        if (keys['d']) player.vx += ACCELERATION;

        player.x += player.vx * F;
        player.y += player.vy * F;

        player.vx *= FRICTION;
        player.vy *= FRICTION;

        const currentSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        if (currentSpeed > player.maxSpeed) {
            const ratio = player.maxSpeed / currentSpeed;
            player.vx *= ratio;
            player.vy *= ratio;
        }

        if (mouseAiming) {
            player.angle = Math.atan2(mousePos.y - player.y, mousePos.x - player.x);
        } else if (Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1) {
            player.angle = Math.atan2(player.vy, player.vx);
        }
        lastAngle = player.angle;

        player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));
        
        player.health = Math.min(player.maxHealth, player.health + (0.5 * deltaTime / 1000));

        return { lastAngle };
    }
}