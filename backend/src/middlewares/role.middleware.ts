import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const permitirRoles = (...rolesPermitidos: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
    }
    next();
  };
};  