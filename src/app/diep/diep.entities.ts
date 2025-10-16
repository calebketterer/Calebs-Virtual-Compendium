// NOTE: These types must be imported from the same location they are imported 
// in diep.component.ts (which was './diep.interfaces').
import { Player, Bullet, Enemy, EnemyType } from './diep.interfaces';

// Interface to wrap the minimal required state for drawing
interface EntityDrawState {
    ctx: CanvasRenderingContext2D;
    player: Player;
    enemiesToDraw: Enemy[];
}

/**
 * Utility class containing all methods responsible for drawing 
 * primary game entities (Player, Bullets, Enemies) onto the canvas.
 */
export class DiepEntities {

    /**
     * Draws the player tank (body and barrel).
     * @param ctx The canvas rendering context.
     * @param player The current player object.
     * @param gameOver Whether the game is over (to stop drawing the player).
     */
    public static drawPlayer(ctx: CanvasRenderingContext2D, player: Player, gameOver: boolean): void {
        if (!gameOver) {
            ctx.save();
            ctx.translate(player.x, player.y);
            ctx.rotate(player.angle);

            // Draw Barrel (Cannon) 
            ctx.fillStyle = '#2980b9';
            ctx.beginPath();
            const barrelWidth = 14;
            const barrelLength = player.radius * 2.5;
            ctx.rect(-player.radius * 0.5, -barrelWidth / 2, barrelLength, barrelWidth);
            ctx.fill();

            // Draw Tank Body
            ctx.beginPath();
            ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
            ctx.fillStyle = player.color;
            ctx.fill();

            ctx.restore();
        }
    }

