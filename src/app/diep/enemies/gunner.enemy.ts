import { Enemy, Player, Bullet, OwnerType } from '../diep.interfaces';

export const GunnerEnemy = {
    create: (x: number, y: number): Partial<Enemy> => ({
        x, y, radius: 22, color: '#27ae60',
        health: 80, maxHealth: 80, scoreValue: 100,
        lastShotTime: 0, rotationAngle: 0
    }),

    update: (enemy: Enemy, player: Player, deltaTime: number, currentTime: number, moveTowards: Function, bullets: Bullet[]) => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        enemy.rotationAngle = Math.atan2(dy, dx);

        if (dist > 200) {
            moveTowards(enemy, deltaTime, player.x, player.y, 2.0);
        } else if (dist < 100) {
            const retreatX = enemy.x - Math.cos(enemy.rotationAngle) * 100;
            const retreatY = enemy.y - Math.sin(enemy.rotationAngle) * 100;
            moveTowards(enemy, deltaTime, retreatX, retreatY, 2.0);
        } else {
            if (currentTime - (enemy.lastShotTime || 0) > 400) {
                bullets.push({
                    x: enemy.x, 
                    y: enemy.y,
                    dx: Math.cos(enemy.rotationAngle) * 10,
                    dy: Math.sin(enemy.rotationAngle) * 10,
                    radius: 10, 
                    color: enemy.color, 
                    ownerType: 'ENEMY' as OwnerType,
                    hasTrail: true // This enables the toxic sludge dropping
                });
                enemy.lastShotTime = currentTime;
            }
        }
    },

    draw: (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
        const barrelWidth = 20;
        const barrelLength = enemy.radius * 1.5;

        // Draw Nozzle behind body
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotationAngle || 0);
        ctx.fillStyle = '#999999';
        ctx.strokeStyle = '#727272';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.rect(0, -barrelWidth / 2, barrelLength, barrelWidth);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Draw Main Tank Body
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();
        ctx.strokeStyle = '#1e8449'; // Darker green outline
        ctx.lineWidth = 2.5;
        ctx.stroke();
    }
};