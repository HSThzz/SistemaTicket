/**
 * @file Entidade de favorito (usuário ↔ evento).
 * @module shared/infrastructure/persistence/entities/UserFavorite
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

/** Evento salvo como favorito por um usuário autenticado. */
@Entity("user_favorites")
@Index("IDX_user_favorites_user_event", ["userId", "eventId"], { unique: true })
export class UserFavorite {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "event_id", type: "uuid" })
  eventId!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Event, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: Event;
}
