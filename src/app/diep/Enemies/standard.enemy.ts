import { Enemy, Player } from '../diep.interfaces';

export const StandardEnemy = {
    create: (x: number, y: number, type: 'REGULAR' | 'MINION' = 'REGULAR'): Partial<Enemy> => {
        if (type === 'MINION') {
            return {
                x, y, radius: 10, color: '#d2b4de',
                health: 20, maxHealth: 20, scoreValue: 5,
                speedMultiplier: 1.2
            };
        }
        
        const radius = 10 + Math.random() * 20;
        const normalizedRadius = (radius - 10) / 20;
        const health = Math.floor(radius * 4.5 + 10);
        
        return {
            x, y, radius, color: '#e74c3c',
            health: health, maxHealth: health,
            scoreValue: Math.floor(10 + (radius - 18) * 1.5),
            speedMultiplier: 8.0 - normalizedRadius * 2.0
        };
    },

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
        ctx.lineWidth = 2;
        ctx.stroke();
    }
};