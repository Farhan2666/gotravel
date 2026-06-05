import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from '../config/dbHelper';
import { AuthRequest } from '../middlewares/auth';

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate role
    const finalRole = role || 'user';
    if (!['user', 'driver'].includes(finalRole)) {
      return res.status(400).json({ error: 'Registrasi akun Admin atau role tidak valid dilarang!' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({ name, email, password: hashedPassword, role: finalRole });

    const userId = user._id ? user._id.toString() : '';
    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const secret = process.env.JWT_SECRET || 'super_secret_gotravel_key_123';
    const userId = user._id ? user._id.toString() : '';
    const token = jwt.sign({ id: userId, email: user.email, role: user.role }, secret, { expiresIn: '24h' });

    res.json({ token, user: { id: userId, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Keep updateSubscription as a placeholder to prevent import errors in routers, but disable it.
export async function updateSubscription(req: AuthRequest, res: Response) {
  res.status(400).json({ error: 'Membership system is retired.' });
}
