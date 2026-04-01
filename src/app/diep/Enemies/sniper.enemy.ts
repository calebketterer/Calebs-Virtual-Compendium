import { Enemy, Player, Bullet, OwnerType } from '../diep.interfaces';

export const SniperEnemy = {
    create: (x: number, y: number): Partial<Enemy> => ({
        x, y, radius: 22, color: '#e74c3c',
        health: 80, maxHealth: 80, scoreValue: 100,
        lastShotTime: 0, rotationAngle: 0
    }),

    update: (enemy: Enemy, player: Player, deltaTime: number, currentTime: number, moveTowards: Function, bullets: Bullet[]) => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        enemy.rotationAngle = Math.atan2(dy, dx);

        if (dist > 400) {
            moveTowards(enemy, deltaTime, player.x, player.y, 1.0);
        } else if (dist < 250) {
            const retreatX = enemy.x - Math.cos(enemy.rotationAngle) * 100;
            const retreatY = enemy.y - Math.sin(enemy.rotationAngle) * 100;
            moveTowards(enemy, deltaTime, retreatX, retreatY, 1.0);
        } else {
            if (currentTime - (enemy.lastShotTime || 0) > 3500) {
                bullets.push({
                    x: enemy.x, y: enemy.y,
                    dx: Math.cos(enemy.rotationAngle) * 10,
                    dy: Math.sin(enemy.rotationAngle) * 10,
                    radius: 7.5, color: enemy.color, ownerType: 'ENEMY' as OwnerType
                });
                enemy.lastShotTime = currentTime;
            }
        }
    },

    draw: (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
        const barrelWidth = 18; // Width of the nozzle
        const barrelLength = enemy.radius * 2; // How far it sticks out

        // --- 1. Draw the Barrel FIRST (so it sits behind the body) ---
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotationAngle || 0);

        ctx.fillStyle = '#999999';   // Classic Diep grey
        ctx.strokeStyle = '#727272'; // Darker grey outline
        ctx.lineWidth = 2;

        // Draw the rectangle starting from center (0) forward
        ctx.beginPath();
        // (x, y, width, height) 
        // 0 is the center of the tank
        ctx.rect(0, -barrelWidth / 2, barrelLength, barrelWidth);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // --- 2. Draw the Body SECOND ---
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();

        // Body Outline
        ctx.strokeStyle = '#c0392b'; // Darker outline for the body
        ctx.lineWidth = 2.5;
        ctx.stroke();
    }
};