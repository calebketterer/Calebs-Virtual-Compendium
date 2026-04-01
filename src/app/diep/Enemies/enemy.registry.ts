import { Enemy, Player, Bullet, EnemyType } from '../diep.interfaces';
import { SmasherEnemy } from './smasher.enemy';
import { CrasherEnemy } from './crasher.enemy';
import { SniperEnemy } from './sniper.enemy';
import { BossEnemy } from './boss.enemy';
import { AuraEnemy } from './aura.enemy';
import { StandardEnemy } from './standard.enemy';

export class EnemyRegistry {
    private static readonly BASE_SPEED_FACTOR = 0.06;

    private static getHandler(type: EnemyType) {
        const mapping: Record<EnemyType, any> = {
            'SMASHER': SmasherEnemy,
            'CRASHER': CrasherEnemy,
            'SNIPER': SniperEnemy,
            'BOSS': BossEnemy,
            'AURA': AuraEnemy,
            'REGULAR': StandardEnemy,
            'MINION': StandardEnemy
        };
        return mapping[type] || StandardEnemy;
    }

    public static update(enemy: Enemy, player: Player, bullets: Bullet[], deltaTime: number, currentTime: number) {
        const handler = this.getHandler(enemy.type);
        // We pass 'this.moveTowardsTarget' so individual files can use the shared physics logic
        handler.update(enemy, player, deltaTime, currentTime, this.moveTowardsTarget.bind(this), bullets);
    }

    public static draw(ctx: CanvasRenderingContext2D, enemy: Enemy, player: Player) {
        this.getHandler(enemy.type).draw(ctx, enemy, player);
    }

    private static moveTowardsTarget(enemy: Enemy, deltaTime: number, tX: number, tY: number, speed: number) {
        const dx = tX - enemy.x;
        const dy = tY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            const finalSpeed = speed * this.BASE_SPEED_FACTOR * deltaTime;
            enemy.x += (dx / dist) * finalSpeed;
            enemy.y += (dy / dist) * finalSpeed;
        }
    }
}