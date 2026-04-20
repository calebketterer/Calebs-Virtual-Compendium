import { Enemy, Player, Bullet } from '../../diep.interfaces';

export class CasterEnemy {

    public static metadata = {
        name: 'Caster',
        faction: 'Blue',
        description: 'An elusive phantom that utilizes lightning-fast teleports and summoning rituals. Hard to hit unless it is actively pulsing.'
    };

    public static create(x: number, y: number): Partial<Enemy> {
        return {
            x, y,
            radius: 22,
            health: 100,
            maxHealth: 100,
            scoreValue: 200,
            type: 'CASTER',
            isGhost: true, 
            opacity: 1,
            angle: 0, 
            state: 'WANDERING',
            stateTimer: 0,
            teleportCount: 0,
            reflexCooldown: 0,
            pulseTimer: 0,
            pulseInterval: 7000, 
            targetX: x, targetY: y,
            vx: 0, vy: 0,
            maxSpeed: 1.2,
            teleX: 0, teleY: 0,
            teleStartX: 0, teleStartY: 0,
            teleProgress: 0
        } as any;
    }

    public static update(
        enemy: any, 
        player: Player, 
        deltaTime: number, 
        currentTime: number, 
        moveTowards: any, 
        bullets: Bullet[]
    ): void {
        const tick = deltaTime / 16.66;
        enemy.stateTimer += deltaTime;
        enemy.pulseTimer += deltaTime;
        if (enemy.reflexCooldown > 0) enemy.reflexCooldown -= deltaTime;

        const minX = 40, maxX = 760;
        const minY = 40, maxY = 560;

        const distToPlayer = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
        
        // --- STATE: TELEPORTING (The lightning streak) ---
        if (enemy.state === 'TELEPORTING') {
            enemy.teleProgress += 0.08 * tick; // Speed of the zap
            enemy.isGhost = true; // Invulnerable during zap
            enemy.opacity = 0.8;

            // Linear interpolation for movement
            enemy.x = enemy.teleStartX + (enemy.teleX - enemy.teleStartX) * enemy.teleProgress;
            enemy.y = enemy.teleStartY + (enemy.teleY - enemy.teleStartY) * enemy.teleProgress;

            if (enemy.teleProgress >= 1) {
                enemy.state = 'WANDERING';
                enemy.teleProgress = 0;
                enemy.reflexCooldown = 800; // Reduced cooldown
                enemy.vx = 0; enemy.vy = 0;
            }
            return; // Skip other logic while zapping
        }

        const isSummoning = enemy.state === 'PULSING';
        const isNearPlayer = distToPlayer < 100;
        enemy.isGhost = !(isSummoning || isNearPlayer);

        // Rotation Logic
        if (Math.abs(enemy.vx) > 0.05 || Math.abs(enemy.vy) > 0.05) {
            const targetAngle = Math.atan2(enemy.vy, enemy.vx);
            let diff = targetAngle - enemy.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            enemy.angle += diff * 0.1 * tick;
        }

        // Teleport Reflex Trigger
        if (!isSummoning && enemy.reflexCooldown <= 0 && enemy.teleportCount < 3) {
            const playerLookAngle = (player as any).angle || 0;
            const angleToEnemy = Math.atan2(enemy.y - player.y, enemy.x - player.x);
            let aimDiff = Math.abs(playerLookAngle - angleToEnemy);
            if (aimDiff > Math.PI) aimDiff = Math.abs(aimDiff - Math.PI * 2);

            if (aimDiff < 0.25) {
                enemy.state = 'TELEPORTING';
                enemy.teleStartX = enemy.x;
                enemy.teleStartY = enemy.y;
                enemy.teleProgress = 0;

                let escapeAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                escapeAngle += (Math.PI / 3) * (Math.random() > 0.5 ? 1 : -1);

                const dist = 280;
                enemy.teleX = Math.max(minX, Math.min(maxX, enemy.x + Math.cos(escapeAngle) * dist));
                enemy.teleY = Math.max(minY, Math.min(maxY, enemy.y + Math.sin(escapeAngle) * dist));
                
                enemy.teleportCount++;
            }
        }

        // Normal Wandering/Summoning Logic
        if (enemy.state === 'WANDERING') {
            if (distToPlayer < 150) {
                const escapeAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                enemy.vx += Math.cos(escapeAngle) * 0.05;
                enemy.vy += Math.sin(escapeAngle) * 0.05;
            } else {
                const distToTarget = Math.sqrt((enemy.x - enemy.targetX)**2 + (enemy.y - enemy.targetY)**2);
                if (distToTarget < 50) {
                    enemy.targetX = minX + Math.random() * (maxX - minX);
                    enemy.targetY = minY + Math.random() * (maxY - minY);
                }
                const angle = Math.atan2(enemy.targetY - enemy.y, enemy.targetX - enemy.x);
                enemy.vx += Math.cos(angle) * 0.03;
                enemy.vy += Math.sin(angle) * 0.03;
            }

            const speed = Math.sqrt(enemy.vx**2 + enemy.vy**2);
            if (speed > enemy.maxSpeed) {
                enemy.vx *= (enemy.maxSpeed / speed);
                enemy.vy *= (enemy.maxSpeed / speed);
            }

            enemy.x += enemy.vx * tick;
            enemy.y += enemy.vy * tick;
            enemy.opacity += ((isNearPlayer ? 0.6 : 0.1) - enemy.opacity) * 0.05 * tick;

            if (enemy.pulseTimer > enemy.pulseInterval) {
                enemy.state = 'PULSING';
                enemy.stateTimer = 0;
            }
        } else if (isSummoning) {
            enemy.opacity = 0.3 + Math.sin((enemy.stateTimer / 1500) * Math.PI) * 0.5;
            enemy.vx *= 0.92; enemy.vy *= 0.92;
            if (enemy.stateTimer > 750 && !enemy.hasSummoned) {
                enemy.needsSpawn = true; enemy.hasSummoned = true;
            }
            if (enemy.stateTimer > 1500) {
                enemy.state = 'WANDERING'; enemy.pulseTimer = 0;
                enemy.hasSummoned = false; enemy.teleportCount = 0; 
            }
        }
    }

