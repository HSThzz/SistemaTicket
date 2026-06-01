export enum UserRole {
  CLIENT = "CLIENT",
  PRODUCER = "PRODUCER",
  ADMIN = "ADMIN",
}

export enum EventStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  CANCELLED = "CANCELLED",
  FINISHED = "FINISHED",
}

export enum ReservationStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  EXPIRED = "EXPIRED",
}

export enum OrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum TicketStatus {
  ACTIVE = "ACTIVE",
  USED = "USED",
  CANCELLED = "CANCELLED",
}
