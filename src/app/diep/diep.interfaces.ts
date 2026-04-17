export type OwnerType = 'PLAYER' | 'ENEMY'; 

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
  ownerType: OwnerType;
  hasTrail?: boolean;
  isBomb?: boolean;
  timer?: number;      // Countdown in ms or frames
  maxTimer?: number;   // Total fuse time
  explosionRadius?: number;
  isExploding?: boolean; // To trigger a visual blast effect
}

// Define EnemyType enum (using type alias for flexibility)
export type EnemyType = 'ROLLER' | 'BOSS' | 'MINION' | 'CRASHER' | 'SNIPER' | 'BLOATER' | 'SMASHER' | 'GUNNER' | 'MOTHER'| 'HEALER' | 'PUDDLE'| 'HAUNTER' |'BOMBER';
export type SmasherState = 'APPROACH' | 'FLANK' | 'ATTACK' | 'DODGE';

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
  // For Bloater's random movement
  targetX?: number; // Random target X coordinate for wandering
  targetY?: number; // Random target Y coordinate for wandering
  //For Smashers
  smasherState?: SmasherState; // Using exported type
  dodgeEndTime?: number;
  rotationAngle?: number;
  smasherOrbitDirection ?: 1 | -1;
  smasherAttackRange?: number; 
  vx?: number;
  vy?: number;
  rotation?: number;
  rotationSpeed?: number;
  speedPhase?: number;
  onDeath?: (enemies: Enemy[], spawner: any, deadEnemy: Enemy, player: Player) => void;
  onUpdate?: (enemy: Enemy, player: Player, deltaTime: number) => void;
  onSpawn?: (enemy: Enemy, canvasWidth: number, canvasHeight: number) => void;
  isPassive?: boolean;      // If true, doesn't count toward wave progression
  canDespawn?: boolean;     // If true, can be removed silently off-screen
  isGhost?: boolean; // If true, bullets will pass through
  spawnTime?: number;   // When it was created
  lifespan?: number;    // How long it lasts (ms)
}

export interface EnemySpawnWeight {
    type: EnemyType;
    weight: number;
}

export interface HighScore {
  score: number;
  date: string; // ISO 8601 string for persistent storage
}

export interface TrailSegment {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    color: string;
    opacity: number;
    creationTime: number;
    lifespan: number;
}