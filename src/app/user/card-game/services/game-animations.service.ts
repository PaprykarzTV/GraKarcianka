import { ElementRef, Injectable, QueryList } from "@angular/core";
import { AudioService } from "../../../utils/audio.service";
import { Observable } from "rxjs";
import gsap from "gsap";

@Injectable({
  providedIn: 'root'
})
export class CardGameAnimationsService {

    constructor(private audioService: AudioService) {}

    animateCardPlacement(
        flyerEl: HTMLElement,
        startRect: DOMRect,
        endLeft: number,
        endTop: number
    ): Observable<void> {
        return new Observable(observer => {
            gsap.set(flyerEl, {
            top: startRect.top,
            left: startRect.left,
            width: startRect.width,
            height: startRect.height,
            position: 'fixed',
            opacity: 1,
            scale: 1,
            zIndex: 1000,
            });

            this.audioService.play("/cardPlaceSound.wav", 0.4);

            const dx = endLeft - startRect.left;
            const dy = endTop - startRect.top;

            gsap.to(flyerEl, {
            x: dx,
            y: dy,
            scale: 1.1,
            visibility: 'visible',
            duration: 0.7,
            ease: 'power2.out',
            onComplete: () => {
                observer.next();
                observer.complete();
            }
            });

            
        });
    }

    animateCardFromStackToHand(
        stackEl: HTMLElement,
        handCardsRefs: QueryList<ElementRef>,
        cardId: string
    ): Observable<void> {
    return new Observable<void>(subscriber => {
        // Upewniamy się, że DOM już zawiera elementy
        const targetRef = handCardsRefs.find(
        ref => ref?.nativeElement?.getAttribute('data-id') === cardId
        );

        if (!stackEl || !targetRef) {
        console.warn('[DEBUG] Nie znaleziono elementu w ręce dla karty:', cardId);
        subscriber.complete();
        return;
        }

        const targetCardEl = targetRef.nativeElement;
        const stackRect = stackEl.getBoundingClientRect();
        const targetRect = targetCardEl.getBoundingClientRect();

        const ghost = targetCardEl.cloneNode(true) as HTMLElement;
        ghost.classList.remove('opacity-0');
        ghost.style.position = 'fixed';
        ghost.style.display = 'block';
        ghost.style.opacity = '1';
        ghost.style.visibility = 'visible';
        ghost.style.left = `${stackRect.left}px`;
        ghost.style.top = `${stackRect.top}px`;
        ghost.style.width = `${stackRect.width}px`;
        ghost.style.height = `${stackRect.height}px`;
        ghost.style.zIndex = '9999';
        ghost.style.pointerEvents = 'none';

        document.body.appendChild(ghost);

        gsap.to(ghost, {
        x: targetRect.left - stackRect.left,
        y: targetRect.top - stackRect.top,
        width: targetRect.width,
        height: targetRect.height,
        duration: 1,
        ease: 'power2.out',
        onComplete: () => {
            ghost.remove();
            subscriber.next();
            subscriber.complete();
        }
        });

        return () => {
        gsap.killTweensOf(ghost);
        ghost.remove();
        subscriber.complete();
        };
    });
    }

}