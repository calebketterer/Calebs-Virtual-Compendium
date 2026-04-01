import { Enemy, Player, Bullet, OwnerType } from '../diep.interfaces';

export const SniperEnemy = {
    update: (enemy: Enemy, player: Player, deltaTime: number, currentTime: number, moveTowards: Function, bullets: Bullet[]) => {
        const sniperBulletSpeed = 10; 
        const firingRange = 400; 
        const sniperEvasionRange = 250; 
        const sniperMoveSpeed = 1.0;
        const sniperFireRate = 3500; 

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        enemy.rotationAngle = angle; 

        if (dist > firingRange) {
            moveTowards(enemy, deltaTime, player.x, player.y, sniperMoveSpeed);
        } else if (dist < sniperEvasionRange) {
            // Retreat logic: move towards point opposite of player
            const retreatX = enemy.x - Math.cos(angle) * 100;
            const retreatY = enemy.y - Math.sin(angle) * 100;
            moveTowards(enemy, deltaTime, retreatX, retreatY, sniperMoveSpeed);
        } else {
            // Firing Logic
            if (currentTime - (enemy.lastShotTime || 0) > sniperFireRate) {
                bullets.push({
                    x: enemy.x, y: enemy.y,
                    dx: Math.cos(angle) * sniperBulletSpeed,
                    dy: Math.sin(angle) * sniperBulletSpeed,
                    radius: 5, color: enemy.color, ownerType: 'ENEMY' as OwnerType
                });
                enemy.lastShotTime = currentTime;
            }
        }
    },

    draw: (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotationAngle || 0); 

        // Draw Barrel
        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        const barrelWidth = 14; 
        const barrelLength = enemy.radius * 2.0; 
        ctx.rect(-enemy.radius * 0.5, -barrelWidth / 2, barrelLength, barrelWidth);
        ctx.fill();
        ctx.restore();

        // Draw Body
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
};