import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavBarComponent } from "../shared/components/nav-bar/nav-bar.component";
import { DECK, VanillaCard } from '../../user/card-game/services/game-main.service';
import { CardComponent } from '../../Components/card-component/card-component.component';

@Component({
  selector: 'collection-page',
  imports: [NavBarComponent, CardComponent, CommonModule],
  templateUrl: './collection-page.component.html',
  styleUrl: './collection-page.component.css'
})
export class CollectionPageComponent {
  deck: VanillaCard[] = DECK;
}
