interface GameState {
  round: number;
  board: Card[];
  playerHand: Card[];
  graveyard: Card[];
  deck: Card[];
  activePlayer: 'player' | 'opponent';
}

export interface Card {
  id: number;
  name: string;
  power: number;
  color: string;
  icon?: string;
  line: 'melee' | 'ranged' | 'aerial';
  ability?: string;
  unique?: boolean;
  description?: string;

  // NOWE POLA STANU
  played: boolean;      // czy karta została zagrana
  roundPlayed?: number;  // która to runda
  effectTriggered?: boolean; // czy efekt został użyty
}

