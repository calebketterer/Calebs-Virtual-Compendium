import { Enemy } from '../diep.interfaces';

export const AuraEnemy = {
    update: (enemy: Enemy, player: any, deltaTime: number, currentTime: number, moveTowards: Function) => {
        const auraSpeed = 0.5;
        
        // If target is missing, the registry or spawner should have initialized it
        if (enemy.targetX === undefined || enemy.targetY === undefined) {
            return; 
        }

        const distToTarget = Math.sqrt(Math.pow(enemy.targetX - enemy.x, 2) + Math.pow(enemy.targetY - enemy.y, 2));
        
        // If reached target, we stop or wait for the Spawner/Logic to give a new one
        if (distToTarget > 5) {
            moveTowards(enemy, deltaTime, enemy.targetX, enemy.targetY, auraSpeed);
        }
    },

    draw: (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
        ctx.save();
        // Pulsing effect using current time
        const pulse = Math.sin(Date.now() / 500) * 5;
        
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius + 40 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46, 204, 113, 0.2)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }
};