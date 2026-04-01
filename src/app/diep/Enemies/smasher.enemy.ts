import { Enemy, Player, SmasherState } from '../diep.interfaces';

export const SmasherEnemy = {
    update: (enemy: Enemy, player: Player, deltaTime: number, currentTime: number, moveTowards: Function) => {
        const flankSpeed = 2;
        const attackSpeed = 4;
        const attackRange = 150; 
        const flankCircleRadius = 400; 
        const rotationSpeed = 0.026; 

        // 1. Rotation 
        enemy.rotationAngle = (enemy.rotationAngle || 0) + rotationSpeed;

        // 2. Logic for Dodge/Attack State Machine
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Simple State Logic based on your Logic File
        if (enemy.smasherState === 'ATTACK') {
            moveTowards(enemy, deltaTime, player.x, player.y, attackSpeed);
            if (dist > 600) enemy.smasherState = 'APPROACH' as SmasherState;
        } else {
            const orbitDir = enemy.smasherOrbitDirection || 1;
            const targetX = player.x + Math.cos(currentTime / 1000) * flankCircleRadius * orbitDir;
            const targetY = player.y + Math.sin(currentTime / 1000) * flankCircleRadius;
            moveTowards(enemy, deltaTime, targetX, targetY, flankSpeed);
            
            if (dist < attackRange) enemy.smasherState = 'ATTACK' as SmasherState;
        }
    },

    draw: (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotationAngle || 0);

        // Hexagonal Body
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

        // Inner core
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#e74c3c';
        ctx.fill();
        ctx.restore();
    }
};