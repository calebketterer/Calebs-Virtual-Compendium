export interface GwentCard {
  id: any;
  name: string;
  type: 'unit'| 'special'| 'artefact';
  power: number;
  provisions: number;
  artwork: string;
  faction: 'NU' | 'MO' | 'NR'| 'NG' | 'ST'| 'SY';
  tags?: string;
  ability: string;
  flavorText: string;
  owner?: number;
  rarity: 'gold' | 'silver' | 'bronze';
}