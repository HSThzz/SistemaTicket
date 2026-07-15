import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { UserFavorite } from "../../../../shared/infrastructure/persistence/entities/UserFavorite";
import { EventStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findFavoritePublishedEventsByUserId(
  userId: string,
): Promise<Event[]> {
  const favorites = await AppDataSource.getRepository(UserFavorite)
    .createQueryBuilder("favorite")
    .innerJoinAndSelect("favorite.event", "event")
    .leftJoinAndSelect("event.ticketLots", "ticketLots")
    .where("favorite.userId = :userId", { userId })
    .andWhere("event.status = :status", { status: EventStatus.PUBLISHED })
    .andWhere("event.deletedAt IS NULL")
    .orderBy("favorite.createdAt", "DESC")
    .getMany();

  return favorites.map((favorite) => favorite.event);
}
