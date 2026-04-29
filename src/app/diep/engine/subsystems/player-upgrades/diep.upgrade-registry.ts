export interface UpgradePath {
  id: string;
  name: string;
  color: string;
  increments: number | number[]; 
}

export const UPGRADE_REGISTRY: UpgradePath[] = [
  {
    id: 'maxHealth',
    name: 'Max Health',
    color: '#eb4d4b',
    increments: 20
  },
  {
    id: 'bulletDamage',
    name: 'Bullet Damage',
    color: '#f0932b',
    increments: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
  },
  {
    id: 'maxSpeed',
    name: 'Movement Speed',
    color: '#badc58',
    increments: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2]
  }
];