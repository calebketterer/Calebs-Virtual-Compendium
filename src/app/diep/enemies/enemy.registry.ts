import { Enemy, Player, Bullet, EnemyType } from '../diep.interfaces';
import { SmasherEnemy } from './red/smasher.enemy';
import { CrasherEnemy } from './purple/crasher.enemy';
import { SniperEnemy } from './red/sniper.enemy';
import { BossEnemy } from './boss.enemy';
import { BloaterEnemy } from './green/bloater.enemy';
import { RollerEnemy } from './red/roller.enemy';
import { GunnerEnemy } from './green/gunner.enemy';
import { MotherEnemy } from './purple/mother.enemy';
import { MinionEnemy } from './purple/minion.enemy';
import { HealerEnemy } from './healer.enemy';
import { PuddleEnemy } from './green/puddle.enemy';
import { HaunterEnemy } from './blue/haunter.enemy';
import { BomberEnemy } from './orange/bomber.enemy';
import { BlasterEnemy } from './orange/blaster.enemy';
import { CasterEnemy } from './blue/caster.enemy';
import { EchoEnemy } from './blue/echo.enemy';

/**
 * The EnemyRegistry acts as the central "Switchboard".
 * It maps EnemyTypes to their specific logic and drawing files.
 */
export class EnemyRegistry {

  /**
   * Mappings of EnemyType to the specific object containing create/update/draw logic.
   */
  private static readonly mapping: Record<EnemyType, any> = {
    'SMASHER': SmasherEnemy,
    'CRASHER': CrasherEnemy,
    'SNIPER': SniperEnemy,
    'BOSS': BossEnemy,
    'BLOATER': BloaterEnemy,
    'ROLLER': RollerEnemy,
    'GUNNER': GunnerEnemy,
    'MOTHER': MotherEnemy,
    'MINION': MinionEnemy,
    'HEALER': HealerEnemy,
    'PUDDLE': PuddleEnemy,
    'HAUNTER' : HaunterEnemy,
    'BOMBER' : BomberEnemy,
    'BLASTER' : BlasterEnemy,
    'CASTER' : CasterEnemy,
    'ECHO' : EchoEnemy,
  };

  /**
   * Factory method to initialize a new enemy with its default stats.
   */
  public static createEnemy(type: EnemyType, x: number, y: number): Enemy {
    const handler = this.getHandler(type);
    
    // Call the 'create' method in the specific enemy file
    const baseStats = handler.create(x, y, type);

    // Merge base stats with required properties
    return {
      type,
      isBoss: type === 'BOSS',
      ...baseStats
    } as Enemy;
  }

  /**
   * Delegates the update logic to the specific enemy file.
   */
  public static update(
    enemy: Enemy, 
    player: Player, 
    bullets: Bullet[], 
    deltaTime: number, 
    currentTime: number
  ): void {
    const handler = this.getHandler(enemy.type);
    
    // We pass 'moveTowardsTarget' as a reference so enemies can use it
    handler.update(
      enemy, 
      player, 
      deltaTime, 
      currentTime, 
      this.moveTowardsTarget.bind(this), 
      bullets
    );
  }

  /**
   * Delegates the drawing logic to the specific enemy file.
   */
  public static draw(ctx: CanvasRenderingContext2D, enemy: Enemy, player: Player, bullets: Bullet[]): void {
    const handler = this.getHandler(enemy.type);
    handler.draw(ctx, enemy, player, bullets);
  }

  /**
   * A shared movement utility used by all enemy update methods.
   */
  public static moveTowardsTarget(
    enemy: Enemy, 
    deltaTime: number, 
    targetX: number, 
    targetY: number, 
    targetSpeed: number
  ): void {
    const dx = targetX - enemy.x;
    const dy = targetY - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0 && targetSpeed > 0) {
      // BASE_SPEED_FACTOR (0.06) ensures frame-rate independence
      const finalSpeed = targetSpeed * 0.06 * deltaTime;
      enemy.x += (dx / dist) * finalSpeed;
      enemy.y += (dy / dist) * finalSpeed;
    }
  }

  /**
   * Internal helper to find the correct handler or fallback to Standard.
   */
  private static getHandler(type: EnemyType): any {
    return this.mapping[type] || RollerEnemy;
  }
}