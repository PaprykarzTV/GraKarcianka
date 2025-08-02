import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavBarComponent } from "../shared/components/nav-bar/nav-bar.component";
import { DECK } from '../shared/data/cards';
import { VanillaCard } from '../shared/models/card';
import { CardComponent } from '../shared/components/card-component/card-component.component';

@Component({
  selector: 'collection-page',
  imports: [NavBarComponent, CommonModule,CardComponent],
  templateUrl: './collection-page.component.html',
  styleUrl: './collection-page.component.css'
})
export class CollectionPageComponent {
  deck: VanillaCard[] = DECK;
}
