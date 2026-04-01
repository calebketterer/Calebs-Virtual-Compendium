import { Enemy, Player, SmasherState } from '../diep.interfaces';

export const SmasherEnemy = {
    create: (x: number, y: number): Partial<Enemy> => ({
        x, y, radius: 25, color: '#000000',
        health: 250, maxHealth: 250, scoreValue: 300,
        smasherState: 'APPROACH' as SmasherState,
        rotationAngle: Math.random() * 2 * Math.PI,
        smasherOrbitDirection: Math.random() < 0.5 ? 1 : -1
    }),

    update: (enemy: Enemy, player: Player, deltaTime: number, currentTime: number, moveTowards: Function) => {
        const rotationSpeed = 0.026;
        const attackSpeed = 4;
        const flankSpeed = 2;
        const attackRange = 150;
        
        enemy.rotationAngle = (enemy.rotationAngle || 0) + rotationSpeed;
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (enemy.smasherState === 'ATTACK') {
            moveTowards(enemy, deltaTime, player.x, player.y, attackSpeed);
            if (dist > 600) enemy.smasherState = 'APPROACH' as SmasherState;
        } else {
            const orbitDir = enemy.smasherOrbitDirection || 1;
            const targetX = player.x + Math.cos(currentTime / 1000) * 400 * orbitDir;
            const targetY = player.y + Math.sin(currentTime / 1000) * 400;
            moveTowards(enemy, deltaTime, targetX, targetY, flankSpeed);
            if (dist < attackRange) enemy.smasherState = 'ATTACK' as SmasherState;
        }
    },

    draw: (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotationAngle || 0);

        // Hexagonal Outer Body
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3 + Math.PI / 6;
            ctx.lineTo(enemy.radius * Math.cos(angle), enemy.radius * Math.sin(angle));
        }
        ctx.closePath();
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner Red Core (The "Eye")
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#e74c3c';
        ctx.fill();
        ctx.restore();
    }
};