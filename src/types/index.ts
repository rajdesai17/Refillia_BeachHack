
export interface RefillStation {
  id: string;
  name: string;
  description: string;
  landmark?: string;
  status: 'verified' | 'unverified' | 'rejected' | 'reported';
  latitude: number;
  longitude: number;
  addedBy: string;
  userEmail?: string;
  username?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  stationId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  points: number;
  stationsAdded: number;
  feedbackGiven: number;
  createdAt: string;
}
