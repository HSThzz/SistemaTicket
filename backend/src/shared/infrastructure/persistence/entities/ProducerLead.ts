/**
 * @file Entidade de lead capturado pelo formulário de contato de produtores.
 * @module shared/infrastructure/persistence/entities/ProducerLead
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

/** Lead de produtor interessado na plataforma. */
@Entity("producer_leads")
export class ProducerLead {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 32, nullable: true })
  phone!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
