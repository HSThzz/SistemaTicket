import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { UserFavorite } from "../../../../shared/infrastructure/persistence/entities/UserFavorite";

export async function deleteUserFavorite(
  userId: string,
  eventId: string,
): Promise<boolean> {
  const result = await AppDataSource.getRepository(UserFavorite).delete({
    userId,
    eventId,
  });

  return (result.affected ?? 0) > 0;
}
