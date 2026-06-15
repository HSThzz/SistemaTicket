import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { UserFavorite } from "../../../../shared/infrastructure/persistence/entities/UserFavorite";

export async function findOneUserFavorite(
  userId: string,
  eventId: string,
): Promise<UserFavorite | null> {
  return AppDataSource.getRepository(UserFavorite).findOne({
    where: { userId, eventId },
  });
}
