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
  isDying: boolean;
}

export type CardDeck = 'monsters' | 'dominion' | 'order' | 'neutral';

export interface VanillaCard {
  id: number;
  name: string;
  power: number;
  line: CardLine;
  ability?: CardAbility | CardAbility[];
  unique?: boolean;
  description?: string;
  deck: CardDeck;
}

export type CardAbilityType = CardAbility['type'];

export type CardAbility =
  | { type: 'medic' }
  | { type: 'destroy'}
  | { type: 'spy' }
  | { type: 'boost', value: number }
  | { type: 'summon', units: string[] }
  | { type: 'synergy', tag: string };
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

export const DECK: VanillaCard[] = [
  { id: 1, name: 'Swarmling', power: 1, line: 'melee', ability: {type: 'synergy', tag: 'swarmling'}, deck: 'monsters', description: 'Base unit of the Naruul Swarm. Weak alone, deadly in numbers.'  },
  { id: 2, name: 'Swarmling', power: 1, line: 'melee', ability: {type: 'synergy', tag: 'swarmling'}, deck: 'monsters', description: 'Base unit of the Naruul Swarm. Weak alone, deadly in numbers.'},
  { id: 3, name: 'Swarmling', power: 1, line: 'melee', ability: {type: 'synergy', tag: 'swarmling'}, deck: 'monsters', description: 'Base unit of the Naruul Swarm. Weak alone, deadly in numbers.'},
  { id: 4, name: 'Goreling', power: 8, line: 'melee', unique: true, deck: 'monsters', description: 'Engineered for pure carnage. Even Swarmlings fear its hunger.' },
  { id: 6, name: 'Devourer', power: 3, line: 'melee', deck: 'monsters', description: 'Evolved Swarmling with a voracious appetite.' },
  { id: 6, name: 'Venom Strider', power: 4, line: 'melee', description: 'Thin-limbed and fast unit of the Naruul Swarm, it injects paralytics from afar.', deck: 'monsters' },
  { id: 7, name: 'High Broodseer Vaxil', power: 6, line: 'melee', description: 'Ancient psychic node of the Naruul mindweb.', deck: 'monsters' },
  { id: 8, name: 'Naruul Broodguard', power: 4, line: 'melee', description: 'Protector of the Hive.', deck: 'monsters' },
  { id: 9, name: 'Naruul Broodguard', power: 4, line: 'melee', description: 'Protector of the Hive.', deck: 'monsters' },
  { id: 10, name: 'Baron Naruul', power: 4, line: 'melee', unique: true, description: 'Swarm overlord with a mindbound legion.', deck: 'monsters' } ,
  { id: 11, name: 'Ravager', power: 5, line: 'melee', description: 'A powerful melee unit with devastating attacks.', deck: 'monsters' },
  { id: 12, name: 'Nightstalker', power: 6, line: 'melee', ability: {type: 'spy'}, description: 'He disappears among his enemies. He only informs those who already know the truth—that death is watching.', deck: 'monsters' },
  { id: 13, name: 'Crimson Thrall', power: 2, line: 'melee', description: 'Once human, now bound by thirst and obedience.',deck: 'monsters' },
  { id: 14, name: 'Whispering Shade', power: 2, line: 'ranged', description: 'Fallen bloodknight. Whispers false truths',deck: 'monsters' },
  { id: 15, name: 'Spinecrawler', power: 3, line: 'ranged', description: 'Arthropod-like crawler that fires hardened spines from its back.', deck: 'monsters' },
  { id: 16, name: 'Swarm Sovereign', power: 15, line: 'aerial', unique: true, description: 'An evolved primal entity, born from the swarm\'s relentless evolution.', deck: 'monsters' },
  { id: 17, name: 'Syltharix', power: 10, unique: true, line: 'melee', description: 'A cold warrior who never leaves the battlefield until he has plunged his sword into the enemy.', deck: 'monsters' },
  { id: 18, name: 'Korvath the Pale', power: 10, unique: true, line: 'ranged', description: 'The prophet of death who sees the end of everything.', deck: 'monsters' },
  { id: 19, name: 'Lutharion the Hollow', power: 10, unique: true, line: 'melee', description: 'Empty inside, but full of power that devours everything in your path.', deck: 'monsters' },
  { id: 20, name: 'Ironroot Ent', power: 6, line: 'melee', description: 'A massive tree-like creature that crushes its enemies with its roots.', deck: 'monsters' },
  { id: 21, name: 'Stonebound Troll', power: 3, line: 'melee', description: 'A hulking troll with skin as tough as stone.', deck: 'monsters' },
  { id: 22, name: 'Crimson golem', power: 2, line: 'melee', description: 'Biological Golem. Guards Angular Temple.', deck: 'monsters' },
  { id: 23, name: 'Crimson golem', power: 2, line: 'melee', description: 'Biological Golem. Guards Angular Temple.', deck: 'monsters' },
  { id: 24, name: 'Bone Construct', power: 3, line: 'melee', description: 'A construct made of bones, created by Thal\'Vexis', deck: 'monsters' },
  { id: 25, name: 'Stone Construct', power: 3, line: 'melee', description: 'A construct made of stone, created by Thal\'Vexis', deck: 'monsters' },
  { id: 26, name: 'Sand Construct', power: 3, line: 'melee', description: 'A construct made of sand, created by Thal\'Vexis', deck: 'monsters' },
  { id: 27, name: 'Arachnid', power: 2, line: 'melee', description: 'A small spider-like creature that can poison its enemies.', deck: 'monsters' },
]