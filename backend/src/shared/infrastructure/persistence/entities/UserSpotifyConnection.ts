/**
 * @file Vínculo OAuth do usuário com conta Spotify.
 * @module shared/infrastructure/persistence/entities/UserSpotifyConnection
 */

import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from "typeorm";
import { User } from "./User";

/** Tokens e metadados da conexão Spotify de um usuário. */
@Entity("user_spotify_connections")
export class UserSpotifyConnection {
  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "spotify_user_id", type: "varchar", length: 128 })
  spotifyUserId!: string;

  @Column({ name: "display_name", type: "varchar", length: 255, nullable: true })
  displayName!: string | null;

  @Column({ name: "access_token", type: "text" })
  accessToken!: string;

  @Column({ name: "refresh_token", type: "text" })
  refreshToken!: string;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @Column({ type: "varchar", length: 512 })
  scope!: string;

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
