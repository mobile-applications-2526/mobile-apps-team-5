import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-confirm-participation-modal',
  templateUrl: './confirm-participation-modal.component.html',
  styleUrls: ['./confirm-participation-modal.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class ConfirmParticipationModalComponent {
  @Input() eventName!: string;

  constructor(private modalCtrl: ModalController) {}

  close() {
    this.modalCtrl.dismiss('later');
  }

  confirm() {
    this.modalCtrl.dismiss('confirm');
  }

  decline() {
    this.modalCtrl.dismiss('decline');
  }
}
