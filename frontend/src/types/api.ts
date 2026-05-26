export type UserRole = "CLIENT" | "PRODUCER" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface TicketLot {
  id: string;
  name: string;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
}

export interface Event {
  id: string;
  producerId: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: string;
  ticketLots: TicketLot[];
}

export interface ApiErrorBody {
  error?: string;
  code?: string;
}
