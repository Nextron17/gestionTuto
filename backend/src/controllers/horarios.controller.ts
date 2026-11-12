import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import HorarioDisponible from '../models/HorarioDisponible';

export const obtenerHorarios = async (req: AuthRequest, res: Response) => {
  try {
    const profesorId = req.query.profesorId;
    const filtro: Record<string, any> = {};

    if (typeof profesorId === 'string' && profesorId.trim() !== '') {
      filtro.profesor = profesorId;
    } else if (req.user?.rol === 'profesor') {
      filtro.profesor = req.user.id;
    }

    const horarios = await HorarioDisponible.find(filtro).populate('profesor', 'nombre email');
    return res.json(horarios);
  } catch (error) {
    console.error('Error en obtenerHorarios:', error);
    return res.status(500).json({ message: 'Error al obtener horarios' });
  }
};

export const crearHorario = async (req: AuthRequest, res: Response) => {
  try {
    const { dia, horaInicio, horaFin } = req.body;
    const nuevo = new HorarioDisponible({
      profesor: req.user?.id,
      dia,
      horaInicio,
      horaFin,
    });
    await nuevo.save();
    return res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error en crearHorario:', error);
    return res.status(500).json({ message: 'Error al crear horario' });
  }
};

export const eliminarHorario = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await HorarioDisponible.findByIdAndDelete(id);
    return res.json({ message: 'Horario eliminado' });
  } catch (error) {
    console.error('Error en eliminarHorario:', error);
    return res.status(500).json({ message: 'Error al eliminar horario' });
  }
};