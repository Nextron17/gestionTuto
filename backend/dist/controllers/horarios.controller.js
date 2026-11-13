"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarHorario = exports.crearHorario = exports.obtenerHorarios = void 0;
const HorarioDisponible_1 = __importDefault(require("../models/HorarioDisponible"));
const obtenerHorarios = async (req, res) => {
    try {
        const profesorId = req.query.profesorId;
        const filtro = {};
        if (typeof profesorId === 'string' && profesorId.trim() !== '') {
            filtro.profesor = profesorId;
        }
        else if (req.user?.rol === 'profesor') {
            filtro.profesor = req.user.id;
        }
        const horarios = await HorarioDisponible_1.default.find(filtro).populate({
            path: 'profesor',
            select: 'nombre email rol',
        });
        const horariosValidos = horarios.filter((h) => h.profesor && h.profesor.rol === 'profesor');
        return res.json(horariosValidos);
    }
    catch (error) {
        console.error('Error en obtenerHorarios:', error);
        return res.status(500).json({ message: 'Error al obtener horarios' });
    }
};
exports.obtenerHorarios = obtenerHorarios;
const crearHorario = async (req, res) => {
    try {
        const { dia, horaInicio, horaFin } = req.body;
        const nuevo = new HorarioDisponible_1.default({
            profesor: req.user?.id,
            dia,
            horaInicio,
            horaFin,
        });
        await nuevo.save();
        return res.status(201).json(nuevo);
    }
    catch (error) {
        console.error('Error en crearHorario:', error);
        return res.status(500).json({ message: 'Error al crear horario' });
    }
};
exports.crearHorario = crearHorario;
const eliminarHorario = async (req, res) => {
    try {
        const { id } = req.params;
        await HorarioDisponible_1.default.findByIdAndDelete(id);
        return res.json({ message: 'Horario eliminado' });
    }
    catch (error) {
        console.error('Error en eliminarHorario:', error);
        return res.status(500).json({ message: 'Error al eliminar horario' });
    }
};
exports.eliminarHorario = eliminarHorario;
