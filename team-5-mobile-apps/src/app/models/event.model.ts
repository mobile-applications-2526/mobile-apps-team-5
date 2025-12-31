export interface EventModel {
  id: string;
  name: string;
  category: 'sports' | 'culture' | 'entertainment' | 'party' | 'other';
  description: string;
  minParticipants: number;
  maxParticipants: number;
  date: string; 
  image: string; 
  location?: string;
  friendsInterested?: number;
  starred?: boolean;
}
