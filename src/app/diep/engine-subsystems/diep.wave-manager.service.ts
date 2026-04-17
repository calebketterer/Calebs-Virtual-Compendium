import { Injectable } from '@angular/core';
import { Enemy } from '../diep.interfaces';
import { EnemySpawnerService } from '../diep.enemy-spawner';

@Injectable({
    providedIn: 'root'
})
export class DiepWaveManagerService {
    public waveCount = 0;
    public enemySpawnCount = 5;
    public isRegularWaveActive = false;

    constructor(private spawner: EnemySpawnerService) {}

    /**
     * Resets wave progression for a new game session.
     */
    public reset() {
        this.waveCount = 0;
        this.enemySpawnCount = 5;
        this.isRegularWaveActive = false;
    }

    /**
     * Checks the current enemy list and determines if a new wave needs to be triggered.
     */
    public updateWaves(enemies: Enemy[], width: number, height: number) {
        const hasRegularEnemies = enemies.some(e => e.color === '#e74c3c');
        const hasBossOrMinions = enemies.some(e => e.isBoss || e.color === '#d2b4de');
        const combatEnemies = enemies.filter(e => !e.isPassive);

        // Logic for triggering the next wave
        if (combatEnemies.length === 0) {
            this.prepareNextWave();
            this.spawner.spawnEnemies(enemies, this.enemySpawnCount, false, this.waveCount, width, height);
        } else if (this.isRegularWaveActive && !hasRegularEnemies) {
            this.prepareNextWave();
            this.spawner.spawnEnemies(enemies, this.enemySpawnCount, hasBossOrMinions, this.waveCount, width, height);
        }
    }

    private prepareNextWave() {
        this.enemySpawnCount++;
        this.waveCount++;
        this.isRegularWaveActive = false;
    }

    /**
     * Helper to initiate the very first wave.
     */
    public startFirstWave(enemies: Enemy[], width: number, height: number) {
        this.isRegularWaveActive = false;
        this.spawner.spawnEnemies(enemies, this.enemySpawnCount, false, this.waveCount, width, height);
    }
}