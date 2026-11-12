import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import SolicitudTutoria from '../models/SolicitudTutoria';

export const obtenerTutorias = async (req: AuthRequest, res: Response) => {
  try {
    const filtro = req.user?.rol === 'estudiante' ? { estudiante: req.user.id } : {};
    const tutorias = await SolicitudTutoria.find(filtro)
      .populate('estudiante', 'nombre email carrera semestre')
      .populate('profesor', 'nombre email');
    return res.json(tutorias);
  } catch (error) {
    console.error('Error en obtenerTutorias:', error);
    return res.status(500).json({ message: 'Error al obtener tutorías' });
  }
};

export const crearTutoria = async (req: AuthRequest, res: Response) => {
  try {
    const { materia, descripcion, tema, profesorId, hora } = req.body;
    const nueva = new SolicitudTutoria({
      materia,
      descripcion,
      tema,
      profesor: profesorId || undefined,
      hora,
      estudiante: req.user?.id,
      estado: 'pendiente',
    });
    await nueva.save();
    return res.status(201).json(nueva);
  } catch (error) {
    console.error('Error en crearTutoria:', error);
    return res.status(500).json({ message: 'Error al crear la solicitud' });
  }
};

export const cambiarEstadoTutoria = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const actualizada = await SolicitudTutoria.findByIdAndUpdate(id, { estado }, { new: true });
    return res.json(actualizada);
  } catch (error) {
    console.error('Error en cambiarEstadoTutoria:', error);
    return res.status(500).json({ message: 'Error al actualizar estado' });
  }
};

export const agregarRecurso = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { link } = req.body;
    const actualizada = await SolicitudTutoria.findByIdAndUpdate(
      id,
      { $push: { recursos: link } },
      { new: true }
    );
    return res.json(actualizada);
  } catch (error) {
    console.error('Error en agregarRecurso:', error);
    return res.status(500).json({ message: 'Error al agregar recurso' });
  }
};

export const finalizarTutoria = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const actualizada = await SolicitudTutoria.findByIdAndUpdate(
      id,
      { estado: 'finalizada' },
      { new: true }
    );
    return res.json(actualizada);
  } catch (error) {
    console.error('Error en finalizarTutoria:', error);
    return res.status(500).json({ message: 'Error al finalizar tutoría' });
  }
};