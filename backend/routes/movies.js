import express from "express";
import authMiddleware from "../middlewares/auth.js";
import moviesController from "../controllers/moviesController.js";
import { MoviesRoutes } from "../config/resourceNames.js";

const router = express.Router();

router.get(MoviesRoutes.MOVIES_DISCOVER, moviesController.discover)
router.get(MoviesRoutes.MOVIES_SEARCH, authMiddleware, moviesController.search)
router.post(MoviesRoutes.MOVIES_SELECT, authMiddleware, moviesController.select)
router.get(MoviesRoutes.MOVIES_POSTERS, moviesController.getPosters);
router.post(MoviesRoutes.MOVIES_WATCHED, authMiddleware, moviesController.watched);
router.get(MoviesRoutes.MOVIES_GET_WATCHED_MOVIES, authMiddleware, moviesController.getWatchedMovies)

export default router;
