import { ChangeDetectorRef, ElementRef, Injectable, QueryList } from "@angular/core";
import { ALL_CARD_LINES, Card, Player, PlayerState } from "../card-game-types";
import { CardAbility, CardLine, VanillaCard } from "../../shared/models/card";
import { DECK } from "../../shared/data/cards";
import { CardGameAnimationsService } from "./game-animations.service";
import { gsap } from "gsap";
import { Subject } from "rxjs";
import { nextTick } from "../../../utils/utilMethods";

@Injectable({
  providedIn: 'root'
})
export class CardGameService {

  constructor(
    private animationService: CardGameAnimationsService
  ) {}
  // Punkty obu graczy
  playerPoints: number = 0;
  enemyPoints: number = 0;

  // Stan gracza
  player: PlayerState = {
    deck: [],
    hand: [],
    lines: { melee: [], ranged: [], siege: [] },
    graveyard: [],
  };
  
  // Punkty linii do animacji
  animatedLinePoints: Record<'player' | 'enemy', Record<CardLine, number>> = {
    player: { melee: 0, ranged: 0, siege: 0 },
    enemy: { melee: 0, ranged: 0, siege: 0 }
  };
  
  // Stan przeciwnika
  enemy: PlayerState = {
    deck: [],
    hand: [],
    lines: { melee: [], ranged: [], siege: [] },
    graveyard: [],
  };
  
  showMulligan: boolean = false;
  showHand: boolean = false;
  board: Card[] = [];
  lastPlayedCardId: number | null = null;
  currentRound = 1;

  // Dane do animacji kładzenia karty
  flyerCard: Card | null = null;

  // Dostępne linie na planszy
  ALL_CARD_LINES = ALL_CARD_LINES;

  // Wybrana karta i podświetlone linie
  selectedCard: Card | null = null;
  highlightedLines: Set<CardLine> = new Set();
  
