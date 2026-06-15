import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { UserFavorite } from "../../../../shared/infrastructure/persistence/entities/UserFavorite";
import { EventStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findFavoritePublishedEventsByUserId(
  userId: string,
): Promise<Event[]> {
  const favorites = await AppDataSource.getRepository(UserFavorite).find({
    where: { userId },
    relations: { event: { ticketLots: true } },
    order: { createdAt: "DESC" },
  });

  return favorites
    .map((favorite) => favorite.event)
    .filter((event) => event.status === EventStatus.PUBLISHED);
}
