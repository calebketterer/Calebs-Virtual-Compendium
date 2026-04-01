import { Enemy, Player } from '../diep.interfaces';

export const CrasherEnemy = {
    create: (x: number, y: number): Partial<Enemy> => ({
        x, y, radius: 15, color: '#ff69b4',
        health: 40, maxHealth: 40, scoreValue: 50,
        speedMultiplier: 1.8
    }),

    update: (enemy: Enemy, player: Player, deltaTime: number, currentTime: number, moveTowards: Function) => {
        moveTowards(enemy, deltaTime, player.x, player.y, 2 * (enemy.speedMultiplier || 1));
    },

    draw: (ctx: CanvasRenderingContext2D, enemy: Enemy, player: Player) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(Math.atan2(player.y - enemy.y, player.x - enemy.x) + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -enemy.radius);
        ctx.lineTo(-enemy.radius * 0.8, enemy.radius * 0.6);
        ctx.lineTo(enemy.radius * 0.8, enemy.radius * 0.6);
        ctx.closePath();
        ctx.fillStyle = enemy.color;
        ctx.fill();
        ctx.strokeStyle = '#8e44ad';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
};