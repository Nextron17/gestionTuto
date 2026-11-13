"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerReportesGlobales = exports.eliminarMateria = exports.crearMateria = exports.eliminarCarrera = exports.crearCarrera = exports.eliminarEscuela = exports.crearEscuela = exports.obtenerCatalogo = exports.eliminarUsuario = exports.cambiarRolUsuario = exports.actualizarUsuario = exports.crearUsuario = exports.obtenerUsuarios = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Usuario_1 = __importDefault(require("../models/Usuario"));
const Escuela_1 = __importDefault(require("../models/Escuela"));
const Carrera_1 = __importDefault(require("../models/Carrera"));
const Materia_1 = __importDefault(require("../models/Materia"));
const SolicitudTutoria_1 = __importDefault(require("../models/SolicitudTutoria"));
const Recurso_1 = __importDefault(require("../models/Recurso"));
const HorarioDisponible_1 = __importDefault(require("../models/HorarioDisponible"));
const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario_1.default.find().select('-passwordHash').sort({ createdAt: -1 });
        return res.json(usuarios);
    }
    catch (error) {
        console.error('Error al obtener usuarios:', error);
        return res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};
exports.obtenerUsuarios = obtenerUsuarios;
const crearUsuario = async (req, res) => {
    try {
        const { nombre, email, password, rol, escuela, carrera, semestre, materias } = req.body;
        if (!nombre || !email || !password || !rol) {
            return res.status(400).json({ message: 'Todos los campos básicos son obligatorios' });
        }
        if (!['estudiante', 'profesor', 'admin'].includes(rol)) {
            return res.status(400).json({ message: 'Rol no válido' });
        }
        const existeUsuario = await Usuario_1.default.findOne({ email });
        if (existeUsuario) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const nuevoUsuario = new Usuario_1.default({
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
        const usuarioRespuesta = await Usuario_1.default.findById(nuevoUsuario._id).select('-passwordHash');
        return res.status(201).json(usuarioRespuesta);
    }
    catch (error) {
        console.error('Error al crear usuario:', error);
        return res.status(500).json({ message: 'Error al crear usuario' });
    }
};
exports.crearUsuario = crearUsuario;
const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, password, rol, escuela, carrera, semestre, materias } = req.body;
        const usuarioExistente = await Usuario_1.default.findById(id);
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
            const correoEnUso = await Usuario_1.default.findOne({ email });
            if (correoEnUso) {
                return res.status(400).json({ message: 'El correo ya está en uso por otro usuario' });
            }
            usuarioExistente.email = email;
        }
        if (nombre)
            usuarioExistente.nombre = nombre;
        if (rol)
            usuarioExistente.rol = rol;
        if (password && password.trim() !== '') {
            const salt = await bcryptjs_1.default.genSalt(10);
            usuarioExistente.passwordHash = await bcryptjs_1.default.hash(password, salt);
        }
        if (usuarioExistente.rol === 'profesor') {
            usuarioExistente.escuela = escuela || '';
            usuarioExistente.carrera = carrera || '';
            usuarioExistente.materias = Array.isArray(materias) ? materias : [];
            usuarioExistente.semestre = undefined;
        }
        else if (usuarioExistente.rol === 'estudiante') {
            usuarioExistente.carrera = carrera || '';
            usuarioExistente.semestre = semestre ? Number(semestre) : undefined;
            usuarioExistente.escuela = undefined;
            usuarioExistente.materias = [];
        }
        await usuarioExistente.save();
        const actualizado = await Usuario_1.default.findById(id).select('-passwordHash');
        return res.json(actualizado);
    }
    catch (error) {
        console.error('Error al actualizar usuario:', error);
        return res.status(500).json({ message: 'Error al actualizar usuario' });
    }
};
exports.actualizarUsuario = actualizarUsuario;
const cambiarRolUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { rol } = req.body;
        const usuarioExistente = await Usuario_1.default.findById(id);
        if (!usuarioExistente) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        if (usuarioExistente.rol === 'admin') {
            return res.status(403).json({ message: 'El rol de administrador no se puede modificar' });
        }
        if (rol !== 'estudiante' && rol !== 'profesor') {
            return res.status(400).json({ message: 'Rol no permitido' });
        }
        const usuario = await Usuario_1.default.findByIdAndUpdate(id, { rol }, { new: true }).select('-passwordHash');
        return res.json(usuario);
    }
    catch (error) {
        console.error('Error al cambiar rol:', error);
        return res.status(500).json({ message: 'Error al actualizar usuario' });
    }
};
exports.cambiarRolUsuario = cambiarRolUsuario;
const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioExistente = await Usuario_1.default.findById(id);
        if (!usuarioExistente) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        if (usuarioExistente.rol === 'admin') {
            return res.status(403).json({ message: 'No se puede eliminar un usuario administrador' });
        }
        await Usuario_1.default.findByIdAndDelete(id);
        return res.json({ message: 'Usuario eliminado correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar usuario:', error);
        return res.status(500).json({ message: 'Error al eliminar usuario' });
    }
};
exports.eliminarUsuario = eliminarUsuario;
const obtenerCatalogo = async (req, res) => {
    try {
        const escuelas = await Escuela_1.default.find();
        const carreras = await Carrera_1.default.find().populate('escuela', 'nombre');
        const materias = await Materia_1.default.find().populate('carrera', 'nombre');
        return res.json({ escuelas, carreras, materias });
    }
    catch (error) {
        console.error('Error al obtener catálogo:', error);
        return res.status(500).json({ message: 'Error al obtener catálogo académico' });
    }
};
exports.obtenerCatalogo = obtenerCatalogo;
const crearEscuela = async (req, res) => {
    try {
        const { nombre, codigo } = req.body;
        const nueva = new Escuela_1.default({ nombre, codigo });
        await nueva.save();
        return res.status(201).json(nueva);
    }
    catch (error) {
        console.error('Error al crear escuela:', error);
        return res.status(500).json({ message: 'Error al crear escuela' });
    }
};
exports.crearEscuela = crearEscuela;
const eliminarEscuela = async (req, res) => {
    try {
        const { id } = req.params;
        await Escuela_1.default.findByIdAndDelete(id);
        return res.json({ message: 'Escuela eliminada' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al eliminar escuela' });
    }
};
exports.eliminarEscuela = eliminarEscuela;
const crearCarrera = async (req, res) => {
    try {
        const { nombre, codigo, escuela } = req.body;
        const nueva = new Carrera_1.default({ nombre, codigo, escuela });
        await nueva.save();
        return res.status(201).json(nueva);
    }
    catch (error) {
        console.error('Error al crear carrera:', error);
        return res.status(500).json({ message: 'Error al crear carrera' });
    }
};
exports.crearCarrera = crearCarrera;
const eliminarCarrera = async (req, res) => {
    try {
        const { id } = req.params;
        await Carrera_1.default.findByIdAndDelete(id);
        return res.json({ message: 'Carrera eliminada' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al eliminar carrera' });
    }
};
exports.eliminarCarrera = eliminarCarrera;
const crearMateria = async (req, res) => {
    try {
        const { nombre, codigo, carrera } = req.body;
        const nueva = new Materia_1.default({ nombre, codigo, carrera });
        await nueva.save();
        return res.status(201).json(nueva);
    }
    catch (error) {
        console.error('Error al crear materia:', error);
        return res.status(500).json({ message: 'Error al crear materia' });
    }
};
exports.crearMateria = crearMateria;
const eliminarMateria = async (req, res) => {
    try {
        const { id } = req.params;
        await Materia_1.default.findByIdAndDelete(id);
        return res.json({ message: 'Materia eliminada' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al eliminar materia' });
    }
};
exports.eliminarMateria = eliminarMateria;
const obtenerReportesGlobales = async (req, res) => {
    try {
        const [totalEstudiantes, totalProfesores, totalTutorias, tutoriasPendientes, tutoriasAceptadas, tutoriasFinalizadas, tutoriasAplazadas, tutoriasCanceladas, tutoriasVirtuales, tutoriasPresenciales, tutoriasIndividuales, tutoriasGrupales, asistenciasConfirmadas, inasistenciasRegistradas, totalRecursos, totalHorarios, demandaPorMateria,] = await Promise.all([
            Usuario_1.default.countDocuments({ rol: 'estudiante' }),
            Usuario_1.default.countDocuments({ rol: 'profesor' }),
            SolicitudTutoria_1.default.countDocuments(),
            SolicitudTutoria_1.default.countDocuments({ estado: 'pendiente' }),
            SolicitudTutoria_1.default.countDocuments({ estado: 'aceptada' }),
            SolicitudTutoria_1.default.countDocuments({ estado: 'finalizada' }),
            SolicitudTutoria_1.default.countDocuments({ estado: 'aplazada' }),
            SolicitudTutoria_1.default.countDocuments({ estado: 'cancelada' }),
            SolicitudTutoria_1.default.countDocuments({ modalidad: 'virtual' }),
            SolicitudTutoria_1.default.countDocuments({ modalidad: 'presencial' }),
            SolicitudTutoria_1.default.countDocuments({ tipo: 'individual' }),
            SolicitudTutoria_1.default.countDocuments({ tipo: 'grupal' }),
            SolicitudTutoria_1.default.countDocuments({ asistenciaEstudiante: true }),
            SolicitudTutoria_1.default.countDocuments({ asistenciaEstudiante: false }),
            Recurso_1.default.countDocuments(),
            HorarioDisponible_1.default.countDocuments(),
            SolicitudTutoria_1.default.aggregate([
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
    }
    catch (error) {
        console.error('Error al generar reportes:', error);
        return res.status(500).json({ message: 'Error al generar métricas del sistema' });
    }
};
exports.obtenerReportesGlobales = obtenerReportesGlobales;
