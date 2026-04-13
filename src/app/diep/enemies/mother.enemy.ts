import { Enemy, Player } from '../diep.interfaces';

export const MotherEnemy = {
    create: (x: number, y: number): Partial<Enemy> => ({
        x, y, radius: 40, color: '#9b59b6',
        health: 300, maxHealth: 300, scoreValue: 500,
        
        onDeath: (enemies: Enemy[], spawner: any) => {
            const minionCount = Math.floor(Math.random() * 3) + 5; // 8-10 minions, but not currently working
            for (let i = 0; i < minionCount; i++) {
                const offsetX = (Math.random() - 0.5) * 10;
                const offsetY = (Math.random() - 0.5) * 10;
                spawner.spawnBossMinion(enemies, x + offsetX, y + offsetY);
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
        
        // Signature "Mother" glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#8e44ad';
        ctx.fill();
        
        ctx.strokeStyle = '#4b0082';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
    }
};