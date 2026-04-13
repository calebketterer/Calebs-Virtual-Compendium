import { Injectable } from '@angular/core';
import { Player, Bullet, Enemy, HighScore, TrailSegment } from '../../diep.interfaces';

@Injectable({
  providedIn: 'root'
})
export class GameStateManager {
  // Game Constants
  public readonly width = 800;
  public readonly height = 600;

  // Primary Game State
  public player!: Player;
  public bullets: Bullet[] = [];
  public enemies: Enemy[] = [];
  public toxicTrails: TrailSegment[] = [];
  public keys: { [key: string]: boolean } = {};
  public score = 0;
  public gameOver = false;
  public isPaused = false;
  public isDarkMode = true;
  public isStartingNewGame = false;

  // Aiming/Shooting State
  public lastAngle = 0;
  public mouseAiming = true;
  public mousePos = { x: 0, y: 0 };
  public mouseDown = false;

  // Wave/Progression State
  public enemySpawnCount = 5;
  public waveCount = 0;
  public isRegularWaveActive = false;
  public isGameStarted = false;

  // Death Animation State
  public deathAnimationTimeStart: number | null = null;
  public enemiesRemainingForAnimation: Enemy[] = [];
  public topScores: HighScore[] = [];

  constructor() {
    this.resetToDefaults();
  }

  public resetToDefaults() {
    this.player = {
      x: 400, y: 300, radius: 20, angle: 0,
      maxSpeed: 3, color: '#3498db', health: 100,
      maxHealth: 100, fireRate: 150
    };
    this.bullets = [];
    this.enemies = [];
    this.toxicTrails = [];
    this.keys = {};
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.lastAngle = 0;
    this.mouseAiming = true;
    this.mouseDown = false;
    this.enemySpawnCount = 5;
    this.waveCount = 0;
    this.deathAnimationTimeStart = null;
    this.enemiesRemainingForAnimation = [];
    this.isRegularWaveActive = false;
    this.isGameStarted = false;
    this.isStartingNewGame = false;
  }
}