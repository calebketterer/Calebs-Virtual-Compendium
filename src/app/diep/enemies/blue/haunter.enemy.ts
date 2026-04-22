import { Enemy, Player } from '../../diep.interfaces';

export class HaunterEnemy {

    public static metadata = {
        name: 'Haunter',
        faction: 'Blue',
        description: 'A stalking entity that blinks through the ethereal plane. It reacts to player aim by vanishing and reappearing at a new position.'
    };

    public static create(x: number, y: number): Partial<Enemy> {
        return {
            x, y,
            radius: 20,
            color: '#00B2E1',
            health: 100,
            maxHealth: 100,
            scoreValue: 100,
            type: 'HAUNTER',
            isGhost: true,
            opacity: 0,
            state: 'MOVING',
            stateTimer: 0,
            swayTimer: Math.random() * 100,
            blinkCooldown: 3000,
            reflexCooldown: 0
        } as any;
    }

    public static update(
        enemy: any, 
        player: Player, 
        deltaTime: number, 
        currentTime: number, 
        moveTowards: any
    ): void {
        const tick = deltaTime / 16.66;
        enemy.stateTimer += deltaTime;
        if (enemy.reflexCooldown > 0) enemy.reflexCooldown -= deltaTime;

        const distToPlayer = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
        const isCloseEnough = distToPlayer <= 200;

        // Opacity Logic
        let targetOpacity = 0.02;
        if (isCloseEnough) {
            const insideRatio = 1 - (distToPlayer / 200);
            targetOpacity = 0.1 + (0.8 * insideRatio);
        } else {
            const proximityRatio = 1 - Math.min(1, Math.max(0, (distToPlayer - 200) / 600));
            targetOpacity = Math.max(0.02, 0.1 * proximityRatio);
        }

        // Reaction Logic
        if (isCloseEnough && enemy.state === 'MOVING' && enemy.reflexCooldown <= 0) {
            const angleToEnemy = Math.atan2(enemy.y - player.y, enemy.x - player.x);
            const playerAngle = (player as any).angle || 0;
            let diff = Math.abs(playerAngle - angleToEnemy);
            if (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

            if (diff < 0.22) {
                enemy.state = 'FADING_OUT';
                enemy.stateTimer = 0;
                enemy.reflexCooldown = 3000;
            }
        }

        // State Machine
        if (enemy.state === 'MOVING') {
            enemy.swayTimer += deltaTime * 0.005;
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            const perpAngle = angle + Math.PI / 2;
            const sway = Math.sin(enemy.swayTimer) * 2;

            enemy.x += Math.cos(angle) * 2.5 * tick + Math.cos(perpAngle) * sway;
            enemy.y += Math.sin(angle) * 2.5 * tick + Math.sin(perpAngle) * sway;
            enemy.opacity = targetOpacity;
            enemy.isGhost = distToPlayer > 200;

            if (isCloseEnough && enemy.stateTimer > enemy.blinkCooldown) {
                enemy.state = 'FADING_OUT';
                enemy.stateTimer = 0;
            }
        } else if (enemy.state === 'FADING_OUT') {
            enemy.opacity -= 0.08 * tick;
            if (enemy.opacity <= 0) {
                const tAngle = Math.random() * Math.PI * 2;
                enemy.x = player.x + Math.cos(tAngle) * 300;
                enemy.y = player.y + Math.sin(tAngle) * 300;
                enemy.state = 'FADING_IN';
            }
        } else if (enemy.state === 'FADING_IN') {
            enemy.opacity += 0.08 * tick;
            if (enemy.opacity >= targetOpacity) {
                enemy.opacity = targetOpacity;
                enemy.state = 'MOVING';
                enemy.stateTimer = 0;
            }
        }
    }

    public static draw(ctx: CanvasRenderingContext2D, enemy: any): void {
        ctx.save();
        ctx.globalAlpha = enemy.opacity ?? 0.02;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#62ffff9c';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00B2E1';
        ctx.fill();
        ctx.strokeStyle = enemy.isGhost ? '#006c8a' : 'rgba(120, 184, 204, 0.5)'
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}