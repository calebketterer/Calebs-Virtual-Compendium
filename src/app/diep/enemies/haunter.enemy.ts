import { Enemy, Player } from '../diep.interfaces';

export const HaunterEnemy = {
    create: (x: number, y: number): Partial<Enemy> => {
        return {
            x, y,
            radius: 18,
            color: '#00ffff44', 
            health: 60,
            maxHealth: 60,
            scoreValue: 600,
            type: 'HAUNTER',
            
            // Internal State
            opacity: 1,
            state: 'MOVING', 
            stateTimer: 0,
            trailTimer: 0,
            blinkCooldown: 3000, 
            reflexCooldown: 0,

            onUpdate: (enemy: any, player: Player, deltaTime: number, enemies: Enemy[], moveTowards: Function) => {
                const tick = deltaTime / 16.66;
                enemy.stateTimer += deltaTime;
                
                if (enemy.reflexCooldown > 0) {
                    enemy.reflexCooldown -= deltaTime;
                }

                // --- Aim Detection Reflex ---
                if (enemy.state === 'MOVING' && enemy.opacity >= 1 && enemy.reflexCooldown <= 0) {
                    const angleToEnemy = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                    const playerAngle = player.angle || 0;
                    let diff = Math.abs(playerAngle - angleToEnemy);
                    if (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

                    if (diff < 0.26) { // ~15 degrees
                        enemy.state = 'FADING_OUT';
                        enemy.stateTimer = 0;
                        enemy.reflexCooldown = 2000; 
                    }
                }

                switch (enemy.state) {
                    case 'MOVING':
                        if (typeof moveTowards === 'function') {
                            moveTowards(enemy, deltaTime, player.x, player.y, 2.8);
                        } else {
                            const dx = player.x - enemy.x;
                            const dy = player.y - enemy.y;
                            const angle = Math.atan2(dy, dx);
                            enemy.x += Math.cos(angle) * 2.8 * tick;
                            enemy.y += Math.sin(angle) * 2.8 * tick;
                        }
                        
                        enemy.trailTimer += deltaTime;
                        if (enemy.trailTimer > 120) {
                            HaunterEnemy.spawnTrail(enemies, enemy.x, enemy.y);
                            enemy.trailTimer = 0;
                        }

                        if (enemy.stateTimer > enemy.blinkCooldown) {
                            enemy.state = 'FADING_OUT';
                            enemy.stateTimer = 0;
                        }
                        break;

                    case 'FADING_OUT':
                        enemy.opacity -= 0.05 * tick;
                        if (enemy.opacity <= 0) {
                            enemy.opacity = 0;
                            const angle = Math.random() * Math.PI * 2;
                            const dist = 250 + Math.random() * 250;
                            enemy.x = player.x + Math.cos(angle) * dist;
                            enemy.y = player.y + Math.sin(angle) * dist;
                            enemy.state = 'FADING_IN';
                            enemy.stateTimer = 0;
                        }
                        break;

                    case 'FADING_IN':
                        enemy.opacity += 0.05 * tick;
                        if (enemy.opacity >= 1) {
                            enemy.opacity = 1;
                            enemy.state = 'MOVING';
                            enemy.stateTimer = 0;
                        }
                        break;
                }
            }
        } as any as Partial<Enemy>;
    },

    spawnTrail: (enemies: Enemy[], x: number, y: number) => {
        if (!enemies) return;
        enemies.push({
            x, y,
            radius: 10,
            color: '#ffffff',
            health: 1,
            maxHealth: 1,
            scoreValue: 0,
            isBoss: false,
            type: 'TRAIL',
            isPassive: true,
            isGhost: true,
            spawnTime: Date.now(),
            lifespan: 1200,
            onUpdate: (p: any, player: Player, deltaTime: number) => {
                const dx = p.x - player.x;
                const dy = p.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < p.radius + 15) {
                    player.health -= 0.3 * (deltaTime / 16.66);
                }
                if (Date.now() - p.spawnTime > p.lifespan) p.health = 0;
            }
        } as any as Enemy);
    },

    update: () => {}, 

    draw: (ctx: CanvasRenderingContext2D, enemy: any) => {
        if (enemy.type === 'TRAIL') {
            const age = Date.now() - (enemy.spawnTime || 0);
            const lifeRatio = 1 - (age / (enemy.lifespan || 1200));
            ctx.save();
            ctx.globalAlpha = Math.max(0, lifeRatio * 0.4);
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.globalAlpha = enemy.opacity ?? 1;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#008888';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffff44'; 
        ctx.fill();
        ctx.strokeStyle = '#006666'; 
        ctx.lineWidth = 3;           
        ctx.stroke();
        ctx.restore();
    }
};