import { Enemy, Player } from '../diep.interfaces';

export const StandardEnemy = {
    update: (enemy: Enemy, player: Player, deltaTime: number, currentTime: number, moveTowards: Function) => {
        let speed = enemy.type === 'MINION' ? 3.5 : 0.3;
        speed *= (enemy.speedMultiplier || 1);
        moveTowards(enemy, deltaTime, player.x, player.y, speed);
    },

    draw: (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();

        ctx.strokeStyle = (enemy.type === 'MINION') ? '#9b59b6' : '#c0392b';
        ctx.lineWidth = (enemy.type === 'MINION') ? 1.5 : 2;
        ctx.stroke();
    }
};