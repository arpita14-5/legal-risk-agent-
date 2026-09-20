import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getRepository } from '../db/repository.js';
import { config } from '../config/env.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['user', 'admin']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export async function register(req: Request, res: Response) {
  try {
    const data = registerSchema.parse(req.body);
    const repo = await getRepository();

    const existing = await repo.findUserByEmail(data.email);
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await repo.createUser({
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role || 'user'
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' as const }
    );

    await repo.logAudit('USER_REGISTERED', 'user', user.id, user.id);

    return res.status(201).json({ user, token });
  } catch (err: any) {
    return res.status(400).json({ error: err.errors ? err.errors[0].message : err.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const data = loginSchema.parse(req.body);
    const repo = await getRepository();

    const user = await repo.findUserByEmail(data.email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' as const }
    );

    const { passwordHash, ...safeUser } = user;
    await repo.logAudit('USER_LOGIN', 'user', user.id, user.id);

    return res.json({ user: safeUser, token });
  } catch (err: any) {
    return res.status(400).json({ error: err.errors ? err.errors[0].message : err.message });
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const repo = await getRepository();
    const user = await repo.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
