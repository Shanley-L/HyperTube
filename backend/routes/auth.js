import express from 'express';
import { body, validationResult } from 'express-validator';
import AuthController from '../controllers/authController.js';
import authMiddleware from '../middlewares/auth.js';
import passport from '../config/passport.js';
import jwt from 'jsonwebtoken';

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

router.get('/42', passport.authenticate('42', {session: false}));
router.get('/42/callback', passport.authenticate('42', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=42_auth_failed` }),
  async (req, res) => {
    const token = jwt.sign({userId: req.user.id, username: req.user.username}, process.env.JWT_SECRET, { expiresIn: '1h'});
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  });

router.get('/google', passport.authenticate('google', {scope: ['profile', 'email']}));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed` }),
  async (req, res) => {
    const token = jwt.sign({userId: req.user.id, username: req.user.username}, process.env.JWT_SECRET, { expiresIn: '1h'});
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  });

export default router;