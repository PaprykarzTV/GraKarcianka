import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from './card-component/card-component.component';
import { ALL_CARD_LINES, Card, CardAbility, CardLine, PlayerState, VanillaCard, shuffleDeck, initializeCards, Player, CardAbilityType, DECK } from './game.service';
import { AudioService } from './audio.service';
import { NavBarComponent } from "./nav-bar/nav-bar.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CardComponent, NavBarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class CardGameComponent {
  // Referencje do elementów DOM kart w ręce gracza, linii gracza, linii przeciwnika i stosu przeciwnika
  @ViewChildren('handCard', { read: ElementRef }) handCards!: QueryList<ElementRef>;
  @ViewChildren('lineContainer', { read: ElementRef }) lineContainers!: QueryList<ElementRef>;
  @ViewChildren('enemyLineContainer', { read: ElementRef }) enemyLineContainers!: QueryList<ElementRef>;
  @ViewChildren('enemyStack', { read: ElementRef }) enemyStack!: QueryList<ElementRef>;

  constructor(private audioService: AudioService) {}

  // Punkty obu graczy
  playerPoints: number = 0;
  enemyPoints: number = 0;

  // Stan gracza
  player: PlayerState = {
    deck: [],
    hand: [],
    lines: { melee: [], ranged: [], aerial: [] },
    graveyard: [],
  };

  // Stan przeciwnika
  enemy: PlayerState = {
    deck: [],
    hand: [],
    lines: { melee: [], ranged: [], aerial: [] },
    graveyard: [],
  };
  
  board: Card[] = [];
  lastPlayedCardId: number | null = null;
  currentRound = 1;

  // Dane do animacji kładzenia karty
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

  // Dostępne linie na planszy
  ALL_CARD_LINES = ALL_CARD_LINES;

  // Wybrana karta i podświetlone linie
  selectedCard: Card | null = null;
  highlightedLines: Set<CardLine> = new Set();

  ngOnInit() {
    this.initializeGame();
  }

  // Inicjalizacja gry (tasowanie i rozdanie kart)
  initializeGame() {
    const fullDeck : Card[] = DECK.map(card => ({ ...card, played: false, basePower: card.power, isDying: false }));

    const playerDeck = shuffleDeck(fullDeck);
    const enemyDeck = shuffleDeck(fullDeck);

    const { drawn: playerHand, remainingDeck: remainingPlayerDeck } = initializeCards(playerDeck, 5);
    const { drawn: enemyHand, remainingDeck: remainingEnemyDeck } = initializeCards(enemyDeck, 5);

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

  /**
   * Główna metoda zagrywania karty na planszę (z animacją).
   * @param card - karta do zagrania
   * @param target - 'player' lub 'enemy' (gdzie karta trafi)
   * @param source - 'player' lub 'enemy' (kto zagrywa kartę)
   */
  playCard(card: Card, target: Player, source: Player) {
    // Usuwanie karty z ręki gracza lub przeciwnika
    if (source === 'player') {
      this.player.hand = this.player.hand.filter(c => c.id !== card.id);
    } else {
      this.enemy.hand = this.enemy.hand.filter(c => c.id !== card.id);
    }

    // Źródło animacji kładzenia karty
    let sourceElem: HTMLElement | null = null;
    if (source === 'player') {
      sourceElem = this.handCards.find(el => el.nativeElement.getAttribute('data-id') == card.id.toString())?.nativeElement;
    } else {
      sourceElem = this.enemyStack.first?.nativeElement;
    }
    if (!sourceElem) return;

    // Linia docelowa dla karty
    const lineIndex = this.ALL_CARD_LINES.indexOf(card.line);
    const containerList = target === 'enemy' ? this.enemyLineContainers : this.lineContainers;
    const lineContainerRef = containerList.toArray()[lineIndex];
    if (!lineContainerRef) return;

    // Element wiersza w danej linii by ustalić pozycję startową
    const cardRowElem = lineContainerRef.nativeElement.querySelector('.card-row') as HTMLElement;
    if (!cardRowElem) return;

    // Pozycja początkowa animacji
    const startRect = sourceElem.getBoundingClientRect();

    // Pozycja końcowa animacji (za ostatnią kartą w linii)
    const cardsInLine = cardRowElem.querySelectorAll('card-component');
    let endLeft: number, endTop: number;

    if (cardsInLine.length === 0) {
      const rowRect = cardRowElem.getBoundingClientRect();
      endLeft = rowRect.right - 30;
      endTop = rowRect.top - 50;
    } else {
      const lastCardRect = (cardsInLine[cardsInLine.length - 1] as HTMLElement).getBoundingClientRect();
      endLeft = lastCardRect.right;
      endTop = lastCardRect.top;
    }

    // Dane do animacji przelatującej karty
    this.flyerCard = card;
    this.isEnemyFlyer = target === 'enemy';

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

    // Animacja przesunięcia karty
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

    // Po zakończeniu animacji: dodaj kartę do planszy, zaktualizuj punkty, obsłuż zdolności
    setTimeout(() => {
      const targetLines = target === 'enemy' ? this.enemy.lines : this.player.lines;
      targetLines[card.line].push({
        ...card,
        played: true,
        roundPlayed: this.currentRound,
      });

      this.applyLineEffects(targetLines[card.line]);

      this.flyerStyle = { ...this.flyerStyle, display: 'none' };
      if(card.ability) this.useCardAbility(card.ability, source, card);
      this.updatePoints();
      this.flyerCard = null;
      this.lastPlayedCardId = card.id;
      setTimeout(() => this.lastPlayedCardId = null, 2000);
    }, 600);
  }

  // Obsluga wyboru karty z ręki gracza
  selectCard(card: Card) {
    if (this.selectedCard?.id === card.id) {
      this.selectedCard = null;
      this.highlightedLines.clear();
      return;
    }
    this.selectedCard = card;
    this.highlightedLines = new Set([card.line]);
  }

  // Obsługa zagrania karty na własną linię
  placeCardOnLine(line: CardLine) {
    if (!this.selectedCard || this.selectedCard.line !== line) return;
    if (this.hasAbility(this.selectedCard,'spy')) return; // Blokada zagrania szpiega na własnej linii
    const card = this.selectedCard;
    this.selectedCard = null;
    this.highlightedLines.clear();
    this.playCard(card, 'player', 'player');
  }

  // Obsługa zagrania karty na linii przeciwnika
  placeCardOnEnemyLine(line: CardLine) {
    if (!this.selectedCard || !this.hasAbility(this.selectedCard,'spy') || this.selectedCard.line !== line) return;
    const card = this.selectedCard;
    this.selectedCard = null;
    this.highlightedLines.clear();
    this.playCard(card, 'enemy', 'player');
  }
  
  // Ruch przeciwnika - zagranie losowej karty z ręki
  playCardByEnemy() {
    if(this.enemy.hand.length === 0) {
      alert("Przeciwnik nie ma kart");
      return;
    }
    const randomEnemyCard = this.enemy.hand[Math.floor(Math.random() * this.enemy.hand.length)];
    if (this.hasAbility(randomEnemyCard, 'spy')) {
      this.playCard(randomEnemyCard, 'player', 'enemy'); // Szpieg przeciwnika na planszy gracza
    } else {
      this.playCard(randomEnemyCard, 'enemy', 'enemy');
    }
  }

  hasAbility(card: VanillaCard | null, abilityType: string): boolean {
    if (!card || !card.ability) return false;
    const abilities = Array.isArray(card.ability)
      ? card.ability
      : card.ability ? [card.ability] : [];

    return abilities.some(ability => ability.type === abilityType);
  }


  // Ikony tła dla linii
  getLineBackgroundIcon(line: CardLine) {
    switch (line) {
      case 'melee': return 'url(/melee.svg)';
      case 'ranged': return 'url(/ranged.svg)';
      case 'aerial': return 'url(/artillery.svg)';
      default: return 'none';
    }
  }


  // Obsługa zdolności karty
  useCardAbility(abilities: CardAbility[] | CardAbility, source: Player,card: Card) {
    const abilityList = Array.isArray(abilities) ? abilities : [abilities];
    for (const ability of abilityList) {
      switch (ability.type) {
        case 'spy':
          this.useSpyAbility(source); // możesz też przekazać ability, jeśli ma dodatkowe dane
          break;
        case 'destroy':
          this.useDestroyAbility(source);
          break;
        default:
          console.warn('Unknown ability:', ability);
      }
    }
  }

  // Zdolność szpiega
  useSpyAbility(source: Player, count: number = 2) {
    const target = source === 'player' ? this.player : this.enemy;
    for (let i = 0; i < count && target.deck.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * target.deck.length);
      const [card] = target.deck.splice(randomIndex, 1);
      if (card) target.hand.push(card);
    }
  }

  // Aktualizacja punktów graczy
  updatePoints() {
    this.playerPoints = Object.values(this.player.lines).reduce(
      (total, lineCards) => total + lineCards.reduce((sum, card) => sum + card.power, 0), 0
    );
    this.enemyPoints = Object.values(this.enemy.lines).reduce(
      (total, lineCards) => total + lineCards.reduce((sum, card) => sum + card.power, 0), 0
    );
  }

  // Nasłuchiwanie efektów kart i aplikowanie ich
  applyLineEffects(line: Card[]) {
    this.checkForBoosts(line);
  }

  // Nasłuchiwanie i aplikowanie kart zwiększających wartość w rzędzie +1
  checkForBoosts(line: Card[]) {
    const boostCount = line.filter(c => this.hasAbility(c,'boost')).length;
    for (const c of line) {
      const effectiveBoosts = boostCount - (this.hasAbility(c,'boost') ? 1 : 0);
      c.power = (c.basePower ?? c.power) + (effectiveBoosts > 0 ? effectiveBoosts : 0);
      if (boostCount === 0) c.power = c.basePower ?? c.power;
    }
  }

  // Niszczenie karty/kart w zwarciu przeciwnika o najwiekszej mocy
  useDestroyAbility(source: Player, condition: number = 10) {
    const target = source === 'player' ? this.enemy : this.player;
    if(target.lines["melee"].length === 0) return;
    const sum = target.lines["melee"].reduce((sum,card) => sum + card.power,0);
    if(sum < condition) return;
    const maxPower = Math.max(...target.lines["melee"].map(c => c.power));
    for (const card of target.lines["melee"]) {
      if (card.power === maxPower) {
        card.isDying = true;
      }
    }
    // Usunięcie kart po animacji
    setTimeout(() => {
      target.lines["melee"] = target.lines["melee"].filter(c => !c.isDying);
      this.updatePoints();
    }, 700);
  }

  // Obliczanie punktów w danej linii dla gracza
  getLinePoints(lineName: CardLine, player: Player): number {
    const target = player === 'player' ? this.player : this.enemy;
    if (!target.lines[lineName]) return 0;
    const cards = target.lines[lineName];
    return cards.reduce((sum, card) => sum + card.power, 0) || 0;
  }

}