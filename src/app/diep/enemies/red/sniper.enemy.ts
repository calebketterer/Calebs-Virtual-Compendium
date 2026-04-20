import { Enemy, Player, Bullet, OwnerType } from '../../diep.interfaces';

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
            health: 80,
            maxHealth: 80,
            scoreValue: 100,
            lastShotTime: 0,
            rotationAngle: 0,
            // Attach hooks so the registry/spawner can trigger them automatically
            onUpdate: (enemy: Enemy, player: Player, deltaTime: number) => {
                // We use Date.now() for currentTime and pass through engine functions
                const moveTowards = (enemy as any).moveTowards;
                const bullets = (enemy as any).bulletsArray || []; 
                SniperEnemy.update(enemy, player, deltaTime, Date.now(), moveTowards, bullets);
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

        if (dist > 400) {
            if (moveTowards) moveTowards(enemy, deltaTime, player.x, player.y, 1.0);
        } else if (dist < 250) {
            const retreatX = enemy.x - Math.cos(enemy.rotationAngle) * 100;
            const retreatY = enemy.y - Math.sin(enemy.rotationAngle) * 100;
            if (moveTowards) moveTowards(enemy, deltaTime, retreatX, retreatY, 1.0);
        } else {
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

        // --- 1. Draw the Barrel FIRST ---
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

        // --- 2. Draw the Body SECOND ---
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();

        ctx.strokeStyle = '#c0392b'; 
        ctx.lineWidth = 2.5;
        ctx.stroke();
    }
}