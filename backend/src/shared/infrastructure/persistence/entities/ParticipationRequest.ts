/**
 * @file Entidade TypeORM de solicitação de participação em evento privado.
 * @module shared/infrastructure/persistence/entities/ParticipationRequest
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ParticipationRequestStatus } from "../../../kernel/enums";
import { Event } from "./Event";
import { User } from "./User";

/** Pedido de um interessado para participar de um evento privado, sujeito à aprovação do produtor. */
@Entity("participation_requests")
export class ParticipationRequest {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "event_id", type: "uuid" })
  eventId!: string;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId!: string | null;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 32, nullable: true })
  phone!: string | null;

  @Column({
    type: "enum",
    enum: ParticipationRequestStatus,
    default: ParticipationRequestStatus.PENDING,
  })
  status!: ParticipationRequestStatus;

  @Column({ name: "reviewed_by", type: "uuid", nullable: true })
  reviewedBy!: string | null;

  @Column({ name: "reviewed_at", type: "timestamptz", nullable: true })
  reviewedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => Event, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: Event;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "user_id" })
  user!: User | null;
}
