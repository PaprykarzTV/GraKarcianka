export interface PlayerState {
  deck: Card[]
  hand: Card[]
  lines: Record<CardLine, Card[]>;
  graveyard: Card[];
}

export type CardLine = 'melee' | 'ranged' | 'aerial';
export const ALL_CARD_LINES: CardLine[] = ['melee', 'ranged', 'aerial'];

export interface Card extends VanillaCard {
  basePower: number; 
  played: boolean;      
  roundPlayed?: number;  
  effectTriggered?: boolean;
}

export interface VanillaCard {
  id: number;
  name: string;
  power: number;
  color: string;
  icon?: string;
  line: CardLine;
  ability?: CardAbility;
  unique?: boolean;
  description?: string;
}

export type CardAbility = 'medic' | 'destroy' | 'spy' | 'boost';
export type Player = 'player' | 'enemy';

export function shuffleDeck(deck: Card[]): Card[] {
  const array = [...deck];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function initializeCards(deck: Card[], count: number): { drawn: Card[]; remainingDeck: Card[] } {
  const drawn = deck.slice(0, count);
  const remainingDeck = deck.slice(count);
  return { drawn, remainingDeck };
}
