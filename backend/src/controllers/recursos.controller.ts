import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Recurso, { TipoRecurso } from '../models/Recurso';
import Usuario from '../models/Usuario';
import Escuela from '../models/Escuela';
import Carrera from '../models/Carrera';
import Materia from '../models/Materia';
import Tema from '../models/Tema';

const TIPOS_RECURSO_VALIDOS: readonly TipoRecurso[] = ['video', 'guia', 'documento', 'enlace'];

function normalizarTipoRecurso(val?: unknown): TipoRecurso | null {
  if (val === undefined || val === null || String(val).trim() === '') {
    return 'enlace';
  }
  const limpio = String(val)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (TIPOS_RECURSO_VALIDOS.includes(limpio as TipoRecurso)) {
    return limpio as TipoRecurso;
  }
  return null;
}

export const obtenerEscuelasRecursos = async (req: AuthRequest, res: Response) => {
  try {
    const [escuelas, materiasCat, temasCat] = await Promise.all([
      Escuela.find().sort({ nombre: 1 }),
      Materia.find().select('nombre codigo').sort({ nombre: 1 }),
      Tema.find().populate('materia', 'nombre').sort({ nombre: 1 }),
    ]);

    let miEscuela = '';
    let misMaterias: string[] = [];

    if (req.user?.id) {
      const usuario = await Usuario.findById(req.user.id).select('rol escuela carrera materias');
      if (usuario) {
        misMaterias = usuario.materias || [];
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

    const materias = Array.from(
      new Set([...misMaterias.filter(Boolean), ...materiasCat.map((m) => m.nombre)])
    ).sort((a, b) => a.localeCompare(b));

    const temas = temasCat.map((t) => {
      const matPop = t.materia as unknown as { nombre?: string } | null;
      return {
        _id: t._id,
        nombre: t.nombre,
        materia: matPop?.nombre || '',
      };
    });

    return res.json({ escuelas, miEscuela, materias, temas });
  } catch (error) {
    console.error('Error al obtener escuelas para recursos:', error);
    return res.status(500).json({ message: 'Error al obtener escuelas' });
  }
};

export const obtenerRecursos = async (req: AuthRequest, res: Response) => {
  try {
    const { escuela, materia, tema, tipo } = req.query;
    const filtro: Record<string, unknown> = {};

    if (typeof escuela === 'string' && escuela.trim() !== '' && escuela !== 'todas') {
      filtro.escuela = escuela.trim();
    }
    if (typeof materia === 'string' && materia.trim() !== '' && materia !== 'todas') {
      const escaped = materia.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filtro.materia = { $regex: escaped, $options: 'i' };
    }
    if (typeof tema === 'string' && tema.trim() !== '' && tema !== 'todos') {
      const escaped = tema.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filtro.tema = { $regex: escaped, $options: 'i' };
    }
    if (typeof tipo === 'string' && tipo.trim() !== '' && tipo !== 'todos') {
      const tipoNorm = normalizarTipoRecurso(tipo);
      if (tipoNorm) {
        filtro.tipo = tipoNorm;
      }
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
    const { titulo, escuela, materia, tema, tipo, claseOrigen, link, url } = req.body;

    const tituloLimpio = typeof titulo === 'string' ? titulo.trim() : '';
    const materiaLimpia = typeof materia === 'string' ? materia.trim() : '';
    const temaLimpio = typeof tema === 'string' ? tema.trim() : '';
    const linkFinal = String(link || url || '').trim();
    const tipoNormalizado = normalizarTipoRecurso(tipo);

    if (!tituloLimpio || !materiaLimpia || !temaLimpio || !linkFinal) {
      return res.status(400).json({
        message: 'Cada recurso debe incluir título, materia, tema, tipo y URL',
      });
    }

    if (!tipoNormalizado) {
      return res.status(400).json({
        message: 'Tipo de recurso no válido. Usa video, guia, documento o enlace',
      });
    }

    let escuelaAsignada = typeof escuela === 'string' ? escuela.trim() : '';

    if (!escuelaAsignada && req.user?.id) {
      const prof = await Usuario.findById(req.user.id).select('escuela');
      escuelaAsignada = prof?.escuela || 'General';
    }

    const nuevo = new Recurso({
      titulo: tituloLimpio,
      escuela: escuelaAsignada || 'General',
      materia: materiaLimpia,
      tema: temaLimpio,
      tipo: tipoNormalizado,
      claseOrigen: typeof claseOrigen === 'string' ? claseOrigen.trim() : '',
      link: linkFinal,
      profesor: req.user?.id,
    });

    await nuevo.save();
    const poblado = await Recurso.findById(nuevo._id).populate(
      'profesor',
      'nombre email escuela carrera'
    );
    return res.status(201).json(poblado || nuevo);
  } catch (error) {
    console.error('Error al publicar recurso:', error);
    return res.status(500).json({ message: 'Error al publicar recurso' });
  }
};

export const actualizarRecursoProfesor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const recurso = await Recurso.findById(id);

    if (!recurso) {
      return res.status(404).json({ message: 'Recurso no encontrado' });
    }

    if (req.user?.rol !== 'admin' && String(recurso.profesor) !== req.user?.id) {
      return res.status(403).json({ message: 'No tienes permiso para editar este recurso' });
    }

    const { titulo, escuela, materia, tema, tipo, claseOrigen, link, url } = req.body;
    const tituloLimpio = typeof titulo === 'string' ? titulo.trim() : recurso.titulo;
    const materiaLimpia = typeof materia === 'string' ? materia.trim() : recurso.materia;
    const temaLimpio = typeof tema === 'string' ? tema.trim() : recurso.tema || '';
    const linkFinal =
      link !== undefined || url !== undefined ? String(link || url || '').trim() : recurso.link;
    const tipoNormalizado =
      tipo !== undefined ? normalizarTipoRecurso(tipo) : recurso.tipo || 'enlace';

    if (!tituloLimpio || !materiaLimpia || !temaLimpio || !linkFinal) {
      return res.status(400).json({
        message: 'Cada recurso debe incluir título, materia, tema, tipo y URL',
      });
    }

    if (!tipoNormalizado) {
      return res.status(400).json({
        message: 'Tipo de recurso no válido. Usa video, guia, documento o enlace',
      });
    }

    recurso.titulo = tituloLimpio;
    if (typeof escuela === 'string' && escuela.trim() !== '') {
      recurso.escuela = escuela.trim();
    }
    recurso.materia = materiaLimpia;
    recurso.tema = temaLimpio;
    recurso.tipo = tipoNormalizado;
    if (typeof claseOrigen === 'string') {
      recurso.claseOrigen = claseOrigen.trim();
    }
    recurso.link = linkFinal;

    await recurso.save();
    const poblado = await Recurso.findById(recurso._id).populate(
      'profesor',
      'nombre email escuela carrera'
    );
    return res.json(poblado || recurso);
  } catch (error) {
    console.error('Error al actualizar recurso:', error);
    return res.status(500).json({ message: 'Error al actualizar recurso' });
  }
};

export const eliminarRecursoProfesor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const recurso = await Recurso.findById(id);

    if (!recurso) {
      return res.status(404).json({ message: 'Recurso no encontrado' });
    }

    if (req.user?.rol !== 'admin' && String(recurso.profesor) !== req.user?.id) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este recurso' });
    }

    await Recurso.findByIdAndDelete(id);
    return res.json({ message: 'Recurso eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar recurso:', error);
    return res.status(500).json({ message: 'Error al eliminar recurso' });
  }
};