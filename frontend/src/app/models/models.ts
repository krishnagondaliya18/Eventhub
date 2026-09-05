export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'organizer' | 'admin';
  avatar?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  endDate?: string;
  location: string;
  address?: string;
  image: string;
  price: number;
  isFree: boolean;
  totalTickets: number;
  availableTickets: number;
  status: 'active' | 'pending' | 'rejected' | 'draft' | 'completed' | 'cancelled' | 'withdrawn';
  organizer?: User;
  participants?: string[];
  tags?: string[];
  isOnline?: boolean;
  revenue?: number;
  createdAt?: string;
}

export interface Participant {
  _id: string;
  user: User;
  event: Event;
  ticketCount: number;
  totalPaid: number;
  status: string;
  registeredAt: string;
}

export interface Feedback {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  rating: number;
  type: 'feedback' | 'query';
  status: 'pending' | 'resolved';
  adminReply?: string;
  event?: Event;
  createdAt: string;
}

export interface Stats {
  totalUsers: number;
  totalOrganizers?: number;
  totalEvents: number;
  pendingEvents?: number;
  totalParticipants: number;
  totalAdmins: number;
  totalRevenue: number;
  feedbackCount: number;
  pendingQueries: number;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
