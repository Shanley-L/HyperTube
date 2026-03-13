import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.join(__dirname, '..', 'uploads');

export const UPLOADS_ROOT = process.env.UPLOADS_ROOT
  ? path.isAbsolute(process.env.UPLOADS_ROOT)
    ? process.env.UPLOADS_ROOT
    : path.resolve(process.cwd(), process.env.UPLOADS_ROOT)
  : defaultRoot;

export const AVATARS_DIR = path.join(UPLOADS_ROOT, 'avatars');

if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}
