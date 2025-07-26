import { Component } from '@angular/core';
import { NavBarComponent } from "../../nav-bar/nav-bar.component";
import { CardComponent } from "../../card-component/card-component.component";
import { CommonModule } from '@angular/common';
import { DECK, VanillaCard } from '../../game.service';

@Component({
  selector: 'collection-page',
  imports: [NavBarComponent, CardComponent, CommonModule],
  templateUrl: './collection-page.component.html',
  styleUrl: './collection-page.component.css'
})
export class CollectionPageComponent {
  deck: VanillaCard[] = DECK;
}
