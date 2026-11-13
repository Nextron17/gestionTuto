"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizarTutoria = exports.agregarRecurso = exports.registrarAsistencia = exports.inscribirseTutoriaGrupal = exports.cambiarEstadoTutoria = exports.crearTutoria = exports.obtenerTutoriasGrupales = exports.obtenerTutorias = void 0;
const SolicitudTutoria_1 = __importDefault(require("../models/SolicitudTutoria"));
const Usuario_1 = __importDefault(require("../models/Usuario"));
const Recurso_1 = __importDefault(require("../models/Recurso"));
const obtenerTutorias = async (req, res) => {
    try {
        let filtro = {};
        if (req.user?.rol === 'estudiante') {
            filtro = {
                $or: [
                    { estudiante: req.user.id },
                    { 'participantes.estudiante': req.user.id },
                ],
            };
        }
        else if (req.user?.rol === 'profesor') {
            filtro = { profesor: req.user.id };
        }
        const tutorias = await SolicitudTutoria_1.default.find(filtro)
            .populate('estudiante', 'nombre email carrera semestre')
            .populate('participantes.estudiante', 'nombre email carrera semestre')
            .populate('profesor', 'nombre email escuela carrera')
            .sort({ createdAt: -1 });
        return res.json(tutorias);
    }
    catch (error) {
        console.error('Error en obtenerTutorias:', error);
        return res.status(500).json({ message: 'Error al obtener tutorías' });
    }
};
exports.obtenerTutorias = obtenerTutorias;
const obtenerTutoriasGrupales = async (req, res) => {
    try {
        const tutorias = await SolicitudTutoria_1.default.find({
            tipo: 'grupal',
            estado: 'aceptada',
        })
            .populate('estudiante', 'nombre email carrera semestre')
            .populate('participantes.estudiante', 'nombre email carrera semestre')
            .populate('profesor', 'nombre email escuela carrera')
            .sort({ createdAt: -1 });
        if (req.user?.rol === 'estudiante') {
            const alumno = await Usuario_1.default.findById(req.user.id).select('carrera');
            if (alumno?.carrera && alumno.carrera.trim() !== '') {
                const filtradas = tutorias.filter((t) => {
                    const prof = t.profesor;
                    return !prof?.carrera || prof.carrera === alumno.carrera;
                });
                return res.json(filtradas);
            }
        }
        return res.json(tutorias);
    }
    catch (error) {
        console.error('Error en obtenerTutoriasGrupales:', error);
        return res.status(500).json({ message: 'Error al obtener tutorías grupales' });
    }
};
exports.obtenerTutoriasGrupales = obtenerTutoriasGrupales;
const crearTutoria = async (req, res) => {
    try {
        const { materia, descripcion, tema, profesorId, hora, modalidad, tipo } = req.body;
        const nueva = new SolicitudTutoria_1.default({
            materia,
            descripcion,
            tema,
            profesor: profesorId || undefined,
            hora,
            modalidad: modalidad || 'virtual',
            tipo: tipo || 'individual',
            estudiante: req.user?.id,
            estado: 'pendiente',
        });
        await nueva.save();
        return res.status(201).json(nueva);
    }
    catch (error) {
        console.error('Error en crearTutoria:', error);
        return res.status(500).json({ message: 'Error al crear la solicitud' });
    }
};
exports.crearTutoria = crearTutoria;
const cambiarEstadoTutoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, hora, modalidad, tipo, cupoMaximo, comentarioProfesor, enlaceGrabacion, } = req.body;
        const tutoria = await SolicitudTutoria_1.default.findById(id);
        if (!tutoria) {
            return res.status(404).json({ message: 'Tutoría no encontrada' });
        }
        if (req.user?.rol === 'estudiante') {
            if (estado !== 'cancelada') {
                return res.status(403).json({ message: 'Solo puedes cancelar tu solicitud' });
            }
            if (tutoria.estado !== 'pendiente' && tutoria.estado !== 'aplazada') {
                return res.status(400).json({ message: 'Solo se pueden cancelar solicitudes pendientes o aplazadas' });
            }
            tutoria.estado = 'cancelada';
            await tutoria.save();
            return res.json(tutoria);
        }
        if (estado)
            tutoria.estado = estado;
        if (hora !== undefined)
            tutoria.hora = hora;
        if (modalidad)
            tutoria.modalidad = modalidad;
        if (tipo)
            tutoria.tipo = tipo;
        if (cupoMaximo !== undefined)
            tutoria.cupoMaximo = Number(cupoMaximo);
        if (comentarioProfesor !== undefined)
            tutoria.comentarioProfesor = comentarioProfesor;
        if (enlaceGrabacion !== undefined)
            tutoria.enlaceGrabacion = enlaceGrabacion;
        await tutoria.save();
        return res.json(tutoria);
    }
    catch (error) {
        console.error('Error en cambiarEstadoTutoria:', error);
        return res.status(500).json({ message: 'Error al actualizar tutoría' });
    }
};
exports.cambiarEstadoTutoria = cambiarEstadoTutoria;
const inscribirseTutoriaGrupal = async (req, res) => {
    try {
        const { id } = req.params;
        const estudianteId = req.user?.id;
        if (!estudianteId) {
            return res.status(401).json({ message: 'No autenticado' });
        }
        const tutoria = await SolicitudTutoria_1.default.findById(id);
        if (!tutoria) {
            return res.status(404).json({ message: 'Tutoría no encontrada' });
        }
        if (tutoria.tipo !== 'grupal' || tutoria.estado !== 'aceptada') {
            return res.status(400).json({ message: 'Esta tutoría no está disponible para inscripción grupal' });
        }
        if (tutoria.estudiante.toString() === estudianteId) {
            return res.status(400).json({ message: 'Ya eres el solicitante principal de esta tutoría' });
        }
        const yaInscrito = tutoria.participantes.some((p) => p.estudiante.toString() === estudianteId);
        if (yaInscrito) {
            return res.status(400).json({ message: 'Ya estás inscrito en esta tutoría grupal' });
        }
        const totalActual = 1 + tutoria.participantes.length;
        if (totalActual >= (tutoria.cupoMaximo || 10)) {
            return res.status(400).json({ message: 'Cupo máximo alcanzado para esta tutoría' });
        }
        tutoria.participantes.push({ estudiante: estudianteId, asistio: null });
        await tutoria.save();
        return res.json({ message: 'Inscripción exitosa', tutoria });
    }
    catch (error) {
        console.error('Error en inscribirseTutoriaGrupal:', error);
        return res.status(500).json({ message: 'Error al inscribirse en la tutoría grupal' });
    }
};
exports.inscribirseTutoriaGrupal = inscribirseTutoriaGrupal;
const registrarAsistencia = async (req, res) => {
    try {
        const { id } = req.params;
        const { asistenciaEstudiante, participantes } = req.body;
        const tutoria = await SolicitudTutoria_1.default.findById(id);
        if (!tutoria) {
            return res.status(404).json({ message: 'Tutoría no encontrada' });
        }
        if (asistenciaEstudiante !== undefined) {
            tutoria.asistenciaEstudiante = asistenciaEstudiante;
        }
        if (Array.isArray(participantes)) {
            tutoria.participantes = tutoria.participantes.map((p) => {
                const encontrado = participantes.find((item) => item.estudianteId === p.estudiante.toString());
                if (encontrado) {
                    p.asistio = encontrado.asistio;
                }
                return p;
            });
        }
        await tutoria.save();
        return res.json(tutoria);
    }
    catch (error) {
        console.error('Error en registrarAsistencia:', error);
        return res.status(500).json({ message: 'Error al guardar asistencia' });
    }
};
exports.registrarAsistencia = registrarAsistencia;
const agregarRecurso = async (req, res) => {
    try {
        const { id } = req.params;
        const { link } = req.body;
        const actualizada = await SolicitudTutoria_1.default.findByIdAndUpdate(id, { $push: { recursos: link } }, { new: true });
        return res.json(actualizada);
    }
    catch (error) {
        console.error('Error en agregarRecurso:', error);
        return res.status(500).json({ message: 'Error al agregar recurso' });
    }
};
exports.agregarRecurso = agregarRecurso;
const finalizarTutoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { enlaceGrabacion, comentarioProfesor } = req.body || {};
        const tutoria = await SolicitudTutoria_1.default.findById(id);
        if (!tutoria) {
            return res.status(404).json({ message: 'Tutoría no encontrada' });
        }
        if (enlaceGrabacion !== undefined)
            tutoria.enlaceGrabacion = enlaceGrabacion;
        if (comentarioProfesor !== undefined)
            tutoria.comentarioProfesor = comentarioProfesor;
        tutoria.estado = 'finalizada';
        await tutoria.save();
        const nombreClase = `Clase: ${tutoria.materia}${tutoria.tema ? ` - ${tutoria.tema}` : ''}`;
        const enlacesParaPublicar = [...(tutoria.recursos || [])];
        if (tutoria.enlaceGrabacion && tutoria.enlaceGrabacion.trim() !== '') {
            enlacesParaPublicar.push(tutoria.enlaceGrabacion.trim());
        }
        if (tutoria.profesor && enlacesParaPublicar.length > 0) {
            const profesorDoc = await Usuario_1.default.findById(tutoria.profesor).select('escuela');
            const escuelaProfesor = profesorDoc?.escuela || 'General';
            for (let i = 0; i < enlacesParaPublicar.length; i++) {
                const url = enlacesParaPublicar[i];
                const esGrabacion = url === tutoria.enlaceGrabacion;
                const tituloRecurso = esGrabacion
                    ? `${nombreClase} (Grabación de sesión)`
                    : `${nombreClase} - Material #${i + 1}`;
                const existe = await Recurso_1.default.findOne({
                    titulo: tituloRecurso,
                    link: url,
                    profesor: tutoria.profesor,
                });
                if (!existe) {
                    await Recurso_1.default.create({
                        titulo: tituloRecurso,
                        escuela: escuelaProfesor,
                        materia: tutoria.materia,
                        tema: tutoria.tema || '',
                        claseOrigen: nombreClase,
                        link: url,
                        profesor: tutoria.profesor,
                    });
                }
            }
        }
        return res.json(tutoria);
    }
    catch (error) {
        console.error('Error en finalizarTutoria:', error);
        return res.status(500).json({ message: 'Error al finalizar tutoría' });
    }
};
exports.finalizarTutoria = finalizarTutoria;
