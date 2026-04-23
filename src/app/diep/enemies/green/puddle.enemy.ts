import { Enemy, Player } from '../../core/diep.interfaces';

export const PuddleEnemy = {
    create: (x: number, y: number, radius: number, lifespan: number): Partial<Enemy> => {
        return {
            x, y,
            radius: radius,
            color: '#33cc3333',
            health: 1,
            maxHealth: 1,
            scoreValue: 0,
            isBoss: false,
            type: 'PUDDLE',
            isPassive: true, 
            isGhost: true, 
            spawnTime: Date.now(),
            lifespan: lifespan,
            
            onUpdate: (p: any, player: Player, deltaTime: number) => {
                const pDx = p.x - player.x;
                const pDy = p.y - player.y;
                const pDist = Math.sqrt(pDx * pDx + pDy * pDy);

                // Damage logic
                if (pDist < p.radius) {
                    player.health -= 0.35 * (deltaTime / 16.66);
                }

                // Self-cleanup
                if (Date.now() - p.spawnTime > p.lifespan) {
                    p.health = 0;
                }
            }
        };
    },

    // Puddles don't move
    update: () => {},

    draw: (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
        const pulse = Math.sin(Date.now() / 400) * 3;
        ctx.save();
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius + pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#2ecc7133'; 
        ctx.fill();
        ctx.restore();
    }
};