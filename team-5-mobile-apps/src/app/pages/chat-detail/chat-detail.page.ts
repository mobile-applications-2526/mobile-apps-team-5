import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonContent, IonHeader, IonToolbar, IonButtons,
    IonBackButton, IonTitle, IonFooter, IonInput, IonButton, IonIcon
} from '@ionic/angular/standalone';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { addIcons } from 'ionicons';
import { send } from 'ionicons/icons';

@Component({
    selector: 'app-chat-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        IonContent, IonHeader, IonToolbar, IonButtons,
        IonBackButton, IonTitle, IonFooter, IonInput, IonButton, IonIcon
    ],
    templateUrl: './chat-detail.page.html',
    styleUrls: ['./chat-detail.page.scss'],
})
export class ChatDetailPage implements OnInit {
    @ViewChild(IonContent) content!: IonContent;

    roomId: string = '';
    messages: any[] = []; // Type should be defined
    newMessage = '';
    roomName = 'Chat';

    currentUserId: string = '';

    constructor(
        private route: ActivatedRoute,
        private supabase: SupabaseService
    ) {
        addIcons({ send });
    }

    async ngOnInit() {
        const user = await this.supabase.getCurrentUser();
        this.currentUserId = user?.id || '';

        this.roomId = this.route.snapshot.paramMap.get('id') || '';
        if (this.roomId) {
            await this.supabase.markRoomRead(this.roomId);
            this.messages = await this.supabase.getMessages(this.roomId);
            this.scrollToBottom();

            // Determine room name? We might need a method to get single room details or infer from messages?
            // For now, simpler: SupabaseService.getChatRooms() fetches all rooms. 
            // We could filter from that cache if we had a store for it, or fetch single.
            // Let's just fetch messages for now.
        }
    }

    async sendMessage() {
        if (!this.newMessage.trim()) return;
        const msg = this.newMessage;
        this.newMessage = '';

        try {
            await this.supabase.sendMessage(this.roomId, msg);
            // Optimistic update or refetch
            this.messages = await this.supabase.getMessages(this.roomId);
            this.scrollToBottom();
        } catch (error) {
            console.error('Failed to send', error);
            this.newMessage = msg; // Restore
        }
    }

    scrollToBottom() {
        setTimeout(() => this.content.scrollToBottom(300), 100);
    }

    initials(name: string) {
        if (!name) return '';
        const parts = name.trim().split(' ');
        const a = parts[0]?.[0] ?? '';
        const b = parts[1]?.[0] ?? '';
        return (a + b).toUpperCase();
    }
}
