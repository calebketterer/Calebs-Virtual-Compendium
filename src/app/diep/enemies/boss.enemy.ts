import { Enemy, Player } from '../diep.interfaces';

export const BossEnemy = {
    create: (x: number, y: number): Partial<Enemy> => ({
        x, y, radius: 50, color: '#9b59b6',
        health: 500, maxHealth: 500, scoreValue: 1000
    }),

    update: (enemy: Enemy, player: Player, deltaTime: number, currentTime: number, moveTowards: Function) => {
        enemy.health = Math.min(enemy.maxHealth, enemy.health + (1 * deltaTime / 1000));
        moveTowards(enemy, deltaTime, player.x, player.y, 0.75);
    },

    draw: (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#8e44ad';
        ctx.fill();
        ctx.strokeStyle = '#4b0082';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.restore();
    }
};