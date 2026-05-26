import { Router } from "express";
import { eventController, eventManagementMiddlewares } from "../controllers/EventController";

const router = Router();

router.get("/", (req, res) => void eventController.listPublished(req, res));
router.get(
  "/mine",
  ...eventManagementMiddlewares,
  (req, res) => void eventController.listMine(req, res),
);
router.get("/:eventId", (req, res) => void eventController.getPublished(req, res));

router.post(
  "/",
  ...eventManagementMiddlewares,
  (req, res) => void eventController.create(req, res),
);

router.patch(
  "/:eventId",
  ...eventManagementMiddlewares,
  (req, res) => void eventController.update(req, res),
);

router.post(
  "/:eventId/lots",
  ...eventManagementMiddlewares,
  (req, res) => void eventController.createLot(req, res),
);

export default router;

