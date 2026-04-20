import { Enemy, Player } from '../../diep.interfaces';

export class EchoEnemy {

    public static metadata = {
        name: 'Echo',
        faction: 'Blue',
        description: 'A weak, nearly invisible minion summoned by Casters. They become visible and aggressive when in close proximity to the player.'
    };

    public static create(x: number, y: number): Partial<Enemy> {
        return {
            x, y,
            radius: 10,
            health: 15,
            maxHealth: 15,
            scoreValue: 10,
            type: 'ECHO',
            isGhost: true,
            opacity: 0.02,
            vx: 0, vy: 0,
            lifespan: 8000, 
            age: 0,
            swayTimer: Math.random() * 100
        } as any;
    }

    public static update(enemy: any, player: Player, deltaTime: number): void {
        const tick = deltaTime / 16.66;
        enemy.age += deltaTime;
        enemy.swayTimer += deltaTime * 0.004;

        if (enemy.age > enemy.lifespan) {
            enemy.health = 0;
            return;
        }

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetOpacity = 0.02;
        if (dist <= 250) {
            const insideRatio = 1 - (dist / 250);
            targetOpacity = 0.1 + (0.8 * (insideRatio * insideRatio)); 
            enemy.isGhost = false;
        } else {
            enemy.isGhost = true;
        }
        enemy.opacity += (targetOpacity - enemy.opacity) * 0.1 * tick;

        const angle = Math.atan2(dy, dx);
        const perpAngle = angle + Math.PI / 2;
        const sway = Math.sin(enemy.swayTimer) * 1.5;
        const speed = 2.2; 

        enemy.vx = Math.cos(angle) * speed + Math.cos(perpAngle) * sway;
        enemy.vy = Math.sin(angle) * speed + Math.sin(perpAngle) * sway;

        enemy.x += enemy.vx * tick;
        enemy.y += enemy.vy * tick;
    }

    public static draw(ctx: CanvasRenderingContext2D, enemy: any): void {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(Math.atan2(enemy.vy, enemy.vx) + Math.PI / 2);
        ctx.globalAlpha = enemy.opacity;
        
        ctx.beginPath();
        ctx.moveTo(0, -enemy.radius);
        ctx.lineTo(-enemy.radius * 0.7, enemy.radius);
        ctx.lineTo(enemy.radius * 0.7, enemy.radius);
        ctx.closePath();
        
        ctx.fillStyle = '#b3e5fc';
        ctx.fill();
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }
}