import { Response } from 'express';
import bcrypt from 'bcryptjs';
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
    const [
      totalEstudiantes,
      totalProfesores,
      totalTutorias,
      tutoriasPendientes,
      tutoriasAceptadas,
      tutoriasFinalizadas,
      tutoriasAplazadas,
      tutoriasCanceladas,
      tutoriasVirtuales,
      tutoriasPresenciales,
      tutoriasIndividuales,
      tutoriasGrupales,
      asistenciasConfirmadas,
      inasistenciasRegistradas,
      totalRecursos,
      totalHorarios,
      demandaPorMateria,
    ] = await Promise.all([
      Usuario.countDocuments({ rol: 'estudiante' }),
      Usuario.countDocuments({ rol: 'profesor' }),
      SolicitudTutoria.countDocuments(),
      SolicitudTutoria.countDocuments({ estado: 'pendiente' }),
      SolicitudTutoria.countDocuments({ estado: 'aceptada' }),
      SolicitudTutoria.countDocuments({ estado: 'finalizada' }),
      SolicitudTutoria.countDocuments({ estado: 'aplazada' }),
      SolicitudTutoria.countDocuments({ estado: 'cancelada' }),
      SolicitudTutoria.countDocuments({ modalidad: 'virtual' }),
      SolicitudTutoria.countDocuments({ modalidad: 'presencial' }),
      SolicitudTutoria.countDocuments({ tipo: 'individual' }),
      SolicitudTutoria.countDocuments({ tipo: 'grupal' }),
      SolicitudTutoria.countDocuments({ asistenciaEstudiante: true }),
      SolicitudTutoria.countDocuments({ asistenciaEstudiante: false }),
      Recurso.countDocuments(),
      HorarioDisponible.countDocuments(),
      SolicitudTutoria.aggregate([
        {
          $group: {
            _id: '$materia',
            totalSolicitudes: { $sum: 1 },
            finalizadas: {
              $sum: { $cond: [{ $eq: ['$estado', 'finalizada'] }, 1, 0] },
            },
            pendientes: {
              $sum: { $cond: [{ $eq: ['$estado', 'pendiente'] }, 1, 0] },
            },
          },
        },
        { $sort: { totalSolicitudes: -1 } },
        {
          $project: {
            _id: 0,
            materia: '$_id',
            totalSolicitudes: 1,
            finalizadas: 1,
            pendientes: 1,
          },
        },
      ]),
    ]);

    const totalUsuarios = totalEstudiantes + totalProfesores;

    return res.json({
      fechaGeneracion: new Date().toISOString(),
      filtros: {
        periodo: 'Global / Tiempo Real',
      },
      totalUsuarios,
      totalEstudiantes,
      totalProfesores,
      totalTutorias,
      tutoriasPendientes,
      tutoriasAceptadas,
      tutoriasFinalizadas,
      tutoriasAplazadas,
      tutoriasCanceladas,
      tutoriasVirtuales,
      tutoriasPresenciales,
      tutoriasIndividuales,
      tutoriasGrupales,
      asistenciasConfirmadas,
      inasistenciasRegistradas,
      totalRecursos,
      totalHorarios,
      demandaPorMateria,
    });
  } catch (error) {
    console.error('Error al generar reportes:', error);
    return res.status(500).json({ message: 'Error al generar métricas del sistema' });
  }
};