export interface EventModel {
  id: string;
  name: string;
  category: 'sports' | 'culture' | 'entertainment' | 'party' | 'other';
  description: string;
  minParticipants: number;
  maxParticipants: number;
  date: string; // ISO date string
  image: string; // image url
  location?: string;
  friendsInterested?: number;
  starred?: boolean;
}
