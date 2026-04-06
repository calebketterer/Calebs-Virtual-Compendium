export interface GwentCard {
  id: any;
  name: string;
  power: number;
  provisions: number;
  artwork: string;
  ability: string;
  flavorText: string;
  owner?: number;
  row: 'Melee' | 'Ranged' | 'Any';
  rarity: 'gold' | 'silver' | 'bronze';
}