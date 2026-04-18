import { Enemy, Player, Bullet, OwnerType } from '../../diep.interfaces';

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

        // --- READABILITY VARIABLES (LOOPS & TUNING) ---
        const bulletSpeed = 5;      // Slower, heavy projectiles
        const bulletSize = 12.5;    // Larger impact zone
        const fireRate = 750;       // Timing between shots in ms
        const stopDistance = 200;   // Distance to stop chasing
        const retreatDistance = 100; // Distance to start backing away

        if (dist > stopDistance) {
            moveTowards(enemy, deltaTime, player.x, player.y, 2.0);
        } else if (dist < retreatDistance) {
            const retreatX = enemy.x - Math.cos(enemy.rotationAngle) * 100;
            const retreatY = enemy.y - Math.sin(enemy.rotationAngle) * 100;
            moveTowards(enemy, deltaTime, retreatX, retreatY, 2.0);
        } else {
            // Shooting Logic
            if (currentTime - (enemy.lastShotTime || 0) > fireRate) {
                bullets.push({
                    x: enemy.x, 
                    y: enemy.y,
                    dx: Math.cos(enemy.rotationAngle) * bulletSpeed,
                    dy: Math.sin(enemy.rotationAngle) * bulletSpeed,
                    radius: bulletSize, 
                    color: enemy.color, 
                    ownerType: 'ENEMY' as OwnerType,
                    hasTrail: true
                });
                enemy.lastShotTime = currentTime;
            }
        }
    },

    draw: (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
        const barrelWidth = 25;
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