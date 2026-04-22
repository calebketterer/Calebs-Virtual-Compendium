import { Enemy, Player, Bullet, OwnerType } from '../../core/diep.interfaces';

export class SniperEnemy {
    public static metadata = {
        name: 'Sniper',
        faction: 'Red',
        description: 'A long-range specialist that maintains distance and fires high-velocity rounds.'
    };

    public static create(x: number, y: number): Partial<Enemy> {
        return {
            id: Math.random().toString(36).substr(2, 9),
            type: 'SNIPER',
            x,
            y,
            radius: 22,
            color: '#e74c3c',
            health: 100,
            maxHealth: 100,
            scoreValue: 100,
            lastShotTime: 0,
            rotationAngle: 0,
            onUpdate: (enemy: Enemy, player: Player, deltaTime: number) => {
                const moveTowards = (enemy as any).moveTowards;
                // Mechanical necessity: ensure we are using the live array from the engine
                const bullets = (enemy as any).bulletsArray; 
                if (Array.isArray(bullets)) {
                    SniperEnemy.update(enemy, player, deltaTime, Date.now(), moveTowards, bullets);
                }
            },
            onDraw: (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
                SniperEnemy.draw(ctx, enemy);
            }
        };
    }

    public static update(
        enemy: Enemy, 
        player: Player, 
        deltaTime: number, 
        currentTime: number, 
        moveTowards: Function, 
        bullets: Bullet[]
    ): void {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        enemy.rotationAngle = Math.atan2(dy, dx);

        // --- Original Stop-and-Shoot Logic ---
        if (dist > 400) {
            // Too far: Move closer
            if (moveTowards) moveTowards(enemy, deltaTime, player.x, player.y, 1.0);
        } else if (dist < 250) {
            // Too close: Retreat
            const retreatX = enemy.x - Math.cos(enemy.rotationAngle) * 100;
            const retreatY = enemy.y - Math.sin(enemy.rotationAngle) * 100;
            if (moveTowards) moveTowards(enemy, deltaTime, retreatX, retreatY, 1.0);
        } else {
            // Perfect range: Stop movement and fire
            if (currentTime - (enemy.lastShotTime || 0) > 3500) {
                bullets.push({
                    x: enemy.x,
                    y: enemy.y,
                    dx: Math.cos(enemy.rotationAngle || 0) * 10,
                    dy: Math.sin(enemy.rotationAngle || 0) * 10,
                    radius: 7.5,
                    color: enemy.color,
                    ownerType: 'ENEMY' as OwnerType
                });
                enemy.lastShotTime = currentTime;
            }
        }
    }

    public static draw(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
        const barrelWidth = 18; 
        const barrelLength = enemy.radius * 2; 

        // Draw Barrel
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotationAngle || 0);
        ctx.fillStyle = '#999999';   
        ctx.strokeStyle = '#727272'; 
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(0, -barrelWidth / 2, barrelLength, barrelWidth);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Draw Body
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();
        ctx.strokeStyle = '#c0392b'; 
        ctx.lineWidth = 2.5;
        ctx.stroke();
    }
}