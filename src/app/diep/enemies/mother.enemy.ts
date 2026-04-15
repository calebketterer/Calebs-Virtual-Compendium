import { Enemy, Player } from '../diep.interfaces';

export const MotherEnemy = {
    create: (x: number, y: number): Partial<Enemy> => ({
        x, y, radius: 40, color: '#9b59b6',
        health: 300, maxHealth: 300, scoreValue: 500,
        
        onDeath: (enemies: Enemy[], spawner: any, deadEnemy: Enemy) => {
            const minionCount = Math.floor(Math.random() * 4) + 3;
            for (let i = 0; i < minionCount; i++) {
                // Use deadEnemy.x and deadEnemy.y instead of the initial x and y
                const spawnX = deadEnemy.x + (Math.random() - 0.5) * 20;
                const spawnY = deadEnemy.y + (Math.random() - 0.5) * 20;
                spawner.spawnBossMinion(enemies, spawnX, spawnY);
            }
        }
    }),

    update: (enemy: Enemy, player: Player, deltaTime: number, currentTime: number, moveTowards: Function) => {
        enemy.health = Math.min(enemy.maxHealth, enemy.health + (1 * deltaTime / 1000));
        moveTowards(enemy, deltaTime, player.x, player.y, 0.6);
    },

    draw: (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        
        // Mother's glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#8e44ad';
        ctx.fill();
        
        ctx.strokeStyle = '#4b0082';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
    }
};