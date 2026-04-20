import { Enemy, Player } from '../../diep.interfaces';

// Encapsulated Smasher-only states
export type SmasherState = 'APPROACH' | 'FLANK' | 'ATTACK' | 'DODGE' | 'RETREAT';

export class SmasherEnemy {

    public static metadata = {
        name: 'Smasher',
        faction: 'Red',
        description: 'A relentless crimson unit that maintains high momentum to crush targets.'
    };

  private static readonly BASE_RADIUS = 25;
  private static readonly BASE_HEALTH = 250;
  private static readonly ATTACK_SPEED = 4;
  private static readonly FLANK_SPEED = 2;

  public static create(x: number, y: number): Partial<Enemy> {
    const scale = 0.8 + Math.random() * 1.2;
    
    return {
      x,
      y,
      radius: this.BASE_RADIUS * scale,
      health: this.BASE_HEALTH * Math.pow(scale, 1.4),
      maxHealth: this.BASE_HEALTH * Math.pow(scale, 1.4),
      scoreValue: Math.floor(300 * scale),
      color: '#000000',
      type: 'SMASHER',
      smasherState: 'APPROACH' as SmasherState,
      rotationAngle: Math.random() * 2 * Math.PI,
      smasherOrbitDirection: Math.random() < 0.5 ? 1 : -1,
      speedMultiplier: 1 / scale, // Large ones are slower
      smasherAttackRange: 150 * scale
    };
  }

  public static update(
    enemy: Enemy, 
    player: Player, 
    deltaTime: number, 
    currentTime: number, 
    moveTowards: Function
  ): void {
    const rotationSpeed = 0.028;
    const speedMod = enemy.speedMultiplier || 1;
    
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    enemy.rotationAngle = (enemy.rotationAngle || 0) + rotationSpeed;

    switch (enemy.smasherState as SmasherState) {
      case 'ATTACK':
        moveTowards(enemy, deltaTime, player.x, player.y, this.ATTACK_SPEED * speedMod);
        // Reset if player gets too far or kited
        if (dist > 500) enemy.smasherState = 'FLANK';
        break;

      case 'DODGE':
        // Move perpendicular to the player
        const dodgeX = enemy.x + dy; 
        const dodgeY = enemy.y - dx;
        moveTowards(enemy, deltaTime, dodgeX, dodgeY, this.FLANK_SPEED * 1.5 * speedMod);
        if (!enemy.dodgeEndTime || currentTime > enemy.dodgeEndTime) {
          enemy.smasherState = 'APPROACH';
        }
        break;

      case 'FLANK':
      case 'APPROACH':
      default:
        const dir = enemy.smasherOrbitDirection || 1;
        const orbitWave = Math.sin(currentTime / 600) * 80;
        const targetX = player.x + Math.cos(currentTime / 1200) * (400 + orbitWave) * dir;
        const targetY = player.y + Math.sin(currentTime / 1200) * (400 + orbitWave);
        
        moveTowards(enemy, deltaTime, targetX, targetY, this.FLANK_SPEED * speedMod);

        // Transition to attack based on distance
        if (dist < (enemy.smasherAttackRange || 160)) {
          enemy.smasherState = 'ATTACK';
        }
        
        // Randomly trigger a dodge maneuver
        if (Math.random() < 0.005) {
          enemy.smasherState = 'DODGE';
          enemy.dodgeEndTime = currentTime + 800;
        }
        break;
    }
  }

  public static draw(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.rotationAngle || 0);

    const isAttacking = enemy.smasherState === 'ATTACK';

    // Hexagonal Shell
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 + Math.PI / 6;
      ctx.lineTo(enemy.radius * Math.cos(angle), enemy.radius * Math.sin(angle));
    }
    ctx.closePath();
    
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.strokeStyle = isAttacking ? '#d62836' : '#34495e';
    const pulse = isAttacking ? 0.5 + Math.sin(Date.now() / 160) * 2 : 2;
    ctx.lineWidth = pulse;
    ctx.stroke();

    // The Red "Eye" / Core
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = '#e74c3c';
    
    if (isAttacking) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ff4757';
    }
    
    ctx.fill();
    ctx.restore();
  }
}