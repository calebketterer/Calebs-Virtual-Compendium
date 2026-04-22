import { Enemy, Player } from '../../diep.interfaces';

export class MotherEnemy {
    public static metadata = {
        name: 'Mother',
        faction: 'Purple',
        description: 'A heavy unit that regenerates health over time and spawns a swarm of Minions upon destruction.'
    };

    public static create(x: number, y: number): Partial<Enemy> {
        return {
            id: Math.random().toString(36).substr(2, 9),
            type: 'MOTHER',
            x, y, 
            radius: 40, 
            color: '#BE7FF5',
            health: 300, 
            maxHealth: 300, 
            scoreValue: 500,
            onUpdate: (enemy: Enemy, player: Player, deltaTime: number) => {
                const moveTowards = (enemy as any).moveTowards;
                MotherEnemy.update(enemy, player, deltaTime, Date.now(), moveTowards);
            },
            onDraw: (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
                MotherEnemy.draw(ctx, enemy);
            },
            onDeath: (enemies: Enemy[], spawner: any, deadEnemy: Enemy) => {
                const minionCount = Math.floor(Math.random() * 4) + 3;
                for (let i = 0; i < minionCount; i++) {
                    const spawnX = deadEnemy.x + (Math.random() - 0.5) * 20;
                    const spawnY = deadEnemy.y + (Math.random() - 0.5) * 20;
                    spawner.spawnBossMinion(enemies, spawnX, spawnY);
                }
            }
        };
    }

    public static update(enemy: Enemy, player: Player, deltaTime: number, currentTime: number, moveTowards: Function): void {
        // Passive regeneration
        enemy.health = Math.min(enemy.maxHealth, enemy.health + (2 * deltaTime / 1000));
        if (moveTowards) {
            moveTowards(enemy, deltaTime, player.x, player.y, 0.6);
        }
    }

    public static draw(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
        ctx.save();
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        
        // Mother's glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#be7ff5';
        ctx.fill();
        
        ctx.strokeStyle = '#4b0082';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
    }
}