import {
  Component,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
  HostListener,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import gsap from 'gsap';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../../shared/components/card-component/card-component.component';
import { Card } from '../../card-game-types';

@Component({
  selector: 'mulligan-component',
  standalone: true,
  imports: [CardComponent, CommonModule],
  templateUrl: './mulligan.component.html',
  styleUrls: ['./mulligan.component.css'],
})
export class MulliganComponent implements AfterViewInit {
  
  @ViewChildren('cardElements') cardElements!: QueryList<ElementRef>;
  @Input() hand: Card[] = [];
  @Input() deck: Card[] = [];
  @Output() finalState = new EventEmitter<Card[]>();

  visibleAround = 2; // 2 po każdej stronie + 1 środkowa = 5 kart
  currentIndex: number = 0;

  selectedIndexes: Set<number> = new Set();
  MAX_CHANGES = 2;
  changesCount = 0;
  private shouldAnimate = false;

  get visibleCards(): { card: Card; index: number; positionOffset: number }[] {
    const count = this.hand.length;
    const visibleCount = 5;
    const half = Math.floor(visibleCount / 2);

    const cards = [];
    for (let i = -half; i <= half; i++) {
      let idx = (this.currentIndex + i + count) % count;
      cards.push({ card: this.hand[idx], index: idx, positionOffset: i });
    }
    return cards;
  }

  ngAfterViewInit() {
    this.shouldAnimate = true;
  }

  ngAfterViewChecked() {
    if (this.shouldAnimate) {
      this.shouldAnimate = false;
      this.animateCards();
    }
  }

  previousCard() {
    this.currentIndex = (this.currentIndex - 1 + this.hand.length) % this.hand.length;
    this.shouldAnimate = true;
  }

  nextCard() {
    this.currentIndex = (this.currentIndex + 1) % this.hand.length;
    this.shouldAnimate = true;
  }

  setCurrentIndex(index: number) {
    this.currentIndex = index;
    this.shouldAnimate = true;
  }

  animateCards() {
    if (!this.cardElements || this.cardElements.length === 0) return;

    const cards = this.cardElements.toArray();
    const offsetX = 50;

    cards.forEach((cardRef, i) => {
      const el = cardRef.nativeElement;
      const offset = this.visibleCards[i].positionOffset;

      gsap.to(el, {
        duration: 1,
        x: offset * offsetX,
        y: offset === 0 ? -20 : 0,
        scale: offset === 0 ? 1.4 : 1,
        autoAlpha: 1,
        ease: 'power3.out',
        pointerEvents: 'auto',
        zIndex: offset === 0 ? 10 : 1,
      });
    });
  }

  changeCard(index: number) {
    if (this.changesCount >= this.MAX_CHANGES) return this.confirmSelection();
    // Oddaj starą kartę z ręki do talii
    const returnedCard = this.hand[index];
    this.deck.push(returnedCard);

    // Wylosuj nową kartę z decku (bez powtórzeń)
    const newCard = this.drawRandomCardFromDeck();

    // Zamień kartę w ręce
    this.hand[index] = newCard;
    this.changesCount++;
  }

  drawRandomCardFromDeck(): Card {
    const index = Math.floor(Math.random() * this.deck.length);
    return this.deck.splice(index, 1)[0]; // usuń z decku i zwróć
  }

  generateNewCard(): Card {
    const randomIndex = Math.floor(Math.random() * this.deck.length);
    const newCard = { ...this.deck[randomIndex] };

    return newCard;
  }

  confirmSelection() {
    this.finalState.emit(this.hand);
  }

  trackByIndex(index: number, item: any) {
    return item.index;
  }

  @HostListener('document:keydown.arrowright', ['$event'])
  handleRight(e: KeyboardEvent) {
    e.preventDefault(); // blokujemy domyślne przewijanie strony
    this.nextCard();
  }

  @HostListener('document:keydown.arrowleft', ['$event'])
  handleLeft(e: KeyboardEvent) {
    e.preventDefault();
    this.previousCard();
  }

  @HostListener('document:keydown.enter', ['$event'])
  handleEnter(e: KeyboardEvent) {
    e.preventDefault();
    this.changeCard(this.currentIndex);
  }

  @HostListener('document:keydown.escape', ['$event'])
  cancelMulligan(e: KeyboardEvent) {
    e.preventDefault();
    this.confirmSelection();
  }

}
