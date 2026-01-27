import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createUser, findByUsername, findByEmail, findByResetToken, updateResetToken, updatePassword } from '../models/user.js';
// import { sendEmail } from '../utils/email.js';

const AuthController = {
  register: async (req, res) => {
    const { email, username, first_name, last_name, password } = req.body;
    const existingByEmail = await findByEmail(email);
    if (existingByEmail) return res.status(400).json({ message: 'Email already in use' });
    const existingByUsername = await findByUsername(username);
    if (existingByUsername) return res.status(400).json({ message: 'Username already taken' });
    const user = await createUser({ email, username, first_name, last_name, password });
    res.status(201).json(user);
  },
  login : async (req, res)=> {
    const { username, password } = req.body;
    const user = await findByUsername(username);
    if (!user) return res.status(401).json({ message: 'Invalid username or password' });
    const isFound = await bcrypt.compare(password, user.password_hash);
    if (!isFound) return res.status(401).json({ message: 'Invalid username or password' });
    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  },
  forgotPassword: async (req, res)=> {
    const {email} = req.body;
    const user = await findByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);
    await updateResetToken(user.id, token, expires);
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    // await sendEmail(email, 'Reset Password', resetUrl);
    res.json({ message: 'Password reset email sent' });
  },
  resetPassword: async (req, res)=> {
    const token = req.params.token;
    const { newPassword } = req.body;
    const user = await findByResetToken(token);
    if (!user) return res.status(404).json({ message: 'Invalid or expired token' });
    if (user.reset_password_expires < new Date()) return res.status(400).json({ message: 'Token expired' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await updatePassword(user.id, hashed);
    res.json({ message: 'Password reset successfully' });
  }
};

export default AuthController;