"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearRecurso = exports.obtenerRecursos = exports.obtenerEscuelasRecursos = void 0;
const Recurso_1 = __importDefault(require("../models/Recurso"));
const Usuario_1 = __importDefault(require("../models/Usuario"));
const Escuela_1 = __importDefault(require("../models/Escuela"));
const Carrera_1 = __importDefault(require("../models/Carrera"));
const obtenerEscuelasRecursos = async (req, res) => {
    try {
        const escuelas = await Escuela_1.default.find().sort({ nombre: 1 });
        let miEscuela = '';
        if (req.user?.id) {
            const usuario = await Usuario_1.default.findById(req.user.id).select('rol escuela carrera');
            if (usuario) {
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
        return res.json({ escuelas, miEscuela });
    }
    catch (error) {
        console.error('Error al obtener escuelas para recursos:', error);
        return res.status(500).json({ message: 'Error al obtener escuelas' });
    }
};
exports.obtenerEscuelasRecursos = obtenerEscuelasRecursos;
const obtenerRecursos = async (req, res) => {
    try {
        const { escuela } = req.query;
        const filtro = {};
        if (typeof escuela === 'string' && escuela.trim() !== '' && escuela !== 'todas') {
            filtro.escuela = escuela.trim();
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
        const { titulo, escuela, materia, tema, claseOrigen, link } = req.body;
        let escuelaAsignada = typeof escuela === 'string' ? escuela.trim() : '';
        if (!escuelaAsignada && req.user?.id) {
            const prof = await Usuario_1.default.findById(req.user.id).select('escuela');
            escuelaAsignada = prof?.escuela || 'General';
        }
        const nuevo = new Recurso_1.default({
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
    }
    catch (error) {
        console.error('Error al publicar recurso:', error);
        return res.status(500).json({ message: 'Error al publicar recurso' });
    }
};
exports.crearRecurso = crearRecurso;
