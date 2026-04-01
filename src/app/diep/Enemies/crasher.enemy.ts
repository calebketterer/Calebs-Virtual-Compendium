import { Enemy, Player } from '../diep.interfaces';

export const CrasherEnemy = {
    update: (enemy: Enemy, player: Player, deltaTime: number, currentTime: number, moveTowards: Function) => {
        const finalSpeed = 2 * (enemy.speedMultiplier || 1);
        moveTowards(enemy, deltaTime, player.x, player.y, finalSpeed);
    },

    draw: (ctx: CanvasRenderingContext2D, enemy: Enemy, player: Player) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const angle = Math.atan2(dy, dx);
        ctx.rotate(angle + Math.PI / 2);

        ctx.beginPath();
        ctx.moveTo(0, -enemy.radius);
        ctx.lineTo(-enemy.radius * 0.866, enemy.radius * 0.5);
        ctx.lineTo(enemy.radius * 0.866, enemy.radius * 0.5);
        ctx.closePath();

        ctx.fillStyle = enemy.color;
        ctx.fill();
        ctx.strokeStyle = '#9b59b6';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }
};