  // Tasowanie talii
  shuffleDeck(deck: Card[]): Card[] {
    const array = [...deck];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Inicjalizacja kart z talii dzieląc na karty do zagrania i pozostałe w talii
  initializeCards(deck: Card[], count: number): { drawn: Card[]; remainingDeck: Card[] } {
    const drawn = deck.slice(0, count);
    const remainingDeck = deck.slice(count);
    return { drawn, remainingDeck };
  }

  // Sprawdzenie, czy karta ma daną zdolność
  hasAbility(card: VanillaCard | null, abilityType: string): boolean {
    if (!card || !card.ability) return false;
    const abilities = Array.isArray(card.ability)
      ? card.ability
      : card.ability ? [card.ability] : [];

    return abilities.some(ability => ability.type === abilityType);
  }

  // Pobranie opisu zdolności karty
  getAbilityDescription(ability: CardAbility): string {
    switch (ability.type) {
      case 'medic':
        return 'Przywraca jedną jednostkę z cmentarza.';
      case 'destroy':
        return 'Niszczy najsilniejszą jednostkę przeciwnika.';
      case 'spy':
        return 'Zagrywana po stronie wroga, ale daje dodatkowe karty.';
      case 'boost':
        return `Zwiększa siłę sąsiadujących jednostek o ${ability.value}.`;
      case 'summon':
        return `Przywołuje jednostki: ${ability.units.join(', ')}.`;
      case 'synergy':
        return `Zyskuje bonus za każdą kartę z tagiem "${ability.tag}".`;
      default:
        return '';
    }
  }

  // Pobranie wszystkich opisów zdolności karty
  getAllAbilityDescriptions(abilities: CardAbility | CardAbility[]): string[] {
    if (Array.isArray(abilities)) {
      return abilities.map(a => this.getAbilityDescription(a));
    }
    return [this.getAbilityDescription(abilities)];
  }

  // Przygotowanie talii do gry (ustawienie domyślnych wartości dla kart)
  prepareDeck(deck: VanillaCard[]): Card[] {
    return deck.map(card => ({
      ...card,
      played: false,
      basePower: card.power,
      isDying: false,
    }));
  }


  // Inicjalizacja gry (tasowanie i rozdanie kart)
  initializeGame() {
    const fullDeck: Card[] = this.prepareDeck(DECK);

    const playerDeck = this.shuffleDeck(fullDeck);
    const enemyDeck = this.shuffleDeck(fullDeck);

    const { drawn: playerHand, remainingDeck: remainingPlayerDeck } = this.initializeCards(playerDeck, 8);
    const { drawn: enemyHand, remainingDeck: remainingEnemyDeck } = this.initializeCards(enemyDeck, 8);

    this.player = {
      deck: remainingPlayerDeck,
      hand: playerHand,
      lines: { melee: [], ranged: [], siege: [] },
      graveyard: [],
    };

    this.enemy = {
      deck: remainingEnemyDeck,
      hand: enemyHand,
      lines: { melee: [], ranged: [], siege: [] },
      graveyard: [],
    };


    gsap.fromTo('.mulligan-wrapper',
      { opacity: 0.3, scale: 0.9, y: -1200 },
      { opacity: 1, scale: 1, duration: 1, ease: 'power2.out', y: 0 }
    );
    this.showMulligan = true;
  }
  
  /**
   * Główna metoda zagrywania karty na planszę (z animacją).
   * @param card - karta do zagrania
   * @param target - 'player' lub 'enemy' (gdzie karta trafi)
   * @param source - 'player' lub 'enemy' (kto zagrywa kartę)
   * @param handCardsRef - referencje do kart na ręce gracza
   * @param enemyStackRef - referencje do stosu kart przeciwnika
   * @param lineContainersRef - referencje do kontenerów linii gracza
   * @param enemyLineContainersRef - referencje do kontenerów linii przeciwnika
   * @param flyerRef - referencje do elementu flyer (animowanej karty)
  */
 async placeCard(
   card: Card,
   target: Player,
   source: Player,
   handCardsRef: QueryList<ElementRef>,
   lineContainersRef: QueryList<ElementRef>,
   enemyLineContainersRef: QueryList<ElementRef>,
   enemyStackRef: ElementRef,
   flyerRef: ElementRef
  ) {
    this.flyerCard = card;
    // Usuwanie karty z ręki gracza lub przeciwnika
    if (source === 'player') {
      this.player.hand = this.player.hand.filter(c => c.id !== card.id);
    } else {
      this.enemy.hand = this.enemy.hand.filter(c => c.id !== card.id);
    }
    
    // Źródło animacji kładzenia karty
    let sourceElem: HTMLElement | null = null;
    if (source === 'player') {
      sourceElem = handCardsRef.find(el => el.nativeElement.getAttribute('data-id') === card.id.toString())?.nativeElement ?? null;
    } else {
      sourceElem = enemyStackRef.nativeElement ?? null;
    }
    if (!sourceElem) {
      console.warn('Nie znaleziono elementu źródła animacji');
      return;
    }

    // Linia docelowa dla karty
    const lineIndex = this.ALL_CARD_LINES.indexOf(card.line);
    const containerList = target === 'enemy' ? enemyLineContainersRef : lineContainersRef;
    const lineContainerRef = containerList.toArray()[lineIndex];
    if (!lineContainerRef) {
      console.warn('Nie znaleziono kontenera linii docelowej');
      return;
    }

    // Element wiersza w danej linii by ustalić pozycję startową
    const cardRowElem = lineContainerRef.nativeElement.querySelector('.card-row') as HTMLElement;
    if (!cardRowElem) {
      console.warn('Nie znaleziono elementu .card-row w linii');
      return;
    }

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

    // Animacja kładzenia karty
    setTimeout(() => {
      if (!flyerRef || !flyerRef.nativeElement) {
        console.warn('Nie znaleziono elementu flyer do animacji');
        return;
      }
      const flyerEl = flyerRef.nativeElement as HTMLElement;

      // Wywołanie animacji przez serwis animacji
      this.animationService.animateCardPlacement(flyerEl, startRect, endLeft, endTop)
        .subscribe(() => {
          // Callback po zakończeniu animacji
          setTimeout(() => {
          this.flyerCard = null;

          // Dodanie karty do linii docelowej
          const targetLines = target === 'enemy' ? this.enemy.lines : this.player.lines;
          targetLines[card.line].push({
            ...card,
            played: true,
            roundPlayed: this.currentRound,
          });

          // Zastosuj efekty linii, np. boosty, zniszczenia
          this.applyLineEffects(targetLines[card.line]);

          // Usuń flyer (element animowany)
          this.flyerCard = null;

          // Jeśli karta ma zdolność, użycie jej
          if (card.ability) this.useCardAbility(card.ability, source, card);

          // Aktualizacja punktów graczy
          this.updatePoints();

          // Animacja punktów linii 
          this.lastPlayedCardId = card.id;
          this.animateLinePoints(card.line, source);
        }, 100); // Opóźnienie na zakończenie animacji
          setTimeout(() => this.lastPlayedCardId = null, 100);
        });
    },10);
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

  // Przygotowanie karty do zagrania (Potrzebne do animacji)
  async prepareCardForPlacement(card?: Card): Promise<Card | null> {
    const cardForPrepare = card  ?? this.selectedCard;
    if (!cardForPrepare) return null;

    this.selectedCard = null;
    this.highlightedLines.clear();
    this.flyerCard = cardForPrepare;
    await nextTick(); // zapewnia, że flyerRef będzie dostępny
    return cardForPrepare;
  }

  // Ruch przeciwnika - zagranie losowej karty z ręki
  async playCardByEnemy(
    handCardsRef: QueryList<ElementRef>,
    enemyLineContainersRef: QueryList<ElementRef>,
    lineContainersRef: QueryList<ElementRef>,
    enemyStackRef: ElementRef,
    flyerRef: ElementRef
  ) {
    if (this.enemy.hand.length === 0) {
      alert("Przeciwnik nie ma kart");
      return;
    }

    const target = this.hasAbility(this.flyerCard, 'spy') ? 'player' : 'enemy';

    this.placeCard(
      this.flyerCard!,
      target,
      'enemy',
      handCardsRef,
      lineContainersRef,
      enemyLineContainersRef,
      enemyStackRef,
      flyerRef
    );
  }

  // Ikony tła dla linii
  getLineBackgroundIcon(line: CardLine) {
    switch (line) {
      case 'melee': return 'url(/melee.svg)';
      case 'ranged': return 'url(/ranged.svg)';
      case 'siege': return 'url(/artillery.svg)';
      default: return 'none';
    }
  }

  // Obsługa zdolności karty
  useCardAbility(abilities: CardAbility[] | CardAbility, source: Player, card: Card) {
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

  // Nasłuchiwanie efektów kart i aplikowanie ich
  applyLineEffects(line: Card[]) {
    this.checkForBoosts(line);
  }

  // Nasłuchiwanie i aplikowanie kart zwiększających wartość w rzędzie +1
  checkForBoosts(line: Card[]) {
    const boostCount = line.filter(c => this.hasAbility(c, 'boost')).length;
    for (const c of line) {
      const effectiveBoosts = boostCount - (this.hasAbility(c, 'boost') ? 1 : 0);
      c.power = (c.basePower ?? c.power) + (effectiveBoosts > 0 ? effectiveBoosts : 0);
      if (boostCount === 0) c.power = c.basePower ?? c.power;
    }
  }

  // Niszczenie karty/kart w zwarciu przeciwnika o najwiekszej mocy
  useDestroyAbility(source: Player, condition: number = 10) {
    const target = source === 'player' ? this.enemy : this.player;
    if (target.lines["melee"].length === 0) return;
    const sum = target.lines["melee"].reduce((sum, card) => sum + card.power, 0);
    if (sum < condition) return;
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

  // Aktualizacja punktów graczy
  updatePoints() {
    this.playerPoints = Object.values(this.player.lines).reduce(
      (total, lineCards) => total + lineCards.reduce((sum, card) => sum + card.power, 0), 0
    );
    this.enemyPoints = Object.values(this.enemy.lines).reduce(
      (total, lineCards) => total + lineCards.reduce((sum, card) => sum + card.power, 0), 0
    );
  }

  // Animacja punktów linii
  animateLinePoints(line: CardLine, player: Player) {
    const newValue = this.getLinePoints(line, player);
    gsap.to(this.animatedLinePoints[player], {
      [line]: newValue,
      duration: 0.4,
      ease: 'power2.out',
      snap: {
        [line]: 1  // 1 = zaokrąglenie do najbliższej liczby całkowitej
      }
    });
  }

}

