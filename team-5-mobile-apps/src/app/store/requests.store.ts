import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FriendService } from '../services/friend.service';

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

    constructor(private friendService: FriendService) { }

    get snapshot() {
        return this._requests$.getValue();
    }

    async loadRequests() {
        const data = await this.friendService.getFriendRequests();
        const requests: FriendRequest[] = data.map((r: any) => ({
            id: r.id,
            senderName: r.sender?.full_name || r.sender?.username || 'Unknown',
            senderAvatar: r.sender?.avatar_url,
            timestamp: r.created_at
        }));
        this._requests$.next(requests);
    }

    async acceptRequest(id: string) {
        await this.friendService.acceptFriendRequest(id);
        this._requests$.next(this.snapshot.filter(r => r.id !== id));
    }
}
