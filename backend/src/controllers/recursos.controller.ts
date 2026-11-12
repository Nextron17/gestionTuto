import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Recurso from '../models/Recurso';
import Usuario from '../models/Usuario';
import Escuela from '../models/Escuela';
import Carrera from '../models/Carrera';

export const obtenerEscuelasRecursos = async (req: AuthRequest, res: Response) => {
  try {
    const escuelas = await Escuela.find().sort({ nombre: 1 });
    let miEscuela = '';

    if (req.user?.id) {
      const usuario = await Usuario.findById(req.user.id).select('rol escuela carrera');
      if (usuario) {
        if (usuario.escuela && usuario.escuela.trim() !== '') {
          miEscuela = usuario.escuela;
        } else if (usuario.carrera && usuario.carrera.trim() !== '') {
          const carreraDoc = await Carrera.findOne({ nombre: usuario.carrera }).populate(
            'escuela',
            'nombre'
          );
          const escuelaPop = carreraDoc?.escuela as unknown as { nombre?: string } | null;
          if (escuelaPop?.nombre) {
            miEscuela = escuelaPop.nombre;
          }
        }
      }
    }

    return res.json({ escuelas, miEscuela });
  } catch (error) {
    console.error('Error al obtener escuelas para recursos:', error);
    return res.status(500).json({ message: 'Error al obtener escuelas' });
  }
};

export const obtenerRecursos = async (req: AuthRequest, res: Response) => {
  try {
    const { escuela } = req.query;
    const filtro: Record<string, unknown> = {};

    if (typeof escuela === 'string' && escuela.trim() !== '' && escuela !== 'todas') {
      filtro.escuela = escuela.trim();
    }

    const recursos = await Recurso.find(filtro)
      .populate('profesor', 'nombre email escuela carrera')
      .sort({ createdAt: -1 });

    return res.json(recursos);
  } catch (error) {
    console.error('Error al obtener recursos:', error);
    return res.status(500).json({ message: 'Error al obtener recursos' });
  }
};

export const crearRecurso = async (req: AuthRequest, res: Response) => {
  try {
    const { titulo, escuela, materia, tema, claseOrigen, link } = req.body;

    let escuelaAsignada = typeof escuela === 'string' ? escuela.trim() : '';

    if (!escuelaAsignada && req.user?.id) {
      const prof = await Usuario.findById(req.user.id).select('escuela');
      escuelaAsignada = prof?.escuela || 'General';
    }

    const nuevo = new Recurso({
      titulo,
      escuela: escuelaAsignada || 'General',
      materia,
      tema: tema || '',
      claseOrigen: claseOrigen || '',
      link,
      profesor: req.user?.id,
    });

    await nuevo.save();
    return res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al publicar recurso:', error);
    return res.status(500).json({ message: 'Error al publicar recurso' });
  }
};