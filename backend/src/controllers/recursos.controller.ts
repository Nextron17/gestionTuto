import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Recurso from '../models/Recurso';

export const obtenerRecursos = async (req: AuthRequest, res: Response) => {
  try {
    const recursos = await Recurso.find().populate('profesor', 'nombre email');
    return res.json(recursos);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener recursos' });
  }
};

export const crearRecurso = async (req: AuthRequest, res: Response) => {
  try {
    const { titulo, materia, link } = req.body;
    const nuevo = new Recurso({
      titulo,
      materia,
      link,
      profesor: req.user?.id,
    });
    await nuevo.save();
    return res.status(201).json(nuevo);
  } catch (error) {
    return res.status(500).json({ message: 'Error al publicar recurso' });
  }
};