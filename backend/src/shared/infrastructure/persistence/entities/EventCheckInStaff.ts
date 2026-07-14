/**
 * @file Entidade: membro da equipe de portaria de um evento.
 * @module shared/infrastructure/persistence/entities/EventCheckInStaff
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Event } from "./Event";
import { User } from "./User";

/** Usuário autorizado a fazer check-in em um evento específico. */
@Entity("event_check_in_staff")
@Index("IDX_event_check_in_staff_event_user", ["eventId", "userId"], {
  unique: true,
})
export class EventCheckInStaff {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "event_id", type: "uuid" })
  eventId!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "added_by_user_id", type: "uuid" })
  addedByUserId!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => Event, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: Event;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "added_by_user_id" })
  addedBy!: User;
}
