import { Enemy, Player, Bullet, EnemyType, SmasherState, OwnerType } from './diep.interfaces';


/**
 * Utility class dedicated to updating the state, position, and actions
 * of all enemy types each frame.
 */
export class DiepEnemyLogic {

    // FIXED: The BASE_SPEED_FACTOR (0.06) is established for frame-rate independence.
    private static readonly BASE_SPEED_FACTOR = 0.06; 

    /**
     * Executes the update logic for all enemies in the game.
     * @param enemies The current array of Enemy objects.
     * @param bullets The current array of Bullet objects (needed for SNIPER firing).
     * @param player The Player object (needed for aiming and movement targets).
     * @param deltaTime The time elapsed since the last frame (ms).
     * @param canvasWidth The width of the game area.
     * @param canvasHeight The height of the game area.
     * @param currentTime The current time (ms) used for firing cooldowns.
     */
    public static updateAllEnemies(
        enemies: Enemy[], 
        bullets: Bullet[], 
        player: Player, 
        deltaTime: number,
        canvasWidth: number,
        canvasHeight: number,
        currentTime: number
    ): void {
        
        enemies.forEach(enemy => {
            
            // Calculate distance and vector once
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 1. Type-Specific Behavior (may override or inform movement)
            switch (enemy.type) {
                case 'SNIPER':
                    DiepEnemyLogic.handleSniperBehavior(enemy, bullets, player, deltaTime, currentTime, dx, dy, dist);
                    break;
                case 'SMASHER':
                    DiepEnemyLogic.handleSmasherBehavior(enemy, player, deltaTime, dx, dy, dist, currentTime);
                    break;
                case 'AURA':
                    DiepEnemyLogic.handleAuraBehavior(enemy, deltaTime, canvasWidth, canvasHeight);
                    break;
                case 'BOSS':
                    DiepEnemyLogic.handleBossBehavior(enemy, deltaTime, dx, dy, dist);
                    break;
                case 'MINION':
                case 'CRASHER':
                case 'REGULAR':
                default:
                    // Simple movement for most enemies
                    DiepEnemyLogic.handleMovement(enemy, deltaTime, dx, dy, dist);
                    break;
            }
        });
    }

    /**
     * Moves the entity towards a specific target using the given speed.
     * Speed is scaled by deltaTime to ensure frame-rate independence.
     */
    private static moveTowardsTarget(enemy: Enemy, deltaTime: number, targetX: number, targetY: number, targetSpeed: number): void {
        const moveDx = targetX - enemy.x;
        const moveDy = targetY - enemy.y;
        const moveDist = Math.sqrt(moveDx * moveDx + moveDy * moveDy);

        if (moveDist > 0 && targetSpeed > 0) {
            const finalSpeed = targetSpeed * DiepEnemyLogic.BASE_SPEED_FACTOR * deltaTime;
            enemy.x += (moveDx / moveDist) * finalSpeed;
            enemy.y += (moveDy / moveDist) * finalSpeed;
        }
    }

    /**
     * Handles standard enemy movement (seeking behavior) for non-state-machine enemies.
     */
    private static handleMovement(enemy: Enemy, deltaTime: number, dx: number, dy: number, dist: number): void {
        let finalSpeed = 0.3; // Default for REGULAR 

        switch (enemy.type) {
            case 'MINION':
                finalSpeed = 3.5;
                break;
            case 'CRASHER':
                finalSpeed = 2 * (enemy.speedMultiplier || 1); 
                break;
            case 'REGULAR':
                // Setting it explicitly here to the new slower constant
                finalSpeed = 0.3 * (enemy.speedMultiplier || 1); 
                break;
        }

        // Target is player's current location (enemy.x + dx, enemy.y + dy)
        DiepEnemyLogic.moveTowardsTarget(enemy, deltaTime, enemy.x + dx, enemy.y + dy, finalSpeed);
    }
    
