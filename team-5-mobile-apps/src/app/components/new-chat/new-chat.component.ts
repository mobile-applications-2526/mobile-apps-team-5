import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase.service';
import { Observable } from 'rxjs'; // Import Observable

interface Friend {
    id: string;
    name: string;
    avatarUrl?: string;
    selected?: boolean;
}

@Component({
    selector: 'app-new-chat',
    standalone: true, // Mark as standalone
    imports: [CommonModule, FormsModule, IonicModule],
    templateUrl: './new-chat.component.html',
    styleUrls: ['./new-chat.component.scss'],
})
export class NewChatComponent implements OnInit {
    friends: Friend[] = [];
    groupName = '';
    loading = false;

    constructor(
        private modalCtrl: ModalController,
        private supabase: SupabaseService
    ) { }

    async ngOnInit() {
        this.loading = true;
        const profiles = await this.supabase.getFriends();
        this.friends = profiles.map((p: any) => ({
            id: p.id,
            name: p.full_name || p.username,
            avatarUrl: p.avatar_url,
            selected: false
        }));
        this.loading = false;
    }

    async createChat() {
        const selected = this.friends.filter(f => f.selected);
        if (selected.length === 0) return;

        if (selected.length === 1 && !this.groupName) {
            try {
                this.loading = true;
                const roomId = await this.supabase.startDirectChat(selected[0].id);
                this.modalCtrl.dismiss({ roomId });
            } catch (e) {
                console.error(e);
            } finally {
                this.loading = false;
            }
        } else {
            const name = this.groupName || selected.map(f => f.name).join(', ').slice(0, 30);
            try {
                this.loading = true;
                const roomId = await this.supabase.createGroupChat(name, selected.map(f => f.id));
                this.modalCtrl.dismiss({ roomId });
            } catch (e) {
                console.error(e);
            } finally {
                this.loading = false;
            }
        }
    }

    close() {
        this.modalCtrl.dismiss();
    }
}
