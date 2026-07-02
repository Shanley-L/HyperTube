import jwt from "jsonwebtoken";
import { clientFail } from "../utils/clientResponse.js";

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return clientFail(res, { unauthorized: true, message: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return clientFail(res, { unauthorized: true, message: "Unauthorized" });
  }
}
