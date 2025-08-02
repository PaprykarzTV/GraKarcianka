export type CardAbility =
  | { type: 'medic' }
  | { type: 'destroy'}
  | { type: 'spy' }
  | { type: 'boost', value: number }
  | { type: 'summon', units: string[] }
  | { type: 'synergy', tag: string };

export interface VanillaCard {
  id: number;
  name: string;
  power: number;
  line: CardLine;
  ability?: CardAbility | CardAbility[];
  unique?: boolean;
  imgUrl?: string;
  description?: string;
  deck: CardDeck;
}

export type CardDeck = 'monsters' | 'dominion' | 'order' | 'neutral';
export type CardAbilityType = CardAbility['type'];
export type CardLine = 'melee' | 'ranged' | 'siege';
