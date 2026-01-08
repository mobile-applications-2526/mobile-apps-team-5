import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { UpdatesStore, UpdateItem } from '../../store/updates.store';
import { addIcons } from 'ionicons';
import { personAdd, chatbubbles, time, flame, closeCircle, checkmarkCircle, checkmarkDoneCircle } from 'ionicons/icons';
import { ActivityService } from '../../services/activity.service';
import { ConfirmParticipationModalComponent } from '../../confirm-participation-modal/confirm-participation-modal.component';

@Component({
  selector: 'app-updates-list',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './updates-list.component.html',
  styleUrls: ['./updates-list.component.scss'],
})
export class UpdatesListComponent implements OnInit, OnDestroy {
  items: UpdateItem[] = [];
  sub?: Subscription;

  constructor(
    private store: UpdatesStore,
    private router: Router,
    private alertCtrl: AlertController,
    private activityService: ActivityService,
    private modalCtrl: ModalController
  ) {
    addIcons({ personAdd, chatbubbles, time, flame, closeCircle, checkmarkCircle, checkmarkDoneCircle });
  }

  ngOnInit() {
    this.sub = this.store.updates$.subscribe((s) => (this.items = s));
    this.store.loadUpdates();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  async handleItemClick(item: UpdateItem) {
    if (item.type === 'MESSAGE') {
      this.router.navigate(['/chats', item.data.roomId]);
    } else if (item.type === 'FRIEND_REQUEST') {
      this.router.navigate(['/tabs/friends'], { queryParams: { segment: 'add' } });
    } else if (item.type === 'EVENT_REMINDER' || item.type === 'EVENT_POPULAR') {
      this.router.navigate(['/tabs/saved']);
    } else if (item.type === 'ACTIVITY_CONFIRMATION') {
      let eventName = '';
    try {
      const activity = await this.activityService.getActivityById(item.data.activityId);
      eventName = activity?.name ?? 'Confirm Participation';
    } catch (e) {
      eventName = 'Confirm Participation';
    }
 
      const modal = await this.modalCtrl.create({
        component: ConfirmParticipationModalComponent,
        componentProps: {
          eventName: eventName
        },
        cssClass: 'confirm-popup',
        breakpoints: [0, 0.40],
        initialBreakpoint: 0.40,
        backdropDismiss: true
      });
      await modal.present();


const { data } = await modal.onWillDismiss();

if (data === 'decline') {
  await this.activityService.removeSavedActivity(item.data.activityId);
  this.store.loadUpdates();
}

if (data === 'confirm') {
  await this.activityService.confirmActivityParticipation(item.data.activityId);
  this.store.loadUpdates();
}
    }
  }

  trackById(_: number, item: UpdateItem) {
    return item.id;
  }
}
