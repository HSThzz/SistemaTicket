import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { UserFavorite } from "../../../../shared/infrastructure/persistence/entities/UserFavorite";

export async function findFavoriteEventIdsByUserId(userId: string): Promise<string[]> {
  const favorites = await AppDataSource.getRepository(UserFavorite)
    .createQueryBuilder("favorite")
    .select("favorite.eventId")
    .where("favorite.userId = :userId", { userId })
    .orderBy("favorite.createdAt", "DESC")
    .getMany();

  return favorites.map((favorite) => favorite.eventId);
}
