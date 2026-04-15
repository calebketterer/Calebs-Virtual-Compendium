import { Enemy, Player } from '../diep.interfaces';

export const MinionEnemy = {
    create: (x: number, y: number): Partial<Enemy> => ({
        x, y, radius: 10, color: '#d2b4de',
        health: 20, maxHealth: 20, scoreValue: 5,
        speedMultiplier: 1.2
    }),

    update: (enemy: Enemy, player: Player, deltaTime: number, currentTime: number, moveTowards: Function) => {
        const multiplier = enemy.speedMultiplier || 1;
        moveTowards(enemy, deltaTime, player.x, player.y, 3.5 * multiplier);
    },

    draw: (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();
        ctx.strokeStyle = '#9b59b6';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
};