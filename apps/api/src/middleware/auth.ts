import { jwtVerify, type JWTVerifyGetKey } from "jose";
import type { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  userId: string;
}

export function makeRequireAuth(jwks: JWTVerifyGetKey) {
  const issuer = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const token = header.slice(7);
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer,
        audience: issuer,
      });
      if (!payload.sub) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      (req as AuthRequest).userId = payload.sub;
      next();
    } catch {
      res.status(401).json({ error: "Unauthorized" });
    }
  };
}
