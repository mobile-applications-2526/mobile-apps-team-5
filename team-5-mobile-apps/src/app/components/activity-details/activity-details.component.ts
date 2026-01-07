import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { ActivityService } from '../../services/activity.service';
import { SupabaseService } from '../../services/supabase.service';
import { addIcons } from 'ionicons';
import { timeOutline, locationOutline, personCircleOutline, closeOutline, calendarOutline, peopleOutline } from 'ionicons/icons';

@Component({
    selector: 'app-activity-details',
    standalone: true,
    imports: [CommonModule, IonicModule],
    providers: [DatePipe],
    templateUrl: './activity-details.component.html',
    styleUrls: ['./activity-details.component.scss'],
})
export class ActivityDetailsComponent implements OnInit {
    @Input() activity: any;

    participants: any[] = [];
    creator: any = null;
    loading = true;

    constructor(
        private modalCtrl: ModalController,
        private activityService: ActivityService,
        private supabase: SupabaseService
    ) {
        addIcons({ timeOutline, locationOutline, personCircleOutline, closeOutline, calendarOutline, peopleOutline });
    }

    async ngOnInit() {
        if (this.activity) {
            try {
                const [fullActivity, parts, creatorRes] = await Promise.all([
                    this.activityService.getActivityById(this.activity.id),
                    this.activityService.getActivityParticipants(this.activity.id),
                    this.activity.creator_id
                        ? this.supabase.client.from('profiles').select('*').eq('id', this.activity.creator_id).single()
                        : Promise.resolve({ data: null })
                ]);

                if (fullActivity) {
                    this.activity = { ...this.activity, ...fullActivity };
                }

                this.participants = parts;
                this.creator = creatorRes.data;
            } catch (e) {
                console.error('Error loading details', e);
            } finally {
                this.loading = false;
            }
        }
    }

    close() {
        this.modalCtrl.dismiss();
    }
}
