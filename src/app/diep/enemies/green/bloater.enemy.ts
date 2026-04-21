import { Enemy, Player } from '../../diep.interfaces';
import { PuddleEnemy } from './puddle.enemy'; // Import the new file

export class BloaterEnemy {

    public static metadata = {
        name: 'Bloater',
        faction: 'Green',
        description: 'A volatile bio-hazard unit that emits a toxic aura and bursts into corrosive puddles upon death.'
    };

    public static create(x: number, y: number): Partial<Enemy> {
        const randomBodySize = Math.floor(Math.random() * (50 - 25 + 1)) + 25;
        const toxicRange = Math.floor(Math.random() * (50 - 25 + 1)) + 75;

        return {
            x, y, 
            radius: randomBodySize,
            color: '#00E673',
            health: (randomBodySize * 4),
            maxHealth: (randomBodySize * 2),
            scoreValue: (randomBodySize * 2),
            isBoss: false,
            type: 'BLOATER',

            onSpawn: (enemy: any, canvasWidth: number, canvasHeight: number) => {
                enemy.targetX = Math.random() * canvasWidth;
                enemy.targetY = Math.random() * canvasHeight;
            },

            onUpdate: (enemy: any, player: Player, deltaTime: number) => {
                const toxicDamage = 0.5;
                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < enemy.radius + toxicRange) {
                    player.health -= toxicDamage * (deltaTime / 16.66);
                }
            },

            onDeath: (enemies: Enemy[], spawner: any, deadEnemy: Enemy) => {
                const puddleCount = Math.floor(Math.random() * 4) + 5;
                for (let i = 0; i < puddleCount; i++) {
                    const offsetX = (Math.random() - 0.5) * 160;
                    const offsetY = (Math.random() - 0.5) * 160;
                    const size = Math.floor(Math.random() * (deadEnemy.radius * 0.8 - 10 + 1)) + 10;
                    const duration = 5000 + (Math.random() * 3000);

                    // Call the formal Puddle creation
                    const puddle = PuddleEnemy.create(
                        deadEnemy.x + offsetX, 
                        deadEnemy.y + offsetY, 
                        size, 
                        duration
                    ) as Enemy;
                    
                    enemies.push(puddle);
                }
            }
        };
    }

    public static update(
        enemy: Enemy, 
        player: Player, 
        deltaTime: number, 
        currentTime: number, 
        moveTowards: Function
    ): void {
        if (enemy.targetX !== undefined && enemy.targetY !== undefined) {
            moveTowards(enemy, deltaTime, enemy.targetX, enemy.targetY, 0.5);
        }
    }

    public static draw(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
        const pulse = Math.sin(Date.now() / 600) * 8;
        ctx.save();
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius + 80 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#33cc331a'; 
        ctx.fill();
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }
}