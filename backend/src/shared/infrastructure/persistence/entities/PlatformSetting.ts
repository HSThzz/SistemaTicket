/**
 * @file Entidade TypeORM de configurações chave/valor da plataforma.
 * @module shared/infrastructure/persistence/entities/PlatformSetting
 */

import {
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

/** Configuração persistida (ex.: taxa de serviço). */
@Entity("platform_settings")
export class PlatformSetting {
  @PrimaryColumn({ type: "varchar", length: 64 })
  key!: string;

  @Column({ type: "text" })
  value!: string;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
