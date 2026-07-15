import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { UserFavorite } from "../../../../shared/infrastructure/persistence/entities/UserFavorite";

export async function findOneUserFavorite(
  userId: string,
  eventId: string,
): Promise<UserFavorite | null> {
  return AppDataSource.getRepository(UserFavorite)
    .createQueryBuilder("favorite")
    .where("favorite.userId = :userId", { userId })
    .andWhere("favorite.eventId = :eventId", { eventId })
    .getOne();
}
