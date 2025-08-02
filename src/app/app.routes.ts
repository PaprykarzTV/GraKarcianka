import { Routes } from '@angular/router';
import { LandingPageComponent } from './user/landing-page/landing-page.component';
import { CardGameComponent } from './user/card-game/components/card-game/card-game.component';
import { CollectionPageComponent } from './user/collection-page/collection-page.component';

export const routes: Routes = [
    {
        path: "",
        component: LandingPageComponent
    },
    {
        path: "game",
        component: CardGameComponent
    },
    {
        path: "collection",
        component: CollectionPageComponent
    }
];
