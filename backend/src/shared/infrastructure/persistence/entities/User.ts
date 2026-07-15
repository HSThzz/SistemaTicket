/**
 * @file Entidade TypeORM de usuário do sistema.
 * @module shared/infrastructure/persistence/entities/User
 */

import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserRole } from "../../../kernel/enums";
import { Event } from "./Event";
import { Order } from "./Order";
import { Reservation } from "./Reservation";

/** Usuário autenticável com papel, documento e relacionamentos de negócio. */
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash!: string;

  @Column({ name: "password_changed_at", type: "timestamptz", nullable: true })
  passwordChangedAt!: Date | null;

  @Column({ name: "terms_accepted_at", type: "timestamptz", nullable: true })
  termsAcceptedAt!: Date | null;

  @Column({ name: "terms_version", type: "varchar", length: 16, nullable: true })
  termsVersion!: string | null;

  @Column({ type: "varchar", length: 18, unique: true })
  document!: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role!: UserRole;

  @OneToMany(() => Event, (event) => event.producer)
  events!: Event[];

  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations!: Reservation[];

  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[];
}