    private static handleBossBehavior(enemy: Enemy, deltaTime: number, dx: number, dy: number, dist: number): void {
        // Boss Regen Logic (1 HP/second)
        enemy.health = Math.min(enemy.maxHealth, enemy.health + (1 * deltaTime / 1000));
        
        // Movement: moveTowardsPlayer(enemy, 0.75);
        DiepEnemyLogic.moveTowardsTarget(enemy, deltaTime, enemy.x + dx, enemy.y + dy, 0.75);
    }

    private static handleSniperBehavior(enemy: Enemy, bullets: Bullet[], player: Player, deltaTime: number, currentTime: number, dx: number, dy: number, dist: number): void {
        const sniperBulletSpeed = 10; 
        const firingRange = 400; 
        const sniperEvasionRange = 250; 
        const sniperMoveSpeed = 1.0;
        const sniperFireRate = 3500; 

        let moveDirection = 0; // 0 = stationary, 1 = towards, -1 = away
        let currentSpeed = sniperMoveSpeed;

        // Calculate angle from enemy to player
        const angle = Math.atan2(dy, dx); 
        
        // FIX: Update the sniper's angle so its barrel visually tracks the player.
        // If the visual aiming is still off, a constant offset (like + Math.PI / 2) 
        // would be needed, which is a common fix required in the rendering code.
        enemy.rotationAngle = angle; 

        if (dist > firingRange) {
            moveDirection = 1; // Approach
        } else if (dist < sniperEvasionRange) {
            moveDirection = -1; // Retreat
        } else {
            // Optimal range: Stop to shoot
            currentSpeed = 0; 
            moveDirection = 0;

            // Firing Logic
            if (currentTime - (enemy.lastShotTime || 0) > sniperFireRate) {
                
                bullets.push({
                    x: enemy.x,
                    y: enemy.y,
                    dx: Math.cos(angle) * sniperBulletSpeed,
                    dy: Math.sin(angle) * sniperBulletSpeed,
                    radius: 5,
                    color: enemy.color,
                    ownerType: 'ENEMY' as OwnerType
                });
                
                enemy.lastShotTime = currentTime;
            }
        }
        
        // Apply Custom Movement 
        if (dist > 0 && currentSpeed > 0) { 
            const finalSpeed = currentSpeed * DiepEnemyLogic.BASE_SPEED_FACTOR * deltaTime * moveDirection;
            
            enemy.x += Math.cos(angle) * finalSpeed;
            enemy.y += Math.sin(angle) * finalSpeed;
        }
    }
    
