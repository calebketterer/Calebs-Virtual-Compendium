import { Enemy, Player } from '../diep.interfaces';

export const HealerEnemy = {
    create: (x: number, y: number): Partial<Enemy> => ({
        x, y, radius: 15, color: '#f1c40f',
        health: 25, maxHealth: 25, scoreValue: 100,
        type: 'HEALER',
        isPassive: true,
        canDespawn: true, 
        // Movement state
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        speedPhase: Math.random() * Math.PI * 2, // For variable speed
        
        onDeath: (enemies: Enemy[], spawner: any, deadEnemy: Enemy, player: Player) => {
            // Healing logic
            player.health = Math.min(player.maxHealth, player.health + 25);
        }
    }),

    update: (enemy: any, player: Player, deltaTime: number) => {
        // 1. Rotate the enemy
        enemy.rotation += enemy.rotationSpeed * (deltaTime / 10);

        // 2. Vary the speed using a sine wave
        enemy.speedPhase += 0.02;
        const speedVar = Math.sin(enemy.speedPhase) * 0.5 + 1; // Fluctuates between 0.5 and 1.5

        // 3. Apply movement
        enemy.x += enemy.vx * speedVar * (deltaTime / 10);
        enemy.y += enemy.vy * speedVar * (deltaTime / 10);

        // 4. Occasional direction shifts
        if (Math.random() < 0.005) {
            enemy.vx = (Math.random() - 0.5) * 2;
            enemy.vy = (Math.random() - 0.5) * 2;
        }
    },

    draw: (ctx: CanvasRenderingContext2D, enemy: any) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotation);

        ctx.fillStyle = enemy.color;
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 3;

        const size = enemy.radius * 2;
        // Draw centered square
        ctx.fillRect(-enemy.radius, -enemy.radius, size, size);
        ctx.strokeRect(-enemy.radius, -enemy.radius, size, size);

        ctx.restore();
    }
};