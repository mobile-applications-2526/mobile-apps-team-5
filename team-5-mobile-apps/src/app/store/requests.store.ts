import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from '../services/supabase.service';

export interface FriendRequest {
    id: string;
    senderName: string;
    senderAvatar?: string;
    timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class RequestsStore {
    private _requests$ = new BehaviorSubject<FriendRequest[]>([]);
    readonly requests$ = this._requests$.asObservable();

    constructor(private supabase: SupabaseService) { }

    get snapshot() {
        return this._requests$.getValue();
    }

    async loadRequests() {
        const data = await this.supabase.getFriendRequests();
        const requests: FriendRequest[] = data.map((r: any) => ({
            id: r.id,
            senderName: r.sender?.full_name || r.sender?.username || 'Unknown',
            senderAvatar: r.sender?.avatar_url,
            timestamp: r.created_at
        }));
        this._requests$.next(requests);
    }

    async acceptRequest(id: string) {
        await this.supabase.acceptFriendRequest(id);
        this._requests$.next(this.snapshot.filter(r => r.id !== id));
    }
}
