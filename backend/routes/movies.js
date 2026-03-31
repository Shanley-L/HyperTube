import express from "express";
import authMiddleware from "../middlewares/auth.js";
import moviesController from "../controllers/moviesController.js";

const router = express.Router();

router.get("/discover", authMiddleware, moviesController.discover);
router.get("/search", authMiddleware, moviesController.search);
router.post("/select", authMiddleware, moviesController.select);
router.get("/posters", moviesController.getPosters);
router.post("/watched", authMiddleware, moviesController.watched);
router.get(
  "/getwatchedmovies",
  authMiddleware,
  moviesController.getWatchedMovies,
);

export default router;
