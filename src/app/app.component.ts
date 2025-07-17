import { Component, ElementRef, QueryList, Renderer2, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from './card-component/card-component.component';
import { Card } from './game.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [CommonModule,CardComponent],
  styleUrls: ['./app.component.css'],
})

export class CardGameComponent {

  @ViewChildren('handCard') handCards!: QueryList<ElementRef>;
  @ViewChildren('boardCard') boardCards!: QueryList<ElementRef>;
  
  currentRound = 1;
  ZERG_DECK: Omit<Card, 'played'>[] = [
    // Jednostki Zwarcia (melee)
    { id: 1, name: 'Zergling', power: 2, line: 'melee', color: 'from-green-700 to-black' },
    { id: 2, name: 'Zergling Pack', power: 4, line: 'melee', color: 'from-green-700 to-black' },
    { id: 3, name: 'Ultralisk', power: 10, line: 'melee', unique: true, icon: 'skull', description: 'Potężna jednostka - unikatowa.', color: 'from-purple-800 to-black' },

    // Jednostki dystansowe (ranged)
    { id: 4, name: 'Hydralisk', power: 5, line: 'ranged', color: 'from-yellow-600 to-brown-700' },
    { id: 5, name: 'Hydralisk Pack', power: 7, line: 'ranged', color: 'from-yellow-600 to-brown-700' },
    { id: 6, name: 'Infested Terran', power: 3, line: 'ranged', ability: 'spy', icon: 'eye', description: 'Szpieg - zagrywasz na pole przeciwnika.', color: 'from-gray-700 to-green-500' },

    // Jednostki latające (aerial)
    { id: 7, name: 'Mutalisk', power: 6, line: 'aerial', color: 'from-blue-600 to-indigo-700' },
    { id: 8, name: 'Scourge', power: 2, line: 'aerial', ability: 'destroy', icon: 'target', description: 'Eliminuje losową jednostkę wrogą o sile ≤ 5.', color: 'from-red-700 to-black' },
    { id: 9, name: 'Guardian', power: 8, line: 'aerial', color: 'from-blue-800 to-gray-700' },

    // Specjalne / wspomagające
    { id: 10, name: 'Overlord', power: 1, line: 'aerial', ability: 'boost', icon: 'plus', description: 'Zwiększa siłę wszystkich jednostek w tej samej linii o +1.', color: 'from-violet-700 to-blue-900' },
    { id: 11, name: 'Queen', power: 4, line: 'ranged', ability: 'destroy', icon: 'target', description: 'Może zniszczyć jednostkę przeciwnika o sile ≤ 4.', color: 'from-purple-600 to-black' },
    { id: 12, name: 'Kerrigan (Infested)', power: 12, line: 'ranged', unique: true, icon: 'skull', description: 'Bohater - nie można skopiować ani zniszczyć.', color: 'from-rose-700 to-black' }
  ];

  hand = this.shuffleDeck(
    this.ZERG_DECK.map(card => ({
      ...card,
      played: false,
    }))
  );


  board: Card[] = [];
  lastPlayedCardId: number | null = null;
  cardsWithBorder = new Set<number>();

  // W komponencie:
  flyingCard: Card | null = null;
  flyerStyle = {
    display: 'none',
    position: 'fixed',
    left: '0',
    top: '0',
    width: '128px',
    height: '192px',
    transform: 'translate(0, 0) scale(1)',
    opacity: 1,
    transition: 'transform 0.5s ease, opacity 0.5s ease',
    zIndex: 1000
  };


  flyerCard: Card | null = null;

  shuffleDeck(deck: Card[]): Card[] {
    const array = deck;
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  playCard(card: Card) {
    // Znajdź element karty w ręce i ostatnią kartę na stole
    const handCardElem = this.handCards.find(el => el.nativeElement.getAttribute('data-id') === card.id.toString())?.nativeElement;
    const boardElem = this.boardCards.last?.nativeElement;

    if (!handCardElem) return;

    // Pozycja startowa animacji (pozycja karty w ręce)
    const startRect = handCardElem.getBoundingClientRect();

    // Pozycja końcowa animacji (miejsce na stole)
    let endRect;
    if (boardElem) {
      const rect = boardElem.getBoundingClientRect();
      endRect = {
        left: rect.left + rect.width + 8, // 8px odstępu od ostatniej karty
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
    } else {
      // Pierwsza karta na stole - wyśrodkuj na ekranie
      endRect = {
        left: window.innerWidth / 2 - startRect.width / 2,
        top: window.innerHeight / 2 - startRect.height / 2,
        width: startRect.width,
        height: startRect.height,
      };
    }

    // Ustaw flyer (kartę animowaną) na startowej pozycji
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

    // Usuń kartę z ręki natychmiast, ale jeszcze nie dodawaj na stół
    this.hand = this.hand.filter(c => c.id !== card.id);

    // Po krótkim timeout animuj flyer do końcowej pozycji
    setTimeout(() => {
      const dx = endRect.left - startRect.left;
      const dy = endRect.top - startRect.top;
      this.flyerStyle = {
        ...this.flyerStyle,
        transform: `translate(${dx}px, ${dy}px) scale(1.1)`,
        opacity: 1,
      };
    }, 50);

    // Po zakończeniu animacji (600ms) dodaj kartę do stołu, ukryj flyer i ustaw ID ostatnio zagranej karty
    setTimeout(() => {
      card.played = true;
      card.roundPlayed = this.currentRound;
      this.board.push(card);
      this.flyerStyle = { ...this.flyerStyle, display: 'none' };
      this.flyerCard = null;

      // Ustaw flagę ostatnio zagranej karty, aby uruchomić animację borderu w komponencie karty
      this.lastPlayedCardId = card.id;

      // Po 2 sekundach wyczyść flagę animacji (czas dopasuj do animacji CSS)
      setTimeout(() => {
        this.lastPlayedCardId = null;
      }, 2000);
    }, 600);
  }


  getBoardCardTransform(index: number, total: number): string {
    if (total === 0) return 'none';
    const spacing = 0; // zmniejsz spacing, np. z 60 na 40
    const centerOffset = (total - 1) * spacing / 2;
    const translateX = index * spacing - centerOffset;
    return `translateX(${translateX}px)`;
  }

}
