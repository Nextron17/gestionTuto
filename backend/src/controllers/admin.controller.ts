import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { PipelineStage } from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import Usuario from '../models/Usuario';
import Escuela from '../models/Escuela';
import Carrera from '../models/Carrera';
import Materia from '../models/Materia';
import SolicitudTutoria from '../models/SolicitudTutoria';
import Recurso from '../models/Recurso';
import HorarioDisponible from '../models/HorarioDisponible';

export const obtenerUsuarios = async (req: AuthRequest, res: Response) => {
  try {
    const usuarios = await Usuario.find().select('-passwordHash').sort({ createdAt: -1 });
    return res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

export const crearUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, email, password, rol, escuela, carrera, semestre, materias } = req.body;

    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ message: 'Todos los campos básicos son obligatorios' });
    }

    if (!['estudiante', 'profesor', 'admin'].includes(rol)) {
      return res.status(400).json({ message: 'Rol no válido' });
    }

    const existeUsuario = await Usuario.findOne({ email });
    if (existeUsuario) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const nuevoUsuario = new Usuario({
      nombre,
      email,
      passwordHash,
      rol,
      escuela: rol === 'profesor' ? escuela || '' : undefined,
      carrera: rol === 'profesor' || rol === 'estudiante' ? carrera || '' : undefined,
      semestre: rol === 'estudiante' && semestre ? Number(semestre) : undefined,
      materias: rol === 'profesor' && Array.isArray(materias) ? materias : [],
    });

    await nuevoUsuario.save();

    const usuarioRespuesta = await Usuario.findById(nuevoUsuario._id).select('-passwordHash');
    return res.status(201).json(usuarioRespuesta);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ message: 'Error al crear usuario' });
  }
};

export const actualizarUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol, escuela, carrera, semestre, materias } = req.body;

    const usuarioExistente = await Usuario.findById(id);
    if (!usuarioExistente) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (usuarioExistente.rol === 'admin') {
      return res.status(403).json({ message: 'No se puede modificar un usuario administrador' });
    }

    if (rol && rol !== 'estudiante' && rol !== 'profesor') {
      return res.status(400).json({ message: 'No se puede asignar el rol de administrador' });
    }

    if (email && email !== usuarioExistente.email) {
      const correoEnUso = await Usuario.findOne({ email });
      if (correoEnUso) {
        return res.status(400).json({ message: 'El correo ya está en uso por otro usuario' });
      }
      usuarioExistente.email = email;
    }

    if (nombre) usuarioExistente.nombre = nombre;
    if (rol) usuarioExistente.rol = rol;

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      usuarioExistente.passwordHash = await bcrypt.hash(password, salt);
    }

    if (usuarioExistente.rol === 'profesor') {
      usuarioExistente.escuela = escuela || '';
      usuarioExistente.carrera = carrera || '';
      usuarioExistente.materias = Array.isArray(materias) ? materias : [];
      usuarioExistente.semestre = undefined;
    } else if (usuarioExistente.rol === 'estudiante') {
      usuarioExistente.carrera = carrera || '';
      usuarioExistente.semestre = semestre ? Number(semestre) : undefined;
      usuarioExistente.escuela = undefined;
      usuarioExistente.materias = [];
    }

    await usuarioExistente.save();

    const actualizado = await Usuario.findById(id).select('-passwordHash');
    return res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

export const cambiarRolUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    const usuarioExistente = await Usuario.findById(id);
    if (!usuarioExistente) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (usuarioExistente.rol === 'admin') {
      return res.status(403).json({ message: 'El rol de administrador no se puede modificar' });
    }

    if (rol !== 'estudiante' && rol !== 'profesor') {
      return res.status(400).json({ message: 'Rol no permitido' });
    }

    const usuario = await Usuario.findByIdAndUpdate(id, { rol }, { new: true }).select('-passwordHash');
    return res.json(usuario);
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    return res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

export const eliminarUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const usuarioExistente = await Usuario.findById(id);
    if (!usuarioExistente) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (usuarioExistente.rol === 'admin') {
      return res.status(403).json({ message: 'No se puede eliminar un usuario administrador' });
    }

    await Usuario.findByIdAndDelete(id);
    return res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};

export const obtenerCatalogo = async (req: AuthRequest, res: Response) => {
  try {
    const escuelas = await Escuela.find();
    const carreras = await Carrera.find().populate('escuela', 'nombre');
    const materias = await Materia.find().populate('carrera', 'nombre');
    return res.json({ escuelas, carreras, materias });
  } catch (error) {
    console.error('Error al obtener catálogo:', error);
    return res.status(500).json({ message: 'Error al obtener catálogo académico' });
  }
};

