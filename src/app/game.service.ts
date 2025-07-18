interface GameState {
  round: number;
  board: Card[];
  playerHand: Card[];
  graveyard: Card[];
  deck: Card[];
  activePlayer: 'player' | 'opponent';
}

export interface PlayerState {
  deck: Card[]
  hand: Card[]
  lines: Record<CardLine, Card[]>;
  graveyard: Card[];
}

export type CardLine = 'melee' | 'ranged' | 'aerial';
export const ALL_CARD_LINES: CardLine[] = ['melee', 'ranged', 'aerial'];

export interface Card extends VanillaCard {
  // NOWE POLA STANU
  basePower: number;  // Do wyliczania zmian wartości w karcie 
  played: boolean;      // czy karta została zagrana
  roundPlayed?: number;  // która to runda
  effectTriggered?: boolean; // czy efekt został użyty
}

export interface VanillaCard {
  id: number;
  name: string;
  power: number;
  color: string;
  icon?: string;
  line: CardLine;
  ability?: string;
  unique?: boolean;
  description?: string;
}

