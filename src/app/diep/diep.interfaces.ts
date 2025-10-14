// Define Game Object Interfaces for better type safety

export interface Player {
  x: number;
  y: number;
  radius: number;
  angle: number; // Rotation angle (radians)
  maxSpeed: number;
  color: string;
  health: number;
  maxHealth: number;
  fireRate: number; // Cooldown in ms
}

export interface Bullet {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  color: string;
  ownerType: 'PLAYER' | 'ENEMY'; 
}

// Define EnemyType enum (using type alias for flexibility)
export type EnemyType = 'REGULAR' | 'BOSS' | 'MINION' | 'CRASHER' | 'SNIPER' | 'AURA' | 'SMASHER';

export interface Enemy {
  x: number;
  y: number;
  radius: number;
  color: string;
  health: number;
  maxHealth: number;
  scoreValue: number;
  isBoss: boolean; 
  type: EnemyType; 
  speedMultiplier?: number; // For Crasher
  lastShotTime?: number; // For Sniper
  // For Aura's random movement
  targetX?: number; // Random target X coordinate for wandering
  targetY?: number; // Random target Y coordinate for wandering
  //For Flankers
  smasherState?: 'APPROACH' | 'FLANK' | 'ATTACK'| 'DODGE'; 
  dodgeEndTime?: number;
  rotationAngle?: number;
  smasherOrbitDirection	?: 1 | -1;
  smasherAttackRange?: number; 
}

export interface EnemySpawnWeight {
    type: EnemyType;
    weight: number;
}