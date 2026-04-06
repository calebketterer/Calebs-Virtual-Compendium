import { GwentCard } from '../interfaces/gwent-card';

export const CARD_DATABASE: GwentCard[] = [
  {
    id: 'geralt_1',
    name: 'Geralt of Rivia',
    power: 3,
    provisions: 10,
    artwork: 'Geralt_of_Rivia.jpg',
    ability: 'Deploy: Destroy an enemy unit with 9 or more power.',
    flavorText: 'Witchers were made to kill monsters.',
    row: 'Any',
    rarity: 'gold'
  },
  {
    id: 'drowner',
    name: 'Drowner',
    power: 5,
    provisions: 5,
    artwork: 'drowner.png',
    ability: 'Thrive. Deploy: Move an enemy unit to their other row.',
    flavorText: 'They dwell in the muck and the mire.',
    row: 'Melee',
    rarity: 'bronze'
  }
];