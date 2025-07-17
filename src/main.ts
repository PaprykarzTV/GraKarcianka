import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { CardGameComponent } from './app/app.component';

bootstrapApplication(CardGameComponent, appConfig)
  .catch((err) => console.error(err));
