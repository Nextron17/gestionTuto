"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarRecursoProfesor = exports.actualizarRecursoProfesor = exports.crearRecurso = exports.obtenerRecursos = exports.obtenerEscuelasRecursos = void 0;
const Recurso_1 = __importDefault(require("../models/Recurso"));
const Usuario_1 = __importDefault(require("../models/Usuario"));
const Escuela_1 = __importDefault(require("../models/Escuela"));
const Carrera_1 = __importDefault(require("../models/Carrera"));
const Materia_1 = __importDefault(require("../models/Materia"));
const Tema_1 = __importDefault(require("../models/Tema"));
const TIPOS_RECURSO_VALIDOS = ['video', 'guia', 'documento', 'enlace'];
function normalizarTipoRecurso(val) {
    if (val === undefined || val === null || String(val).trim() === '') {
        return 'enlace';
    }
    const limpio = String(val)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    if (TIPOS_RECURSO_VALIDOS.includes(limpio)) {
        return limpio;
    }
    return null;
}
const obtenerEscuelasRecursos = async (req, res) => {
    try {
        const [escuelas, materiasCat, temasCat] = await Promise.all([
            Escuela_1.default.find().sort({ nombre: 1 }),
            Materia_1.default.find().select('nombre codigo').sort({ nombre: 1 }),
            Tema_1.default.find().populate('materia', 'nombre').sort({ nombre: 1 }),
        ]);
        let miEscuela = '';
        let misMaterias = [];
        if (req.user?.id) {
            const usuario = await Usuario_1.default.findById(req.user.id).select('rol escuela carrera materias');
            if (usuario) {
                misMaterias = usuario.materias || [];
                if (usuario.escuela && usuario.escuela.trim() !== '') {
                    miEscuela = usuario.escuela;
                }
                else if (usuario.carrera && usuario.carrera.trim() !== '') {
                    const carreraDoc = await Carrera_1.default.findOne({ nombre: usuario.carrera }).populate('escuela', 'nombre');
                    const escuelaPop = carreraDoc?.escuela;
                    if (escuelaPop?.nombre) {
                        miEscuela = escuelaPop.nombre;
                    }
                }
            }
        }
        const materias = Array.from(new Set([...misMaterias.filter(Boolean), ...materiasCat.map((m) => m.nombre)])).sort((a, b) => a.localeCompare(b));
        const temas = temasCat.map((t) => {
            const matPop = t.materia;
            return {
                _id: t._id,
                nombre: t.nombre,
                materia: matPop?.nombre || '',
            };
        });
        return res.json({ escuelas, miEscuela, materias, temas });
    }
    catch (error) {
        console.error('Error al obtener escuelas para recursos:', error);
        return res.status(500).json({ message: 'Error al obtener escuelas' });
    }
};
exports.obtenerEscuelasRecursos = obtenerEscuelasRecursos;
const obtenerRecursos = async (req, res) => {
    try {
        const { escuela, materia, tema, tipo } = req.query;
        const filtro = {};
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
        const recursos = await Recurso_1.default.find(filtro)
            .populate('profesor', 'nombre email escuela carrera')
            .sort({ createdAt: -1 });
        return res.json(recursos);
    }
    catch (error) {
        console.error('Error al obtener recursos:', error);
        return res.status(500).json({ message: 'Error al obtener recursos' });
    }
};
exports.obtenerRecursos = obtenerRecursos;
const crearRecurso = async (req, res) => {
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
            const prof = await Usuario_1.default.findById(req.user.id).select('escuela');
            escuelaAsignada = prof?.escuela || 'General';
        }
        const nuevo = new Recurso_1.default({
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
        const poblado = await Recurso_1.default.findById(nuevo._id).populate('profesor', 'nombre email escuela carrera');
        return res.status(201).json(poblado || nuevo);
    }
    catch (error) {
        console.error('Error al publicar recurso:', error);
        return res.status(500).json({ message: 'Error al publicar recurso' });
    }
};
exports.crearRecurso = crearRecurso;
const actualizarRecursoProfesor = async (req, res) => {
    try {
        const { id } = req.params;
        const recurso = await Recurso_1.default.findById(id);
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
        const linkFinal = link !== undefined || url !== undefined ? String(link || url || '').trim() : recurso.link;
        const tipoNormalizado = tipo !== undefined ? normalizarTipoRecurso(tipo) : recurso.tipo || 'enlace';
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
        const poblado = await Recurso_1.default.findById(recurso._id).populate('profesor', 'nombre email escuela carrera');
        return res.json(poblado || recurso);
    }
    catch (error) {
        console.error('Error al actualizar recurso:', error);
        return res.status(500).json({ message: 'Error al actualizar recurso' });
    }
};
exports.actualizarRecursoProfesor = actualizarRecursoProfesor;
const eliminarRecursoProfesor = async (req, res) => {
    try {
        const { id } = req.params;
        const recurso = await Recurso_1.default.findById(id);
        if (!recurso) {
            return res.status(404).json({ message: 'Recurso no encontrado' });
        }
        if (req.user?.rol !== 'admin' && String(recurso.profesor) !== req.user?.id) {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este recurso' });
        }
        await Recurso_1.default.findByIdAndDelete(id);
        return res.json({ message: 'Recurso eliminado correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar recurso:', error);
        return res.status(500).json({ message: 'Error al eliminar recurso' });
    }
};
exports.eliminarRecursoProfesor = eliminarRecursoProfesor;
