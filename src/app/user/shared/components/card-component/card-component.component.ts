import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges, OnChanges } from '@angular/core';
import { Card } from '../../../card-game/card-game-types';
import { VanillaCard, CardDeck, CardAbility, CardAbilityType } from '../../models/card';

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
}

@Component({
  selector: 'card-component',
  templateUrl: './card-component.component.html',
  styleUrls: ['./card-component.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class CardComponent implements OnChanges {
  @Input() card!: Card | VanillaCard;
  @Input() clickable = false;

  /** Flaga uruchamiająca animację bordera unikatowej karty (chwilowa) */
  @Input() currentRound: number = 0;
 // do porównania z card.roundPlayed


  /** Efekt cząsteczek */
  @Input() triggerEffect = false;

  @Output() cardClick = new EventEmitter<Card>();

  particles: Particle[] = [];

  /** Flaga lokalna uruchamiająca animację bordera */
  animateBorder = false;

  ngOnChanges(changes: SimpleChanges): void {
    // Jeśli karta jest unikatowa i została właśnie zagrana, uruchamiamy animację bordera
    if (
      (changes['card'] || changes['currentRound']) &&
      this.card?.unique &&
      this.isFullCard(this.card) &&
      this.card.roundPlayed === this.currentRound
    ) {
      this.triggerBorderAnimation();
    }


    // Uruchamiamy efekt cząsteczek
    if (changes['triggerEffect']?.currentValue) {
      this.spawnParticles();
    }
  }

  private triggerBorderAnimation(): void {
    this.animateBorder = true;
    setTimeout(() => {
      this.animateBorder = false;  // Po animacji resetujemy flagę, ale border pozostaje dzięki `card.unique`
    }, 1500); // Czas animacji dopasowany do CSS
  }

  private generateParticles(): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = 40 + Math.random() * 30;
      particles.push({
        x: 64,
        y: 96,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        color: 'white',
      });
    }
    return particles;
  }

  spawnParticles(): void {
    this.particles = this.generateParticles();
    setTimeout(() => (this.particles = []), 700);
  }

  handleClick(): void {
    if (this.clickable && this.isFullCard(this.card)) {
      this.cardClick.emit(this.card);
    }
  }

  getGradientClass(cardDeck: CardDeck): string {
    switch (cardDeck) {
      case 'monsters':
        return 'from-purple-700 to-black';
      default: 
        return '';
    }
  }

  useBackgroundImage() {
    if (!this.card.imgUrl) return;
      return {
      'background-image': `url(${this.card.imgUrl})`,
      'background-size': 'contain',
      'background-repeat': 'no-repeat',
      'background-position': 'center',
    };
  }

  getLineSymbol(line: string): string {
    const symbols: Record<string, string> = {
      melee: '/melee.svg',
      ranged: '/ranged.svg',
      aerial: '/artillery.svg',
    };
    return symbols[line] ?? '?';
  }

  getAbilitySymbol(ability: CardAbility | CardAbility[]): string {
    const singleAbility: CardAbility = Array.isArray(ability) ? ability[0] : ability;

    const abilitiesSwitch: Record<CardAbilityType, string> = {
      spy: '/spyIcon.svg',
      destroy: '/destroyIcon.svg',
      boost: '/boostIcon.svg',
      medic: '/medicIcon.svg',
      summon: '/summonIcon.svg',
      synergy: '/synergyIcon.svg',
    };
    return abilitiesSwitch[singleAbility.type];
  }

  isFullCard(card: Card | VanillaCard): card is Card {
    return 'basePower' in card;
  }
}
