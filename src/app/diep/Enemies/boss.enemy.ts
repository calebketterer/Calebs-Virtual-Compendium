import { Enemy, Player } from '../diep.interfaces';

export const BossEnemy = {
    update: (enemy: Enemy, player: Player, deltaTime: number, currentTime: number, moveTowards: Function) => {
        // Regen 1 HP/sec
        enemy.health = Math.min(enemy.maxHealth, enemy.health + (1 * deltaTime / 1000));
        moveTowards(enemy, deltaTime, player.x, player.y, 0.75);
    },

    draw: (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        
        // Boss Shadow
        ctx.shadowBlur = 10;
        ctx.shadowColor = enemy.color;
        ctx.fill();
        
        ctx.strokeStyle = '#8e44ad';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
    }
};