    private static handleSmasherBehavior(enemy: Enemy, player: Player, deltaTime: number, dx: number, dy: number, dist: number, currentTime: number): void {
        const flankSpeed = 2;
        const attackSpeed = 4;
        const attackRange = 150; 
        const flankCircleRadius = 400; 
        const resetDistance = flankCircleRadius * 1.5; 
        const rotationSpeed = 0.026; 

        // 1. Rotation Update 
        enemy.rotationAngle = (enemy.rotationAngle || 0) + rotationSpeed;
        if (enemy.rotationAngle > Math.PI * 2) {
            enemy.rotationAngle -= Math.PI * 2;
        }

        // 2. Dodge State Logic
        if (enemy.smasherState === 'DODGE') {
            const dodgeSpeed = attackSpeed * 2.5; 
            if (currentTime < enemy.dodgeEndTime!) {
                // Lateral movement (90 degrees to player direction)
                const playerAngle = Math.atan2(dy, dx); 
                // Determine direction: use the orbit direction for consistency
                const lateralAngle = playerAngle + (Math.PI / 2) * (enemy.smasherOrbitDirection || 1);
                const finalSpeed = dodgeSpeed * DiepEnemyLogic.BASE_SPEED_FACTOR * deltaTime;
                enemy.x += Math.cos(lateralAngle) * finalSpeed;
                enemy.y += Math.sin(lateralAngle) * finalSpeed;
                return; // Stop processing other states this frame
            } else {
                enemy.smasherState = 'APPROACH'; 
                enemy.dodgeEndTime = undefined;
            }
        }

        // --- DODGE LOGIC TRIGGER --- 
        const evasionCone = Math.PI / 6; 
        const evasionRange = 350; 
        
        // Angle from enemy to player (used to determine if player is aiming at enemy)
        const playerAngleFromEnemy = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        
        // Use player's last recorded angle to check if they are aiming at the Smasher (approximated here)
        // For simplicity, we assume the player's barrel is pointing from their center at angle 'player.angle'.
        let angleDifference = player.angle - playerAngleFromEnemy;
        // Normalize angle difference
        if (angleDifference > Math.PI) angleDifference -= 2 * Math.PI;
        if (angleDifference < -Math.PI) angleDifference += 2 * Math.PI;

        const isPlayerAimingAtMe = (Math.abs(angleDifference) < evasionCone);
        const isImminentThreat = (dist < 150); 

        if (enemy.smasherState !== 'ATTACK' && dist < evasionRange && isPlayerAimingAtMe && isImminentThreat) { 
            enemy.smasherState = 'DODGE';
            enemy.dodgeEndTime = currentTime + 150; 
        }
        // --- END DODGE TRIGGER ---

        // 3. FLANKING & APPROACH LOGIC
        if (enemy.smasherState === 'APPROACH' || enemy.smasherState === 'FLANK' || !enemy.smasherState) {
            enemy.smasherState = 'FLANK';
            
            // 1. Determine Desired Orbit Location 
            const angleToPlayer = Math.atan2(dy, dx); 
            // Rotation offset determines which side of the player the Smasher circles
            const rotationOffset = (enemy.smasherOrbitDirection || 1) * (Math.PI / 2);
            const targetOrbitAngle = angleToPlayer + rotationOffset; 
            
            const desiredX = player.x + Math.cos(targetOrbitAngle) * flankCircleRadius;
            const desiredY = player.y + Math.sin(targetOrbitAngle) * flankCircleRadius;
            
            // 2. Move Towards Orbit Location 
            DiepEnemyLogic.moveTowardsTarget(enemy, deltaTime, desiredX, desiredY, flankSpeed);
            
            // 3. Check for Attack Launch 
            if (dist < attackRange) { 
                enemy.smasherState = 'ATTACK';
            }
        }
        
        // 4. ATTACK (Final Charge)
        if (enemy.smasherState === 'ATTACK') {
            // Target is the player's current location
            DiepEnemyLogic.moveTowardsTarget(enemy, deltaTime, player.x, player.y, attackSpeed);

            // Reset to APPROACH if it misses and gets too far away.
            if (dist > resetDistance) {
                enemy.smasherState = 'APPROACH';
            }
        }
    }
    
    private static handleAuraBehavior(enemy: Enemy, deltaTime: number, canvasWidth: number, canvasHeight: number): void {
        const auraSpeed = 0.5; // Very slow movement
        const auraDistanceTolerance = 10;
        
        // Check if the Aura has reached its current target
        const targetDx = (enemy.targetX || 0) - enemy.x;
        const targetDy = (enemy.targetY || 0) - enemy.y;
        const targetDist = Math.sqrt(targetDx * targetDx + targetDy * targetDy);

        if (targetDist < auraDistanceTolerance || enemy.targetX === undefined) {
            // Re-acquire a new random target within the canvas
            enemy.targetX = enemy.radius + Math.random() * (canvasWidth - 2 * enemy.radius);
            enemy.targetY = enemy.radius + Math.random() * (canvasHeight - 2 * enemy.radius);
        }
        
        // Move towards the NEW target
        DiepEnemyLogic.moveTowardsTarget(enemy, deltaTime, enemy.targetX!, enemy.targetY!, auraSpeed);
    }
}
