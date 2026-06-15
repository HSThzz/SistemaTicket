import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { UserFavorite } from "../../../../shared/infrastructure/persistence/entities/UserFavorite";

export async function findFavoriteEventIdsByUserId(userId: string): Promise<string[]> {
  const favorites = await AppDataSource.getRepository(UserFavorite).find({
    where: { userId },
    order: { createdAt: "DESC" },
    select: { eventId: true },
  });

  return favorites.map((favorite) => favorite.eventId);
}