    public static draw(ctx: CanvasRenderingContext2D, enemy: any): void {
        ctx.save();

        if (enemy.state === 'TELEPORTING') {
            // Draw Lightning Zap
            ctx.strokeStyle = '#81d4fa';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffff';
            ctx.beginPath();
            ctx.moveTo(enemy.teleStartX, enemy.teleStartY);
            
            // Generate jagged midpoints for lightning effect
            const segments = 4;
            for (let i = 1; i <= segments; i++) {
                const px = enemy.teleStartX + (enemy.x - enemy.teleStartX) * (i / segments);
                const py = enemy.teleStartY + (enemy.y - enemy.teleStartY) * (i / segments);
                const offset = (Math.random() - 0.5) * 20;
                ctx.lineTo(px + offset, py + offset);
            }
            ctx.stroke();

            // Draw "poof" at start and end
            ctx.globalAlpha = 1 - enemy.teleProgress;
            ctx.beginPath();
            ctx.arc(enemy.teleStartX, enemy.teleStartY, enemy.radius * (1 + enemy.teleProgress), 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw actual body
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle + Math.PI / 2); 
        ctx.globalAlpha = Math.max(0.1, enemy.opacity || 0.1);
        ctx.shadowBlur = enemy.isGhost ? 5 : 15;
        ctx.shadowColor = '#b3e5fc';

        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
            ctx.lineTo(enemy.radius * Math.cos(angle), enemy.radius * Math.sin(angle));
        }
        ctx.closePath();
        ctx.fillStyle = '#00B2E1'; 
        ctx.fill();
        ctx.strokeStyle = enemy.isGhost ? '#006c8a' : '#27627e3f'; 
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }
}