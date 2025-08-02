import { CardLine, VanillaCard } from "../shared/models/card";

export interface PlayerState {
  deck: Card[]
  hand: Card[]
  lines: Record<CardLine, Card[]>;
  graveyard: Card[];
}

export const ALL_CARD_LINES: CardLine[] = ['melee', 'ranged', 'siege'];

export interface Card extends VanillaCard {
  basePower: number; 
  played: boolean;      
  roundPlayed?: number;  
  effectTriggered?: boolean;
  isDying: boolean;
}

export type Player = 'player' | 'enemy';