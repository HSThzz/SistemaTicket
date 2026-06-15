import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { UserFavorite } from "../../../../shared/infrastructure/persistence/entities/UserFavorite";

export async function createUserFavorite(
  userId: string,
  eventId: string,
): Promise<UserFavorite> {
  const favorite = AppDataSource.getRepository(UserFavorite).create({
    userId,
    eventId,
  });

  return AppDataSource.getRepository(UserFavorite).save(favorite);
}
