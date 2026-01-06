import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { UpdatesStore, UpdateItem } from '../../store/updates.store';
import { addIcons } from 'ionicons';
import { personAdd, chatbubbles, time, flame, closeCircle, checkmarkCircle } from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase.service';

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
    private supabase: SupabaseService
  ) {
    addIcons({ personAdd, chatbubbles, time, flame, closeCircle, checkmarkCircle });
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
      const alert = await this.alertCtrl.create({
        header: 'Confirm Participation',
        message: 'Do you want to confirm your participation? This will add you to the group chat if enough people conform.',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Confirm',
            handler: async () => {
              try {
                await this.supabase.confirmActivityParticipation(item.data.activityId);
                this.store.loadUpdates();
              } catch (e) {
                console.error('Error confirming:', e);
              }
            }
          }
        ]
      });
      await alert.present();
    }
  }

  trackById(_: number, item: UpdateItem) {
    return item.id;
  }
}
