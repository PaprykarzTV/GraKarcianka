interface GameState {
  round: number;
  board: Card[];
  playerHand: Card[];
  graveyard: Card[];
  deck: Card[];
  activePlayer: 'player' | 'opponent';
}

export type CardLine = 'melee' | 'ranged' | 'aerial';
export const ALL_CARD_LINES: CardLine[] = ['melee', 'ranged', 'aerial'];
export interface Card {
  id: number;
  name: string;
  power: number;
  color: string;
  icon?: string;
  line: CardLine;
  ability?: string;
  unique?: boolean;
  description?: string;

  // NOWE POLA STANU
  played: boolean;      // czy karta została zagrana
  roundPlayed?: number;  // która to runda
  effectTriggered?: boolean; // czy efekt został użyty
}