export const crearEscuela = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, codigo } = req.body;
    const nueva = new Escuela({ nombre, codigo });
    await nueva.save();
    return res.status(201).json(nueva);
  } catch (error) {
    console.error('Error al crear escuela:', error);
    return res.status(500).json({ message: 'Error al crear escuela' });
  }
};

export const eliminarEscuela = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Escuela.findByIdAndDelete(id);
    return res.json({ message: 'Escuela eliminada' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar escuela' });
  }
};

export const crearCarrera = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, codigo, escuela } = req.body;
    const nueva = new Carrera({ nombre, codigo, escuela });
    await nueva.save();
    return res.status(201).json(nueva);
  } catch (error) {
    console.error('Error al crear carrera:', error);
    return res.status(500).json({ message: 'Error al crear carrera' });
  }
};

export const eliminarCarrera = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Carrera.findByIdAndDelete(id);
    return res.json({ message: 'Carrera eliminada' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar carrera' });
  }
};

export const crearMateria = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, codigo, carrera } = req.body;
    const nueva = new Materia({ nombre, codigo, carrera });
    await nueva.save();
    return res.status(201).json(nueva);
  } catch (error) {
    console.error('Error al crear materia:', error);
    return res.status(500).json({ message: 'Error al crear materia' });
  }
};

export const eliminarMateria = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Materia.findByIdAndDelete(id);
    return res.json({ message: 'Materia eliminada' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar materia' });
  }
};

