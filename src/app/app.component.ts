import { Component, ElementRef, QueryList, Renderer2, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from './card-component/card-component.component';
import { ALL_CARD_LINES, Card, CardLine } from './game.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [CommonModule, CardComponent],
  styleUrls: ['./app.component.css'],
})
export class CardGameComponent {
  @ViewChildren('handCard', { read: ElementRef }) handCards!: QueryList<ElementRef>;
  @ViewChildren('boardCard', { read: ElementRef }) boardCards!: QueryList<ElementRef>;
  @ViewChildren('lineContainer', { read: ElementRef }) lineContainers!: QueryList<ElementRef>;

  currentRound = 1;
  ZERG_DECK: Omit<Card, 'played'>[] = [
    { id: 1, name: 'Zergling', power: 2, line: 'melee', color: 'from-green-700 to-black' },
    { id: 2, name: 'Zergling Pack', power: 4, line: 'melee', color: 'from-green-700 to-black' },
    { id: 3, name: 'Ultralisk', power: 10, line: 'melee', unique: true, icon: 'skull', description: 'Potężna jednostka - unikatowa.', color: 'from-purple-800 to-black' },
    { id: 4, name: 'Hydralisk', power: 5, line: 'ranged', color: 'from-yellow-600 to-brown-700' },
    { id: 5, name: 'Hydralisk Pack', power: 7, line: 'ranged', color: 'from-yellow-600 to-brown-700' },
    { id: 6, name: 'Infested Terran', power: 3, line: 'ranged', ability: 'spy', icon: 'eye', description: 'Szpieg - zagrywasz na pole przeciwnika.', color: 'from-gray-700 to-green-500' },
    { id: 7, name: 'Mutalisk', power: 6, line: 'aerial', color: 'from-blue-600 to-indigo-700' },
    { id: 8, name: 'Scourge', power: 2, line: 'aerial', ability: 'destroy', icon: 'target', description: 'Eliminuje losową jednostkę wrogą o sile ≤ 5.', color: 'from-red-700 to-black' },
    { id: 9, name: 'Guardian', power: 8, line: 'aerial', color: 'from-blue-800 to-gray-700' },
    { id: 10, name: 'Overlord', power: 1, line: 'aerial', ability: 'boost', icon: 'plus', description: 'Zwiększa siłę wszystkich jednostek w tej samej linii o +1.', color: 'from-violet-700 to-blue-900' },
    { id: 11, name: 'Queen', power: 4, line: 'ranged', ability: 'destroy', icon: 'target', description: 'Może zniszczyć jednostkę przeciwnika o sile ≤ 4.', color: 'from-purple-600 to-black' },
    { id: 12, name: 'Kerrigan (Infested)', power: 12, line: 'ranged', unique: true, icon: 'skull', description: 'Bohater - nie można skopiować ani zniszczyć.', color: 'from-rose-700 to-black' }
  ];

  hand = this.shuffleDeck(this.ZERG_DECK.map(card => ({ ...card, played: false })));
  board: Card[] = [];
  lastPlayedCardId: number | null = null;
  cardsWithBorder = new Set<number>();

  flyerCard: Card | null = null;
  flyerStyle = {
    display: 'none',
    position: 'fixed',
    left: '0px',
    top: '0px',
    width: '96px',
    height: '144px',
    transform: 'translate(0, 0) scale(1)',
    opacity: 1,
    transition: 'transform 0.5s ease, opacity 0.5s ease',
    zIndex: 1000
  };

  shuffleDeck(deck: Card[]): Card[] {
    const array = [...deck];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  playCard(card: Card) {
    const handCardElem = this.handCards.find(el => el.nativeElement.getAttribute('data-id') === card.id.toString())?.nativeElement;
    if (!handCardElem) return;

    const lineIndex = this.ALL_CARD_LINES.indexOf(card.line);
    if (lineIndex === -1) return;

    const lineContainerRef = this.lineContainers.toArray()[lineIndex];
    if (!lineContainerRef) return;

    const lineContainerElem = lineContainerRef.nativeElement as HTMLElement;

    const cardRowElem = lineContainerElem.querySelector('.card-row') as HTMLElement | null;
    if (!cardRowElem) return;

    const startRect = handCardElem.getBoundingClientRect();

    // Znajdź ostatnią kartę w linii (jeśli jest)
    const cardsInLine = cardRowElem.querySelectorAll('card-component');
    let endLeft: number, endTop: number;

    if (cardsInLine.length === 0) {
      // Jeśli brak kart - start animacji na lewy brzeg card-row z niewielkim paddingiem
      const rowRect = cardRowElem.getBoundingClientRect();
      const paddingLeft = 8;
      endLeft = rowRect.left + paddingLeft;
      endTop = rowRect.top;
    } else {
      // Jeśli są karty, to po prawej stronie ostatniej karty (plus mały odstęp)
      const lastCardElem = cardsInLine[cardsInLine.length - 1] as HTMLElement;
      const lastCardRect = lastCardElem.getBoundingClientRect();

      const gap = 8; // Odstęp między kartami

      endLeft = lastCardRect.right + gap;
      endTop = lastCardRect.top;
    }

    // Animacja flyer
    this.flyerCard = card;
    this.flyerStyle = {
      ...this.flyerStyle,
      display: 'block',
      left: `${startRect.left}px`,
      top: `${startRect.top}px`,
      width: `${startRect.width}px`,
      height: `${startRect.height}px`,
      transform: 'translate(0, 0) scale(1)',
      opacity: 1,
    };

    // Usuń kartę z ręki od razu
    this.hand = this.hand.filter(c => c.id !== card.id);

    setTimeout(() => {
      const dx = endLeft - startRect.left;
      const dy = endTop - startRect.top;

      this.flyerStyle = {
        ...this.flyerStyle,
        transform: `translate(${dx}px, ${dy}px) scale(1.1)`,
        opacity: 1,
      };
    }, 50);

    setTimeout(() => {
      this.lines[card.line].push({
        ...card,
        played: true,
        roundPlayed: this.currentRound,
      });

      this.flyerStyle = { ...this.flyerStyle, display: 'none' };
      this.flyerCard = null;
      this.lastPlayedCardId = card.id;

      setTimeout(() => {
        this.lastPlayedCardId = null;
      }, 2000);
    }, 600);
  }



  getBoardCardTransform(index: number, total: number): string {
    if (total === 0) return 'none';
    const spacing = 0;
    const centerOffset = (total - 1) * spacing / 2;
    const translateX = index * spacing - centerOffset;
    return `translateX(${translateX}px)`;
  }

  ALL_CARD_LINES = ALL_CARD_LINES;
  lines: Record<CardLine, Card[]> = {
    melee: [],
    ranged: [],
    aerial: [],
  };

  selectedCard: Card | null = null;
  highlightedLines: Set<CardLine> = new Set();

  selectCard(card: Card) {
    if (this.selectedCard?.id === card.id) {
      this.selectedCard = null;
      this.highlightedLines.clear();
      return;
    }
    this.selectedCard = card;
    this.highlightedLines.clear();
    this.highlightedLines.add(card.line);
  }

  placeCardOnLine(line: CardLine) {
    if (!this.selectedCard || this.selectedCard.line !== line) return;
    const card = this.selectedCard;
    this.selectedCard = null;
    this.highlightedLines.clear();
    this.playCard(card);
  }
}
