"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarHorario = exports.actualizarHorario = exports.crearHorario = exports.obtenerMateriasDisponiblesProfesor = exports.obtenerHorarios = void 0;
const HorarioDisponible_1 = __importDefault(require("../models/HorarioDisponible"));
const SolicitudTutoria_1 = __importDefault(require("../models/SolicitudTutoria"));
const Usuario_1 = __importDefault(require("../models/Usuario"));
const Materia_1 = __importDefault(require("../models/Materia"));
const DIAS_VALIDOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
function normalizarTexto(valor) {
    return (valor || '').toLowerCase().replace(/\s+/g, ' ').trim();
}
function coincideTutoriaConHorario(tutoria, horario) {
    const matHorario = normalizarTexto(horario.materia);
    const matTutoria = normalizarTexto(tutoria.materia);
    if (matHorario && matTutoria && matHorario !== matTutoria) {
        return false;
    }
    const horaSol = normalizarTexto(tutoria.hora);
    if (!horaSol)
        return false;
    const dia = normalizarTexto(horario.dia);
    const inicio = normalizarTexto(horario.horaInicio);
    const fin = normalizarTexto(horario.horaFin);
    const franjaExacta = `${dia} ${inicio} - ${fin}`.trim();
    if (horaSol === franjaExacta)
        return true;
    return Boolean(dia && inicio && horaSol.includes(dia) && horaSol.includes(inicio));
}
async function buscarTutoriasAceptadasDeHorario(horario) {
    const profesorRaw = typeof horario.profesor === 'object' && horario.profesor !== null && '_id' in horario.profesor
        ? horario.profesor._id
        : horario.profesor;
    const profesorId = String(profesorRaw || '');
    const aceptadas = await SolicitudTutoria_1.default.find({
        profesor: profesorId,
        estado: 'aceptada',
    })
        .populate('estudiante', 'nombre email')
        .select('materia tema hora fechaPropuesta estudiante estado');
    return aceptadas.filter((sol) => coincideTutoriaConHorario(sol, horario));
}
const obtenerHorarios = async (req, res) => {
    try {
        const { profesorId, materia, dia, soloLibres, incluirOcupados } = req.query;
        const filtro = {};
        if (typeof profesorId === 'string' && profesorId.trim() !== '') {
            filtro.profesor = profesorId.trim();
        }
        else if (req.user?.rol === 'profesor') {
            filtro.profesor = req.user.id;
        }
        if (typeof materia === 'string' && materia.trim() !== '') {
            const escaped = materia.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filtro.materia = { $regex: escaped, $options: 'i' };
        }
        if (typeof dia === 'string' && dia.trim() !== '' && dia !== 'todos') {
            filtro.dia = dia.trim();
        }
        const horarios = await HorarioDisponible_1.default.find(filtro)
            .populate({
            path: 'profesor',
            select: 'nombre email rol carrera escuela materias',
        })
            .sort({ createdAt: -1 });
        let horariosValidos = horarios.filter((h) => h.profesor && h.profesor.rol === 'profesor');
        if (req.user?.rol === 'estudiante' && req.user.id) {
            const alumno = await Usuario_1.default.findById(req.user.id).select('carrera');
            if (alumno?.carrera && alumno.carrera.trim() !== '') {
                horariosValidos = horariosValidos.filter((h) => {
                    const prof = h.profesor;
                    return !prof?.carrera || prof.carrera === alumno.carrera;
                });
            }
        }
        const profesorIds = Array.from(new Set(horariosValidos.map((h) => String(h.profesor._id || h.profesor))));
        const tutoriasAceptadas = profesorIds.length > 0
            ? await SolicitudTutoria_1.default.find({
                profesor: { $in: profesorIds },
                estado: 'aceptada',
            })
                .populate('estudiante', 'nombre email')
                .select('profesor materia tema hora fechaPropuesta estudiante estado')
            : [];
        let respuesta = horariosValidos.map((h) => {
            const hObj = h.toObject();
            const hProfId = String(h.profesor._id || h.profesor);
            const asociadas = tutoriasAceptadas.filter((sol) => String(sol.profesor) === hProfId && coincideTutoriaConHorario(sol, h));
            const libre = asociadas.length === 0;
            return {
                ...hObj,
                libre,
                tieneTutoriasAceptadas: !libre,
                tutoriasAceptadas: asociadas,
            };
        });
        const filtrarSoloLibres = soloLibres === 'true' || (req.user?.rol === 'estudiante' && incluirOcupados !== 'true');
        if (filtrarSoloLibres) {
            respuesta = respuesta.filter((item) => item.libre);
        }
        return res.json(respuesta);
    }
    catch (error) {
        console.error('Error en obtenerHorarios:', error);
        return res.status(500).json({ message: 'Error al obtener horarios' });
    }
};
exports.obtenerHorarios = obtenerHorarios;
const obtenerMateriasDisponiblesProfesor = async (req, res) => {
    try {
        const profesorId = req.user?.id;
        const [profesor, catalogo] = await Promise.all([
            profesorId
                ? Usuario_1.default.findById(profesorId).select('nombre email escuela carrera materias')
                : null,
            Materia_1.default.find().select('nombre codigo').sort({ nombre: 1 }),
        ]);
        return res.json({
            nombreProfesor: profesor?.nombre || '',
            carrera: profesor?.carrera || '',
            escuela: profesor?.escuela || '',
            misMaterias: profesor?.materias || [],
            catalogoMaterias: catalogo.map((m) => m.nombre),
        });
    }
    catch (error) {
        console.error('Error en obtenerMateriasDisponiblesProfesor:', error);
        return res.status(500).json({ message: 'Error al obtener asignaturas disponibles' });
    }
};
exports.obtenerMateriasDisponiblesProfesor = obtenerMateriasDisponiblesProfesor;
const crearHorario = async (req, res) => {
    try {
        const profesorId = req.user?.id;
        if (!profesorId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const { nombreProfesor, materia, semestre, dia, dias, horaInicio, horaFin, franjas } = req.body;
        const profesorDoc = await Usuario_1.default.findById(profesorId).select('nombre');
        const nombreLimpio = typeof nombreProfesor === 'string' && nombreProfesor.trim() !== ''
            ? nombreProfesor.trim()
            : profesorDoc?.nombre || '';
        if (!nombreLimpio) {
            return res.status(400).json({ message: 'El nombre del profesor es obligatorio' });
        }
        const materiaLimpia = typeof materia === 'string' ? materia.trim() : '';
        if (!materiaLimpia) {
            return res.status(400).json({ message: 'La asignatura es obligatoria' });
        }
        const numSemestre = Number(semestre);
        if (!Number.isInteger(numSemestre) || numSemestre < 1 || numSemestre > 12) {
            return res
                .status(400)
                .json({ message: 'El semestre es obligatorio y debe estar entre 1 y 12' });
        }
        const diasListaRaw = Array.isArray(dias)
            ? dias
            : typeof dia === 'string' && dia.trim() !== ''
                ? [dia.trim()]
                : [];
        const diasLista = Array.from(new Set(diasListaRaw.map((d) => (typeof d === 'string' ? d.trim() : '')).filter(Boolean)));
        if (diasLista.length === 0 || diasLista.some((d) => !DIAS_VALIDOS.includes(d))) {
            return res.status(400).json({
                message: 'Debes seleccionar al menos un día válido (Lunes a Sábado)',
            });
        }
        const franjasListaRaw = Array.isArray(franjas)
            ? franjas
            : typeof horaInicio === 'string' && typeof horaFin === 'string'
                ? [{ horaInicio, horaFin }]
                : [];
        if (franjasListaRaw.length === 0) {
            return res.status(400).json({ message: 'Debes agregar al menos una franja horaria' });
        }
        const franjasLista = [];
        for (const f of franjasListaRaw) {
            const inicio = typeof f.horaInicio === 'string' ? f.horaInicio.trim() : '';
            const fin = typeof f.horaFin === 'string' ? f.horaFin.trim() : '';
            if (!inicio || !fin) {
                return res.status(400).json({
                    message: 'Cada franja debe tener hora de inicio y hora de finalización',
                });
            }
            if (inicio >= fin) {
                return res.status(400).json({
                    message: 'La hora de finalización debe ser mayor a la hora de inicio en cada franja',
                });
            }
            franjasLista.push({ horaInicio: inicio, horaFin: fin });
        }
        const nuevosHorarios = [];
        for (const d of diasLista) {
            for (const f of franjasLista) {
                const existe = await HorarioDisponible_1.default.findOne({
                    profesor: profesorId,
                    materia: materiaLimpia,
                    dia: d,
                    horaInicio: f.horaInicio,
                    horaFin: f.horaFin,
                });
                if (!existe) {
                    const creado = await HorarioDisponible_1.default.create({
                        profesor: profesorId,
                        nombreProfesor: nombreLimpio,
                        materia: materiaLimpia,
                        semestre: numSemestre,
                        dia: d,
                        horaInicio: f.horaInicio,
                        horaFin: f.horaFin,
                    });
                    nuevosHorarios.push(creado);
                }
            }
        }
        // Asociar la materia también al perfil del profesor para búsquedas y solicitudes
        await Usuario_1.default.findByIdAndUpdate(profesorId, {
            $addToSet: { materias: materiaLimpia },
        });
        if (nuevosHorarios.length === 0) {
            return res.status(409).json({
                message: 'Las franjas seleccionadas para esta asignatura ya estaban registradas',
            });
        }
        return res.status(201).json({
            message: `Se registraron ${nuevosHorarios.length} ${nuevosHorarios.length === 1 ? 'franja horaria' : 'franjas horarias'} correctamente`,
            creados: nuevosHorarios.length,
            horarios: nuevosHorarios,
        });
    }
    catch (error) {
        console.error('Error en crearHorario:', error);
        return res.status(500).json({ message: 'Error al crear horario' });
    }
};
exports.crearHorario = crearHorario;
const actualizarHorario = async (req, res) => {
    try {
        const { id } = req.params;
        const horario = await HorarioDisponible_1.default.findById(id);
        if (!horario) {
            return res.status(404).json({ message: 'Horario no encontrado' });
        }
        if (req.user?.rol === 'profesor' && String(horario.profesor) !== req.user.id) {
            return res.status(403).json({ message: 'No tienes permiso para modificar este horario' });
        }
        const { nombreProfesor, materia, semestre, dia, horaInicio, horaFin } = req.body;
        const nombreLimpio = typeof nombreProfesor === 'string' && nombreProfesor.trim() !== ''
            ? nombreProfesor.trim()
            : horario.nombreProfesor;
        const materiaLimpia = typeof materia === 'string' ? materia.trim() : horario.materia;
        const numSemestre = semestre !== undefined ? Number(semestre) : horario.semestre;
        const diaLimpio = typeof dia === 'string' ? dia.trim() : horario.dia;
        const inicioLimpio = typeof horaInicio === 'string' ? horaInicio.trim() : horario.horaInicio;
        const finLimpio = typeof horaFin === 'string' ? horaFin.trim() : horario.horaFin;
        if (!nombreLimpio) {
            return res.status(400).json({ message: 'El nombre del profesor es obligatorio' });
        }
        if (!materiaLimpia) {
            return res.status(400).json({ message: 'La asignatura es obligatoria' });
        }
        if (!Number.isInteger(numSemestre) || numSemestre < 1 || numSemestre > 12) {
            return res
                .status(400)
                .json({ message: 'El semestre es obligatorio y debe estar entre 1 y 12' });
        }
        if (!DIAS_VALIDOS.includes(diaLimpio)) {
            return res.status(400).json({
                message: 'Debes seleccionar un día válido (Lunes a Sábado)',
            });
        }
        if (!inicioLimpio || !finLimpio || inicioLimpio >= finLimpio) {
            return res.status(400).json({
                message: 'La hora de finalización debe ser mayor a la hora de inicio',
            });
        }
        const cambiaFranjaOMateria = diaLimpio !== horario.dia ||
            inicioLimpio !== horario.horaInicio ||
            finLimpio !== horario.horaFin ||
            normalizarTexto(materiaLimpia) !== normalizarTexto(horario.materia);
        if (cambiaFranjaOMateria) {
            const tutoriasAceptadas = await buscarTutoriasAceptadasDeHorario(horario);
            if (tutoriasAceptadas.length > 0) {
                return res.status(400).json({
                    message: 'No puedes cambiar el día, franja o asignatura de un horario con tutorías ya aceptadas sin antes reprogramarlas o cancelarlas',
                    tutoriasAceptadas,
                });
            }
        }
        const duplicado = await HorarioDisponible_1.default.findOne({
            _id: { $ne: id },
            profesor: horario.profesor,
            materia: materiaLimpia,
            dia: diaLimpio,
            horaInicio: inicioLimpio,
            horaFin: finLimpio,
        });
        if (duplicado) {
            return res.status(409).json({
                message: 'Ya existe otro horario registrado con la misma asignatura, día y franja',
            });
        }
        horario.nombreProfesor = nombreLimpio;
        horario.materia = materiaLimpia;
        horario.semestre = numSemestre;
        horario.dia = diaLimpio;
        horario.horaInicio = inicioLimpio;
        horario.horaFin = finLimpio;
        await horario.save();
        await Usuario_1.default.findByIdAndUpdate(horario.profesor, {
            $addToSet: { materias: materiaLimpia },
        });
        return res.json({
            message: 'Horario actualizado correctamente',
            horario,
        });
    }
    catch (error) {
        console.error('Error en actualizarHorario:', error);
        return res.status(500).json({ message: 'Error al actualizar horario' });
    }
};
exports.actualizarHorario = actualizarHorario;
const eliminarHorario = async (req, res) => {
    try {
        const { id } = req.params;
        const horario = await HorarioDisponible_1.default.findById(id);
        if (!horario) {
            return res.status(404).json({ message: 'Horario no encontrado' });
        }
        if (req.user?.rol === 'profesor' && String(horario.profesor) !== req.user.id) {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este horario' });
        }
        const tutoriasAceptadas = await buscarTutoriasAceptadasDeHorario(horario);
        if (tutoriasAceptadas.length > 0) {
            return res.status(400).json({
                message: 'No se puede eliminar este horario porque tiene tutorías aceptadas asociadas. Debes reprogramarlas o cancelarlas primero.',
                tutoriasAceptadas,
            });
        }
        await HorarioDisponible_1.default.findByIdAndDelete(id);
        return res.json({ message: 'Horario eliminado correctamente' });
    }
    catch (error) {
        console.error('Error en eliminarHorario:', error);
        return res.status(500).json({ message: 'Error al eliminar horario' });
    }
};
exports.eliminarHorario = eliminarHorario;