    /**
     * Draws all active bullets.
     * @param ctx The canvas rendering context.
     * @param bullets The array of active bullets.
     */
    public static drawBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[]): void {
        bullets.forEach(bullet => {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            ctx.fillStyle = bullet.color;
            ctx.shadowBlur = 5;
            ctx.shadowColor = bullet.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }

    /**
     * Draws a single enemy entity based on its type and properties.
     * Includes complex shapes like Triangles (CRASHER) and Hexagons (SMASHER).
     * @param ctx The canvas rendering context.
     * @param enemy The enemy object to draw.
     * @param player The player object (needed for SNIPER and CRASHER aiming).
     */
    private static drawSingleEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, player: Player): void {
        
        // --- Draw AURA EFFECT ---
        if (enemy.type === 'AURA') {
            const auraRadius = 100;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius + auraRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(51, 204, 51, 0.15)';
            ctx.fill();
        }

        if (enemy.type === 'CRASHER') { // Draw the fast pink enemy as a TRIANGLE
            ctx.save();
            ctx.translate(enemy.x, enemy.y);

            // Calculate angle to point toward the player
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const angle = Math.atan2(dy, dx);
            ctx.rotate(angle + Math.PI / 2); // Rotate to point forward

            ctx.beginPath();
            // Vertices for an equilateral triangle
            ctx.moveTo(0, -enemy.radius);
            ctx.lineTo(-enemy.radius * 0.866, enemy.radius * 0.5);
            ctx.lineTo(enemy.radius * 0.866, enemy.radius * 0.5);
            ctx.closePath();

            ctx.fillStyle = enemy.color;
            ctx.fill();
            ctx.strokeStyle = '#9b59b6'; // Purple stroke
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();

        } else if (enemy.type === 'SMASHER') {
            ctx.save();
            ctx.translate(enemy.x, enemy.y);
            ctx.rotate(enemy.rotationAngle!);

            const hexRadius = enemy.radius;

            // 1. Draw the Black Hexagon (Outer Shape)
            ctx.beginPath();
            ctx.fillStyle = '#000000'; // Black fill
            ctx.strokeStyle = '#2c3e50'; // Dark stroke
            ctx.lineWidth = 2;

            // Draw 6-sided polygon (Hexagon)
            for (let i = 0; i < 6; i++) {
                const angle = i * Math.PI / 3 + Math.PI / 6;
                const x = hexRadius * Math.cos(angle);
                const y = hexRadius * Math.sin(angle);

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 2. Draw the Red Inner Circle
            const innerRadius = hexRadius * 0.9;

            ctx.beginPath();
            ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#e74c3c'; // Red fill
            ctx.fill();

            ctx.restore();

        } else { // Draw as a CIRCLE (Regular, Boss, Minion, Sniper)
            
            // Handle SNIPER barrel drawing before the body circle
            if (enemy.type === 'SNIPER') {   
                ctx.save();
                ctx.translate(enemy.x, enemy.y);
                ctx.rotate(enemy.rotationAngle!); 

                // 2. DRAW BARREL FIRST (to be underneath the body)
                ctx.fillStyle = '#95a5a6'; // Light Gray
                ctx.beginPath();
                
                const barrelWidth = 14; 
                const barrelLength = enemy.radius * 2.0; 
                const barrelStartOffset = enemy.radius * 0.5;
                
                // Draw the barrel horizontally centered at the tank's origin
                ctx.rect(-barrelStartOffset, -barrelWidth / 2, barrelLength, barrelWidth);
                ctx.fill();
                ctx.restore();
                
                // 3. Draw the enemy body circle ON TOP of the barrel (done below)
            }

            // Draw the body circle for all non-custom shapes
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            ctx.fillStyle = enemy.color;
            ctx.fill();
            
            // Apply stroke and shadow logic
            let strokeColor = '#c0392b';
            let lineWidth = 2;
            let shadowBlur = 0;
            
            if (enemy.isBoss) { 
                strokeColor = '#8e44ad';
                lineWidth = 4;
                shadowBlur = 10;
            } else if (enemy.color === '#d2b4de') { // Minions
                strokeColor = '#9b59b6';
                lineWidth = 1.5;
            } else if (enemy.type === 'SNIPER') {
                strokeColor = '#c0392b';
                lineWidth = 2;
            } else if (enemy.type === 'REGULAR') { // Regular (Red)
                strokeColor = '#c0392b';
                lineWidth = 2;
            } else if (enemy.type === 'AURA') {
                strokeColor = '#33cc33'; 
                lineWidth = 2.5; 
            }
            
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
            
            // Boss Shadow Effect
            if (shadowBlur > 0) {
                ctx.shadowBlur = shadowBlur;
                ctx.shadowColor = enemy.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }

    /**
     * Draws all enemies, including their unique shapes and health bars.
     * This is the main entry point for enemy drawing.
     * @param ctx The canvas rendering context.
     * @param enemiesToDraw The current array of enemies to render.
     * @param player The player object (needed for drawing).
     */
    public static drawEnemiesWithBars(ctx: CanvasRenderingContext2D, enemiesToDraw: Enemy[], player: Player): void {
        enemiesToDraw.forEach(enemy => {
            // 1. Draw the enemy shape (Circle, Triangle, Hexagon, etc.)
            DiepEntities.drawSingleEnemy(ctx, enemy, player);

            // 2. Draw Health Bar (Aesthetic Health Bar or Boss Health Bar)
            
            // Draw Aesthetic Health Bar (only for non-bosses/non-full health)
            if (enemy.health < enemy.maxHealth && !enemy.isBoss) { 
                const barWidth = enemy.radius * 2;
                const healthPercent = enemy.health / enemy.maxHealth;
                const healthBarX = enemy.x - enemy.radius;
                const healthBarY = enemy.y - enemy.radius - 15;
                const healthBarHeight = 6;
                
                // Background Bar
                ctx.fillStyle = '#1e1e1e';
                ctx.fillRect(healthBarX, healthBarY, barWidth, healthBarHeight);
                
                // Health Fill
                let healthColor = '#2ecc71'; // Green
                if (healthPercent < 0.5) healthColor = '#f1c40f'; // Yellow
                if (healthPercent < 0.2) healthColor = '#e74c3c'; // Red
                ctx.fillStyle = healthColor;
                
                const fillWidth = barWidth * healthPercent;
                ctx.fillRect(healthBarX, healthBarY, fillWidth, healthBarHeight);
                
                // Border
                ctx.strokeStyle = '#95a5a6';
                ctx.lineWidth = 1;
                ctx.strokeRect(healthBarX, healthBarY, barWidth, healthBarHeight);
            }
            
            // Draw boss health bar (different style)
            if (enemy.isBoss && enemy.health < enemy.maxHealth) {
                const barWidth = 100;
                const healthPercent = enemy.health / enemy.maxHealth;
                const healthBarX = enemy.x - barWidth / 2;
                const healthBarY = enemy.y - enemy.radius - 20;
                const healthBarHeight = 10;
                
                // Background Bar
                ctx.fillStyle = '#34495e';
                ctx.fillRect(healthBarX, healthBarY, barWidth, healthBarHeight);
                
                // Health Fill (Purple Boss color)
                ctx.fillStyle = '#9b59b6';
                const fillWidth = barWidth * healthPercent;
                ctx.fillRect(healthBarX, healthBarY, fillWidth, healthBarHeight);
                
                ctx.font = '10px Inter, sans-serif';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.fillText(`MINI BOSS HP: ${Math.ceil(enemy.health)}`, enemy.x, healthBarY + healthBarHeight + 10);
            }
        });
    }
}
