import { Routes } from '@angular/router';
import { LandingPageComponent } from './Pages/landing-page/landing-page.component';
import { CardGameComponent } from './app.component';
import { CollectionPageComponent } from './Pages/collection-page/collection-page.component';

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
