import { Enemy, Player } from '../diep.interfaces';

export const HaunterEnemy = {
    create: (x: number, y: number): Partial<Enemy> => {
        return {
            x, y,
            radius: 18,
            color: '#00ffff', 
            health: 60,
            maxHealth: 60,
            scoreValue: 600,
            type: 'HAUNTER',
            isGhost: true,
            
            opacity: 0.02,
            state: 'MOVING', 
            stateTimer: 0,
            swayTimer: Math.random() * 100,
            blinkCooldown: 3000, 
            reflexCooldown: 0,

            onUpdate: (enemy: any, player: Player, deltaTime: number) => {
                const tick = deltaTime / 16.66;
                enemy.stateTimer += deltaTime;
                if (enemy.reflexCooldown > 0) enemy.reflexCooldown -= deltaTime;

                const distToPlayer = Math.sqrt((player.x - enemy.x)**2 + (player.y - enemy.y)**2);
                
                const maxDist = 800;
                const minDist = 200;
                const proximityRatio = 1 - Math.min(1, Math.max(0, (distToPlayer - minDist) / (maxDist - minDist)));
                
                enemy.isGhost = distToPlayer > 200;
                const isCloseEnough = distToPlayer <= 200;

                // Opacity Ramp: 2% far -> 10% at edge of 200px -> 90% at center
                let targetOpacity = 0.02;
                if (isCloseEnough) {
                    const insideRatio = 1 - (distToPlayer / 200); 
                    targetOpacity = 0.1 + (0.8 * insideRatio); 
                } else {
                    targetOpacity = Math.max(0.02, 0.1 * proximityRatio);
                }

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

                const currentSpeed = 0.1 + (2.5 * proximityRatio);

                if (enemy.state === 'MOVING') {
                    enemy.swayTimer += deltaTime * 0.005;
                    const swayPower = 1.5 + (2 * (1 - proximityRatio));
                    const sway = Math.sin(enemy.swayTimer) * swayPower;
                    
                    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                    const perpAngle = angle + Math.PI / 2;

                    enemy.x += Math.cos(angle) * currentSpeed * tick;
                    enemy.y += Math.sin(angle) * currentSpeed * tick;
                    enemy.x += Math.cos(perpAngle) * sway;
                    enemy.y += Math.sin(perpAngle) * sway;

                    enemy.opacity = targetOpacity;

                    if (isCloseEnough && enemy.stateTimer > enemy.blinkCooldown) {
                        enemy.state = 'FADING_OUT';
                        enemy.stateTimer = 0;
                    }
                } else if (enemy.state === 'FADING_OUT') {
                    enemy.opacity -= 0.08 * tick;
                    if (enemy.opacity <= 0) {
                        enemy.opacity = 0;
                        const tAngle = Math.random() * Math.PI * 2;
                        const tDist = 250 + Math.random() * 150;
                        enemy.x = player.x + Math.cos(tAngle) * tDist;
                        enemy.y = player.y + Math.sin(tAngle) * tDist;
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
        } as any as Partial<Enemy>;
    },

    update: () => {}, 

    draw: (ctx: CanvasRenderingContext2D, enemy: any) => {
        ctx.save();
        ctx.globalAlpha = enemy.opacity ?? 0.02;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffff66'; 
        ctx.fill();
        ctx.strokeStyle = enemy.isGhost ? '#006666' : '#555555'; 
        ctx.lineWidth = 3;           
        ctx.stroke();
        ctx.restore();
    }
};