import express from 'express';
import { body, validationResult } from 'express-validator';
import AuthController from '../controllers/authController.js';
import authMiddleware from '../middlewares/auth.js';

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    return res.status(400).json({ errors: errors.array() });
  };
};

const router = express.Router();

router.post('/register', validate([
  body('email').isEmail().withMessage('Invalid email'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('first_name').isLength({ min: 1 }).withMessage('First name is required'),
  body('last_name').isLength({ min: 1 }).withMessage('Last name is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
]), AuthController.register);

router.post('/login', validate([
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
]), AuthController.login);

router.post('/forgot-password', validate([
  body('email').isEmail().withMessage('Invalid email'),
]), AuthController.forgotPassword);

router.post('/reset-password/:token', validate([
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
]), AuthController.resetPassword);

export default router;