export const obtenerReportesGlobales = async (req: AuthRequest, res: Response) => {
  try {
    const carreraFilter =
      typeof req.query.carrera === 'string' &&
      req.query.carrera.trim() !== '' &&
      req.query.carrera.trim() !== 'todas'
        ? req.query.carrera.trim()
        : null;

    const semestreRaw =
      typeof req.query.semestre === 'string' ? req.query.semestre.trim() : '';
    const semestreParsed =
      semestreRaw !== '' && semestreRaw !== 'todos' ? Number(semestreRaw) : NaN;
    const semestreFilter = Number.isFinite(semestreParsed) ? semestreParsed : null;

    const matchEstudiante: Record<string, unknown> = {};
    if (carreraFilter) matchEstudiante['estudianteDoc.carrera'] = carreraFilter;
    if (semestreFilter !== null) matchEstudiante['estudianteDoc.semestre'] = semestreFilter;

    const pipelineBase: PipelineStage[] = [
      {
        $lookup: {
          from: Usuario.collection.name,
          localField: 'estudiante',
          foreignField: '_id',
          as: 'estudianteDoc',
        },
      },
      {
        $unwind: {
          path: '$estudianteDoc',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (Object.keys(matchEstudiante).length > 0) {
      pipelineBase.push({ $match: matchEstudiante });
    }

    const pipelineFacet: PipelineStage[] = [
      ...pipelineBase,
      {
        $facet: {
          resumen: [
            {
              $group: {
                _id: null,
                totalTutorias: { $sum: 1 },
                tutoriasPendientes: {
                  $sum: { $cond: [{ $eq: ['$estado', 'pendiente'] }, 1, 0] },
                },
                tutoriasAceptadas: {
                  $sum: { $cond: [{ $eq: ['$estado', 'aceptada'] }, 1, 0] },
                },
                tutoriasFinalizadas: {
                  $sum: { $cond: [{ $eq: ['$estado', 'finalizada'] }, 1, 0] },
                },
                tutoriasAplazadas: {
                  $sum: { $cond: [{ $eq: ['$estado', 'aplazada'] }, 1, 0] },
                },
                tutoriasCanceladas: {
                  $sum: { $cond: [{ $eq: ['$estado', 'cancelada'] }, 1, 0] },
                },
                tutoriasVirtuales: {
                  $sum: { $cond: [{ $eq: ['$modalidad', 'virtual'] }, 1, 0] },
                },
                tutoriasPresenciales: {
                  $sum: { $cond: [{ $eq: ['$modalidad', 'presencial'] }, 1, 0] },
                },
                tutoriasIndividuales: {
                  $sum: { $cond: [{ $eq: ['$tipo', 'individual'] }, 1, 0] },
                },
                tutoriasGrupales: {
                  $sum: { $cond: [{ $eq: ['$tipo', 'grupal'] }, 1, 0] },
                },
                asistenciasConfirmadas: {
                  $sum: { $cond: [{ $eq: ['$asistenciaEstudiante', true] }, 1, 0] },
                },
                inasistenciasRegistradas: {
                  $sum: { $cond: [{ $eq: ['$asistenciaEstudiante', false] }, 1, 0] },
                },
              },
            },
          ],
          demandaPorMateria: [
            {
              $group: {
                _id: { $ifNull: ['$materia', 'Sin especificar'] },
                totalSolicitudes: { $sum: 1 },
                finalizadas: {
                  $sum: { $cond: [{ $eq: ['$estado', 'finalizada'] }, 1, 0] },
                },
                pendientes: {
                  $sum: { $cond: [{ $eq: ['$estado', 'pendiente'] }, 1, 0] },
                },
                carreras: {
                  $addToSet: {
                    $cond: [
                      {
                        $or: [
                          { $eq: ['$estudianteDoc.carrera', null] },
                          { $eq: ['$estudianteDoc.carrera', ''] },
                        ],
                      },
                      'Sin carrera',
                      '$estudianteDoc.carrera',
                    ],
                  },
                },
              },
            },
            { $sort: { totalSolicitudes: -1, _id: 1 } },
            {
              $project: {
                _id: 0,
                materia: '$_id',
                totalSolicitudes: 1,
                finalizadas: 1,
                pendientes: 1,
                carreras: 1,
              },
            },
          ],
          demandaPorTema: [
            {
              $addFields: {
                temaNormalizado: {
                  $let: {
                    vars: {
                      trimmed: { $trim: { input: { $ifNull: ['$tema', ''] } } },
                    },
                    in: {
                      $cond: [
                        { $eq: ['$$trimmed', ''] },
                        'Tema general / Sin especificar',
                        '$$trimmed',
                      ],
                    },
                  },
                },
              },
            },
            {
              $group: {
                _id: {
                  materia: { $ifNull: ['$materia', 'Sin especificar'] },
                  tema: '$temaNormalizado',
                },
                totalSolicitudes: { $sum: 1 },
                finalizadas: {
                  $sum: { $cond: [{ $eq: ['$estado', 'finalizada'] }, 1, 0] },
                },
                pendientes: {
                  $sum: { $cond: [{ $eq: ['$estado', 'pendiente'] }, 1, 0] },
                },
              },
            },
            { $sort: { totalSolicitudes: -1, '_id.materia': 1 } },
            {
              $project: {
                _id: 0,
                materia: '$_id.materia',
                tema: '$_id.tema',
                totalSolicitudes: 1,
                finalizadas: 1,
                pendientes: 1,
              },
            },
          ],
          demandaPorCarreraSemestre: [
            {
              $group: {
                _id: {
                  carrera: {
                    $cond: [
                      {
                        $or: [
                          { $eq: ['$estudianteDoc.carrera', null] },
                          { $eq: ['$estudianteDoc.carrera', ''] },
                        ],
                      },
                      'Sin carrera registrada',
                      '$estudianteDoc.carrera',
                    ],
                  },
                  semestre: '$estudianteDoc.semestre',
                },
                totalSolicitudes: { $sum: 1 },
                materiasPrincipales: { $addToSet: '$materia' },
              },
            },
            { $sort: { totalSolicitudes: -1, '_id.carrera': 1, '_id.semestre': 1 } },
            {
              $project: {
                _id: 0,
                carrera: '$_id.carrera',
                semestre: '$_id.semestre',
                totalSolicitudes: 1,
                materiasPrincipales: 1,
              },
            },
          ],
        },
      },
    ];

    const [
      totalEstudiantes,
      totalProfesores,
      totalRecursos,
      totalHorarios,
      carrerasCatalogo,
      carrerasEstudiantes,
      semestresEstudiantes,
      agregado,
    ] = await Promise.all([
      Usuario.countDocuments({ rol: 'estudiante' }),
      Usuario.countDocuments({ rol: 'profesor' }),
      Recurso.countDocuments(),
      HorarioDisponible.countDocuments(),
      Carrera.find().select('nombre'),
      Usuario.distinct('carrera', { rol: 'estudiante' }),
      Usuario.distinct('semestre', { rol: 'estudiante' }),
      SolicitudTutoria.aggregate(pipelineFacet),
    ]);

    const facetResult = agregado[0] || {};
    const resumen = facetResult.resumen?.[0] || {
      totalTutorias: 0,
      tutoriasPendientes: 0,
      tutoriasAceptadas: 0,
      tutoriasFinalizadas: 0,
      tutoriasAplazadas: 0,
      tutoriasCanceladas: 0,
      tutoriasVirtuales: 0,
      tutoriasPresenciales: 0,
      tutoriasIndividuales: 0,
      tutoriasGrupales: 0,
      asistenciasConfirmadas: 0,
      inasistenciasRegistradas: 0,
    };

    const carrerasDisponibles = Array.from(
      new Set([
        ...carrerasCatalogo.map((c) => c.nombre),
        ...carrerasEstudiantes.filter((c): c is string => typeof c === 'string' && c.trim() !== ''),
      ])
    ).sort((a, b) => a.localeCompare(b));

    const semestresDisponibles = semestresEstudiantes
      .filter((s): s is number => typeof s === 'number' && Number.isFinite(s))
      .sort((a, b) => a - b);

    const totalUsuarios = totalEstudiantes + totalProfesores;

    return res.json({
      fechaGeneracion: new Date().toISOString(),
      filtros: {
        periodo: 'Global / Tiempo Real',
        carrera: carreraFilter || 'Todas',
        semestre: semestreFilter !== null ? String(semestreFilter) : 'Todos',
      },
      carrerasDisponibles,
      semestresDisponibles,
      totalUsuarios,
      totalEstudiantes,
      totalProfesores,
      totalTutorias: resumen.totalTutorias,
      tutoriasPendientes: resumen.tutoriasPendientes,
      tutoriasAceptadas: resumen.tutoriasAceptadas,
      tutoriasFinalizadas: resumen.tutoriasFinalizadas,
      tutoriasAplazadas: resumen.tutoriasAplazadas,
      tutoriasCanceladas: resumen.tutoriasCanceladas,
      tutoriasVirtuales: resumen.tutoriasVirtuales,
      tutoriasPresenciales: resumen.tutoriasPresenciales,
      tutoriasIndividuales: resumen.tutoriasIndividuales,
      tutoriasGrupales: resumen.tutoriasGrupales,
      asistenciasConfirmadas: resumen.asistenciasConfirmadas,
      inasistenciasRegistradas: resumen.inasistenciasRegistradas,
      totalRecursos,
      totalHorarios,
      demandaPorMateria: facetResult.demandaPorMateria || [],
      demandaPorTema: facetResult.demandaPorTema || [],
      demandaPorCarreraSemestre: facetResult.demandaPorCarreraSemestre || [],
    });
  } catch (error) {
    console.error('Error al generar reportes:', error);
    return res.status(500).json({ message: 'Error al generar métricas del sistema' });
  }
};

export const obtenerRecursosAdmin = async (req: AuthRequest, res: Response) => {
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
    console.error('Error al obtener recursos para administración:', error);
    return res.status(500).json({ message: 'Error al obtener recursos académicos' });
  }
};

export const actualizarRecursoAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { titulo, escuela, materia, tema, tipo, claseOrigen, link } = req.body;

    if (!titulo || !String(titulo).trim() || !materia || !String(materia).trim() || !link || !String(link).trim()) {
      return res.status(400).json({
        message: 'El título, la materia y el enlace del recurso son obligatorios',
      });
    }

    const recursoExistente = await Recurso.findById(id);
    if (!recursoExistente) {
      return res.status(404).json({ message: 'Recurso no encontrado' });
    }

    if (tipo !== undefined) {
      const tipoLimpio = String(tipo)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (!['video', 'guia', 'documento', 'enlace'].includes(tipoLimpio)) {
        return res.status(400).json({
          message: 'Tipo de recurso no válido. Usa video, guia, documento o enlace',
        });
      }
      recursoExistente.tipo = tipoLimpio as 'video' | 'guia' | 'documento' | 'enlace';
    }

    recursoExistente.titulo = String(titulo).trim();
    recursoExistente.escuela =
      typeof escuela === 'string' && escuela.trim() !== '' ? escuela.trim() : 'General';
    recursoExistente.materia = String(materia).trim();
    recursoExistente.tema = typeof tema === 'string' ? tema.trim() : '';
    recursoExistente.claseOrigen = typeof claseOrigen === 'string' ? claseOrigen.trim() : '';
    recursoExistente.link = String(link).trim();

    await recursoExistente.save();

    const actualizado = await Recurso.findById(id).populate(
      'profesor',
      'nombre email escuela carrera'
    );
    return res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar recurso:', error);
    return res.status(500).json({ message: 'Error al actualizar el recurso académico' });
  }
};

export const eliminarRecursoAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const recursoExistente = await Recurso.findById(id);
    if (!recursoExistente) {
      return res.status(404).json({ message: 'Recurso no encontrado' });
    }

    await Recurso.findByIdAndDelete(id);
    return res.json({ message: 'Recurso eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar recurso:', error);
    return res.status(500).json({ message: 'Error al eliminar el recurso académico' });
  }
};