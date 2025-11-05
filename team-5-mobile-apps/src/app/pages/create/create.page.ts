import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/Header/header.componet';
import { CreateEventFormComponent } from '../../components/create-event-form/create-event-form.component';

@Component({
  selector: 'app-create',
  standalone: true,
  templateUrl: 'create.page.html',
  styleUrls: ['create.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, HeaderComponent, CreateEventFormComponent],
})
export class CreatePage {
  constructor() {}
}
