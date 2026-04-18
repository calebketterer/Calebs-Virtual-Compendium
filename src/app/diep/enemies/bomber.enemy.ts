import { Enemy, Player, Bullet, OwnerType } from '../diep.interfaces';

export const BomberEnemy = {
    create: (x: number, y: number): Partial<Enemy> => ({
        x, y, radius: 25, color: '#e67e22',
        health: 120, maxHealth: 120, scoreValue: 150,
        rotationAngle: 0,
        type: 'BOMBER',
        targetX: x, 
        targetY: y,
        lastShotTime: 0, 
        spawnTime: 0 
    }),

    update: (enemy: Enemy, player: Player, deltaTime: number, currentTime: number, moveTowards: Function, bullets: Bullet[]) => {
        // PAUSE CHECK: Do not process logic if the game is paused.
        if (deltaTime <= 0) return;

        if (enemy.lastShotTime === 0) {
            enemy.lastShotTime = currentTime;
        }

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distToPlayer = Math.sqrt(dx * dx + dy * dy);
        enemy.rotationAngle = Math.atan2(dy, dx);

        // --- MOVEMENT ---
        const distToTarget = Math.sqrt(Math.pow((enemy.targetX || 0) - enemy.x, 2) + Math.pow((enemy.targetY || 0) - enemy.y, 2));
        if (distToTarget < 30 || (distToPlayer < 200 && currentTime - (enemy.spawnTime || 0) > 1000) || currentTime - (enemy.spawnTime || 0) > 8000) {
            let tx = enemy.x, ty = enemy.y;
            if (distToPlayer < 200) {
                const angleAway = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                tx = enemy.x + Math.cos(angleAway) * 500;
                ty = enemy.y + Math.sin(angleAway) * 500;
            } else {
                tx = Math.random() * 700 + 50; 
                ty = Math.random() * 500 + 50;
            }
            enemy.targetX = Math.max(40, Math.min(760, tx));
            enemy.targetY = Math.max(40, Math.min(560, ty));
            enemy.spawnTime = currentTime;
        }
        moveTowards(enemy, deltaTime, enemy.targetX, enemy.targetY, 0.8);

        // --- SHOOTING ---
        if (currentTime - (enemy.lastShotTime || 0) > 3500) {
            bullets.push({
                x: enemy.x, y: enemy.y,
                dx: Math.cos(enemy.rotationAngle) * (distToPlayer * 0.026), 
                dy: Math.sin(enemy.rotationAngle) * (distToPlayer * 0.026),
                radius: 20, color: '#d35400',
                ownerType: 'ENEMY' as OwnerType,
                isBomb: true,
                timer: 4000, maxTimer: 4000
            });
            enemy.lastShotTime = currentTime;
        }

        // --- IMPACT & SPLIT DAMAGE (5 Contact + 35 Blast) ---
        bullets.forEach(b => {
            if (b.isBomb && b.timer !== undefined && !b.isExploding) {
                const dP = Math.sqrt(Math.pow(player.x - b.x, 2) + Math.pow(player.y - b.y, 2));
                const hitWall = b.x < 15 || b.x > 785 || b.y < 15 || b.y > 585;

                // TRIGGER EXPLOSION
                if (dP < b.radius + player.radius || hitWall || b.timer <= 1000) {
                    // 1. Contact Damage
                    if (dP < b.radius + player.radius) {
                        player.health -= 5;
                    }

                    // 2. Blast Damage
                    if (dP < 135 + player.radius) {
                        player.health -= 35;
                    }
                    
                    b.isExploding = true;
                    b.timer = 1000; 
                    b.dx = 0; 
                    b.dy = 0;
                }
            }
        });
    },

    draw: (ctx: CanvasRenderingContext2D, enemy: Enemy, player: Player, bullets: Bullet[]) => {
        if (bullets) {
            bullets.forEach(b => {
                if (b.isBomb && b.timer !== undefined) {
                    if (b.isExploding) {
                        const opacity = b.timer / 1000;
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(b.x, b.y, 135, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(230, 126, 34, ${opacity * 0.5})`;
                        ctx.fill();
                        ctx.strokeStyle = `rgba(211, 84, 0, ${opacity})`;
                        ctx.lineWidth = 4;
                        ctx.stroke();
                        ctx.restore();
                    } else {
                        // Restore Speed-based Warning Ring
                        const velocity = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
                        const speedFactor = 1 - Math.min(1, velocity / 1.5); 
                        
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(b.x, b.y, 135, 0, Math.PI * 2);
                        ctx.strokeStyle = `rgba(211, 84, 0, ${speedFactor * 0.3})`;
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        ctx.restore();

                        ctx.beginPath();
                        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                        ctx.fillStyle = b.color;
                        ctx.fill();
                        ctx.strokeStyle = '#a84300';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                }
            });
        }

        // Tank Body
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotationAngle || 0);
        ctx.fillStyle = '#95a5a6';
        ctx.strokeStyle = '#7f8c8d';
        ctx.lineWidth = 2.5;
        ctx.fillRect(0, -18, 45, 36); 
        ctx.strokeRect(0, -18, 45, 36);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();
        ctx.strokeStyle = '#a84300';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
};