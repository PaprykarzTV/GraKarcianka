import { ChangeDetectorRef, Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavBarComponent } from "../../../shared/components/nav-bar/nav-bar.component";
import { MulliganComponent } from '../mulligan/mulligan.component';
import { CardGameService,  } from '../../services/game-main.service';
import { CardLine } from '../../../shared/models/card';
import { CardComponent } from '../../../shared/components/card-component/card-component.component';
import { forkJoin } from 'rxjs';
import { CardGameAnimationsService } from '../../services/game-animations.service';
import { Card, Player } from '../../card-game-types';
import { nextTick } from '../../../../utils/utilMethods';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CardComponent, NavBarComponent, MulliganComponent],
  templateUrl: './card-game.component.html',
  styleUrls: ['./card-game.component.css'],
})
export class CardGameComponent {
  @ViewChildren('handCard', { read: ElementRef }) handCardsRef!: QueryList<ElementRef>;
  @ViewChildren('lineContainer', { read: ElementRef }) lineContainersRef!: QueryList<ElementRef>;
  @ViewChildren('enemyLineContainer', { read: ElementRef }) enemyLineContainersRef!: QueryList<ElementRef>;
  @ViewChild('enemyStack', { read: ElementRef }) enemyStackRef!: ElementRef;
  @ViewChild('flyer', { static: false }) flyerRef!: ElementRef;
  @ViewChild('playerStack', { read: ElementRef }) playerStackRef!: ElementRef;

  constructor(
    protected gameService: CardGameService,
    private animationService: CardGameAnimationsService,
    private cd: ChangeDetectorRef
  ) { }

  trackByCardId(index: number, card: Card): number {
    return card.id;
  }
  
  ngOnInit() {
    this.gameService.initializeGame();
  }

  ngAfterViewChecked() {
  if (this.flyerRef && this.gameService.flyerCard) {
      const flyerEl = this.flyerRef.nativeElement as HTMLElement;
      // tu wykonujesz animację, np. gsap lub manipulacje stylem
    }
  }

  getAnimationElements(card: Card, source: Player, target: Player) {
    let sourceElem: HTMLElement | null = null;
    if (source === 'player') {
      sourceElem = this.handCardsRef.find(el => el.nativeElement.getAttribute('data-id') === card.id.toString())?.nativeElement ?? null;
    } else {
      sourceElem = this.enemyStackRef.nativeElement ?? null;
    }
    if (!sourceElem) return null;

    const ALL_CARD_LINES = ['close', 'ranged', 'siege']; // przykładowo
    const lineIndex = ALL_CARD_LINES.indexOf(card.line);
    const containerList = target === 'enemy' ? this.enemyLineContainersRef : this.lineContainersRef;
    const lineContainerRef = containerList.toArray()[lineIndex];
    if (!lineContainerRef) return null;

    const cardRowElem = lineContainerRef.nativeElement.querySelector('.card-row') as HTMLElement;
    if (!cardRowElem) return null;

    return { sourceElem, targetElem: cardRowElem };
  }

  async onMulliganDone(newHand: Card[]) {
    this.gameService.player.hand = newHand;
    this.gameService.showMulligan = false;

    const stackEl = this.playerStackRef.nativeElement;

    const animations$ = newHand.map(card => 
      this.animationService.animateCardFromStackToHand(stackEl, this.handCardsRef, card.id.toString())
    );

    await forkJoin(animations$).toPromise();

    this.gameService.showHand = true;
  }

  async playCardByEnemy() {
    const card = this.gameService.enemy.hand[Math.floor(Math.random() * this.gameService.enemy.hand.length)];
    if (!card) return;

    // Tutaj była logika z gameService.prepareCardForPlacement, ale były problemy z dostępnością flyerRef
    this.gameService.selectedCard = null;
    this.gameService.highlightedLines.clear();
    this.gameService.flyerCard = card;
    await nextTick(); // zapewnia, że flyerRef będzie dostępny

    this.gameService.playCardByEnemy(
      this.handCardsRef,
      this.enemyLineContainersRef,
      this.lineContainersRef,
      this.enemyStackRef,
      this.flyerRef
    );
  }

  async placeCardOnLine(line: CardLine) {
    if (!this.gameService.selectedCard || this.gameService.selectedCard.line !== line) return;
    if (this.gameService.hasAbility(this.gameService.selectedCard, 'spy')) return; // Nie można zagrać szpiega na własnej linii

    const card = await this.gameService.prepareCardForPlacement();
    if (!card) return;
    this.gameService.placeCard(
      card,
      'player',
      'player',
      this.handCardsRef,
      this.lineContainersRef,
      this.enemyLineContainersRef,
      this.enemyStackRef,
      this.flyerRef
    );
  }

  async placeCardOnEnemyLine(line: CardLine) {
    if (!this.gameService.selectedCard || !this.gameService.hasAbility(this.gameService.selectedCard, 'spy') || this.gameService.selectedCard.line !== line) return;

    const card = await this.gameService.prepareCardForPlacement();
    if (!card) return;
    this.gameService.placeCard(
      card,
      'enemy',
      'player',
      this.handCardsRef,
      this.lineContainersRef,
      this.enemyLineContainersRef,
      this.enemyStackRef,
      this.flyerRef
    );
  }


}