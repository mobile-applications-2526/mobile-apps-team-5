import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { menu, settings, checkmarkCircle, closeCircle, close, star, heart, chatbubbles, personAdd, create, chevronBack, calendarOutline, peopleOutline, locationOutline, peopleCircle, starOutline } from 'ionicons/icons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});

// Register commonly used ionicons globally so <ion-icon name="..."> works in standalone components
addIcons({ menu, settings, checkmarkCircle, closeCircle, close, star, heart, chatbubbles, personAdd, create, chevronBack, calendarOutline, peopleOutline, locationOutline, peopleCircle, starOutline });
