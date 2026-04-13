import { Enemy } from '../diep.interfaces';

export const AuraEnemy = {
    create: (x: number, y: number): Partial<Enemy> => ({
        x, y, radius: 35, color: '#33cc33',
        health: 150, maxHealth: 150, scoreValue: 400
    }),

    update: (enemy: Enemy, player: any, deltaTime: number, currentTime: number, moveTowards: Function) => {
        if (enemy.targetX !== undefined && enemy.targetY !== undefined) {
            moveTowards(enemy, deltaTime, enemy.targetX, enemy.targetY, 0.5);
        }
    },

    draw: (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
        const pulse = Math.sin(Date.now() / 600) * 8;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius + 80 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#33cc331a';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
};