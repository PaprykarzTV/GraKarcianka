import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges, OnChanges } from '@angular/core';
import { Card } from '../game.service';

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
  @Input() card!: Card;
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
    }, 1000); // Czas animacji dopasowany do CSS
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
    if (this.clickable) {
      this.cardClick.emit(this.card);
    }
  }

  getGradientClass(line: string): string {
    const gradients: Record<string, string> = {
      melee: 'from-purple-800 to-black',
      ranged: 'from-blue-500 to-black',
      aerial: 'from-green-700 to-black',
    };
    return gradients[line] ?? 'from-gray-600 to-black';
  }

  getLineSymbol(line: string): string {
    const symbols: Record<string, string> = {
      melee: '⚔',
      ranged: '🏹',
      aerial: '🛩',
    };
    return symbols[line] ?? '?';
  }

  getAbilitySymbol(ability: string): string {
    const abilities: Record<string, string> = {
      spy: '👁',
      destroy: '💥',
      boost: '➕',
      unique: '⭐',
    };
    return abilities[ability] ?? '?';
  }
}
