import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/Header/header.componet';
import { UpdatesListComponent } from '../../components/updates-list/updates-list.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-updates',
  standalone: true,
  templateUrl: 'updates.page.html',
  styleUrls: ['updates.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, HeaderComponent, UpdatesListComponent],
})
export class UpdatesPage {
  constructor() {}
}
