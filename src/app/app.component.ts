import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from './card-component/card-component.component';
import { ALL_CARD_LINES, Card, CardLine, PlayerState, VanillaCard } from './game.service';
import { AudioService } from './audio.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class CardGameComponent {
  @ViewChildren('handCard', { read: ElementRef }) handCards!: QueryList<ElementRef>;
  @ViewChildren('lineContainer', { read: ElementRef }) lineContainers!: QueryList<ElementRef>;
  @ViewChildren('enemyLineContainer', { read: ElementRef }) enemyLineContainers!: QueryList<ElementRef>;
  @ViewChildren('enemyStack', { read: ElementRef }) enemyStack!: QueryList<ElementRef>;

  constructor(private audioService: AudioService) {}

  playerPoints: number = 0;
  enemyPoints: number = 0;

  player: PlayerState = {
    deck: [],
    hand: [],
    lines: { melee: [], ranged: [], aerial: [] },
    graveyard: [],
  };

  enemy: PlayerState = {
    deck: [],
    hand: [],
    lines: { melee: [], ranged: [], aerial: [] },
    graveyard: [],
  };


  ZERG_DECK: VanillaCard[] = [
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

  board: Card[] = [];
  lastPlayedCardId: number | null = null;
  currentRound = 1;

  flyerCard: Card | null = null;
  isEnemyFlyer: boolean = false;


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

  ALL_CARD_LINES = ALL_CARD_LINES;

  selectedCard: Card | null = null;
  highlightedLines: Set<CardLine> = new Set();

  ngOnInit() {
    this.initializeGame();
  }

  initializeGame() {
    const fullDeck : Card[] = this.ZERG_DECK.map(card => ({ ...card, played: false, basePower: card.power }));

    const playerDeck = this.shuffleDeck(fullDeck);
    const enemyDeck = this.shuffleDeck(fullDeck);

    const { drawn: playerHand, remainingDeck: remainingPlayerDeck } = this.initializeCards(playerDeck, 5);
    const { drawn: enemyHand, remainingDeck: remainingEnemyDeck } = this.initializeCards(enemyDeck, 5);

    this.player = {
      deck: remainingPlayerDeck,
      hand: playerHand,
      lines: { melee: [], ranged: [], aerial: [] },
      graveyard: [],
    };

    this.enemy = {
      deck: remainingEnemyDeck,
      hand: enemyHand,
      lines: { melee: [], ranged: [], aerial: [] },
      graveyard: [],
    };
  }


  shuffleDeck(deck: Card[]): Card[] {
    const array = [...deck];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  initializeCards(deck: Card[], count: number): { drawn: Card[]; remainingDeck: Card[] } {
    const drawn = deck.slice(0, count);
    const remainingDeck = deck.slice(count);
    return { drawn, remainingDeck };
  }

  playCard(card: Card, isEnemy = false) {
    const sourceElem = isEnemy
      ? this.enemyStack.first?.nativeElement
      : this.handCards.find(el => el.nativeElement.getAttribute('data-id') === card.id.toString())?.nativeElement;

    if (!sourceElem) return;

    const lineIndex = this.ALL_CARD_LINES.indexOf(card.line);
    const containerList = isEnemy ? this.enemyLineContainers : this.lineContainers;
    const lineContainerRef = containerList.toArray()[lineIndex];
    if (!lineContainerRef) return;

    const cardRowElem = lineContainerRef.nativeElement.querySelector('.card-row') as HTMLElement;
    if (!cardRowElem) return;

    const startRect = sourceElem.getBoundingClientRect();

    // Znajdź ostatnią kartę w linii
    const cardsInLine = cardRowElem.querySelectorAll('card-component');
    let endLeft: number, endTop: number;

    if (cardsInLine.length === 0) {
      const rowRect = cardRowElem.getBoundingClientRect();
      endLeft = rowRect.left + 8;
      endTop = rowRect.top - 50; // Wtf why -50 works better, didn't find solution
    } else {
      const lastCardRect = (cardsInLine[cardsInLine.length - 1] as HTMLElement).getBoundingClientRect();
      endLeft = lastCardRect.right + 8;
      endTop = lastCardRect.top;
    }

    // Animacja flyer
    this.flyerCard = card;
    this.isEnemyFlyer = isEnemy;

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

    if (!isEnemy) {
      this.player.hand = this.player.hand.filter(c => c.id !== card.id);
    } else {
      this.enemy.hand = this.enemy.hand.filter(c => c.id !== card.id);
    }

    setTimeout(() => {
      this.audioService.play("/cardPlaceSound.wav",0.4);
      const dx = endLeft - startRect.left;
      const dy = endTop - startRect.top;
      this.flyerStyle = {
        ...this.flyerStyle,
        transform: `translate(${dx}px, ${dy}px) scale(1.1)`,
        opacity: 1,
      };
    }, 50);

    setTimeout(() => {
      const targetLines = isEnemy ? this.enemy.lines : this.player.lines;
      targetLines[card.line].push({
        ...card,
        played: true,
        roundPlayed: this.currentRound,
      });

      this.playerPoints = Object.values(this.player.lines).reduce((total, lineCards) => {
        return total + lineCards.reduce((sum, card) => sum + card.power, 0);
      }, 0);

      this.enemyPoints = Object.values(this.enemy.lines).reduce((total, lineCards) => {
        return total + lineCards.reduce((sum, card) => sum + card.power, 0);
      }, 0);


      this.flyerStyle = { ...this.flyerStyle, display: 'none' };
      this.flyerCard = null;
      this.lastPlayedCardId = card.id;
      setTimeout(() => this.lastPlayedCardId = null, 2000);
    }, 600);
  }

  selectCard(card: Card) {
    if (this.selectedCard?.id === card.id) {
      this.selectedCard = null;
      this.highlightedLines.clear();
      return;
    }
    this.selectedCard = card;
    this.highlightedLines = new Set([card.line]);
  }

  placeCardOnLine(line: CardLine) {
    if (!this.selectedCard || this.selectedCard.line !== line) return;
    const card = this.selectedCard;
    this.selectedCard = null;
    this.highlightedLines.clear();
    this.playCard(card, false);
  }

  getLineBackgroundIcon(line: CardLine) {
    switch (line) {
      case 'melee': return 'url(/melee.svg)';
      case 'ranged': return 'url(/ranged.svg)';
      case 'aerial': return 'url(/artillery.svg)';
      default: return 'none';
    }
  }

  playCardByEnemy() {
    if(this.enemy.hand.length === 0) {
      alert("Przeciwnik nie ma kart")
      return;
    };
    const randomEnemyCard = this.enemy.hand[Math.floor(Math.random() * this.enemy.hand.length)];
    this.playCard(randomEnemyCard, true);
  }

}
