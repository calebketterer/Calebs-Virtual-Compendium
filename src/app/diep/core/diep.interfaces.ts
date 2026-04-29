export type OwnerType = 'PLAYER' | 'ENEMY'; 
export type DifficultyMode = 'EASY' | 'MEDIUM' | 'HARD';

export interface PlayerProgression {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  totalXpEarned: number;
  upgradePoints: number;
  difficulty: DifficultyMode;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  angle: number; 
  maxSpeed: number;
  color: string;
  health: number;
  maxHealth: number;
  fireRate: number;
  bodyDamage: number;
  bulletDamage: number;
  bulletHealth: number;
  bulletSpeed: number;
  upgrades: Record<string, number>;
  progression: PlayerProgression;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  mass: number;
  color: string;
  ownerType: OwnerType;
  health: number;
  maxHealth: number;
  damage: number;
  hasTrail?: boolean;
  isBomb?: boolean;
  timer?: number;      
  maxTimer?: number;   
  explosionRadius?: number;
  isExploding?: boolean; 
  isHoming?: boolean;
  isBouncy?: boolean;
  bounces?: number;
  healOwnerOnHit?: boolean;
  ownerId?: string;
}

export type EnemyType = 'ROLLER' | 'MINION' | 'CRASHER' | 'SNIPER' | 'BLOATER' | 'SMASHER' | 'GUNNER' | 'MOTHER'| 'HEALER' | 'PUDDLE'| 'HAUNTER' |'BOMBER'| 'BLASTER'| 'CASTER'| 'ECHO';

export interface Enemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  color: string;
  health: number;
  maxHealth: number;
  bodyDamage: number;
  scoreValue: number;
  isBoss?: boolean; 
  type: EnemyType; 
  speedMultiplier?: number;
  lastShotTime?: number;
  targetX?: number; 
  targetY?: number; 
  spawnTime?: number;   
  lifespan?: number;     
  rotation?: number;
  rotationAngle?: number;
  rotationSpeed?: number;
  speedPhase?: number;
  state?: Record<string, any>;
  isPassive?: boolean;         
  canDespawn?: boolean;      
  opacity?: number;         
  needsSpawn?: boolean;  
  isGhost?: boolean; 
  isInvulnerable?: boolean;  
  isPriming?: boolean;     
  blastTimer?: number;     
  maxBlastTimer?: number; 
  blastRadius?: number;    
  onHit?: (enemies: Enemy[], spawner: any, bullet: Bullet) => void;
  onDeath?: (enemies: Enemy[], spawner: any, deadEnemy: Enemy, player: Player) => void;
  onUpdate?: (enemy: Enemy, player: Player, deltaTime: number) => void;
  onSpawn?: (enemy: Enemy, canvasWidth: number, canvasHeight: number) => void;
  onDraw?: (ctx: CanvasRenderingContext2D, enemy: Enemy) => void;
}

export interface EnemySpawnWeight {
    type: EnemyType;
    weight: number;
}

export interface HighScore {
  score: number;
  date: string; 
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

export interface ButtonArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DiepButton extends ButtonArea {
  id: string;
  label: string;
  color: string;
  borderColor: string;
  textColor?: string;
  fontSize?: string;
  action: () => void;
}

export type AchievementType = 'KILL' | 'WAVE' | 'SCORE';

export interface Achievement {
  id: string;
  groupId?: string;
  tier?: number;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  isUnlocked: boolean;
  type: 'WAVE' | 'KILL' | 'SCORE';
  weight: number;
  enemyType?: string; 
  faction?: 'Red' | 'Orange' | 'Yellow' | 'Green' | 'Blue' | 'Purple';
  isSingleGame?: boolean;
}