import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import SolicitudTutoria from '../models/SolicitudTutoria';
import Usuario from '../models/Usuario';
import Recurso from '../models/Recurso';

function extraerIdUsuario(ref: unknown): string {
  if (!ref) return '';
  if (typeof ref === 'object' && ref !== null && '_id' in ref) {
    return String((ref as { _id: unknown })._id || '');
  }
  return String(ref);
}

function esEstudianteInscritoEnTutoria(
  tutoria: {
    estudiante?: unknown;
    participantes?: { estudiante?: unknown }[];
  },
  usuarioId?: string
): boolean {
  if (!usuarioId) return false;
  if (extraerIdUsuario(tutoria.estudiante) === String(usuarioId)) {
    return true;
  }
  return Array.isArray(tutoria.participantes)
    ? tutoria.participantes.some((p) => extraerIdUsuario(p.estudiante) === String(usuarioId))
    : false;
}

function obtenerAsistenciaEstudianteEnTutoria(
  tutoria: {
    estudiante?: unknown;
    asistenciaEstudiante?: boolean | null;
    participantes?: { estudiante?: unknown; asistio?: boolean | null }[];
  },
  usuarioId?: string
): boolean | null {
  if (!usuarioId) return null;
  if (extraerIdUsuario(tutoria.estudiante) === String(usuarioId)) {
    return tutoria.asistenciaEstudiante ?? null;
  }
  const part = Array.isArray(tutoria.participantes)
    ? tutoria.participantes.find((p) => extraerIdUsuario(p.estudiante) === String(usuarioId))
    : undefined;
  return part?.asistio ?? null;
}

function sanitizarEnlacesSegunInscripcion<
  T extends {
    toObject?: () => Record<string, unknown>;
    estudiante?: unknown;
    asistenciaEstudiante?: boolean | null;
    participantes?: { estudiante?: unknown; asistio?: boolean | null }[];
    enlaceReunion?: string;
    enlaceGrabacion?: string;
    comentarioProfesor?: string;
  },
>(tutoriaDoc: T, user?: { id?: string; rol?: string }) {
  const obj =
    typeof tutoriaDoc.toObject === 'function'
      ? (tutoriaDoc.toObject() as Record<string, unknown>)
      : ({ ...tutoriaDoc } as Record<string, unknown>);

  if (!user || user.rol !== 'estudiante') {
    return {
      ...obj,
      esInscrito: true,
      accesoEnlaces: true,
    };
  }

  const inscrito = esEstudianteInscritoEnTutoria(tutoriaDoc, user.id);
  if (inscrito) {
    return {
      ...obj,
      esInscrito: true,
      accesoEnlaces: true,
      miAsistencia: obtenerAsistenciaEstudianteEnTutoria(tutoriaDoc, user.id),
    };
  }

  const comentarioOriginal =
    typeof obj.comentarioProfesor === 'string' ? obj.comentarioProfesor.trim() : '';
  const comentarioSeguro = /^https?:\/\//i.test(comentarioOriginal) ? '' : comentarioOriginal;

  return {
    ...obj,
    enlaceReunion: '',
    enlaceGrabacion: '',
    comentarioProfesor: comentarioSeguro,
    esInscrito: false,
    accesoEnlaces: false,
    miAsistencia: null,
  };
}

export const obtenerTutorias = async (req: AuthRequest, res: Response) => {
  try {
    const condiciones: Record<string, unknown>[] = [];

    if (req.user?.rol === 'estudiante') {
      condiciones.push({
        $or: [{ estudiante: req.user.id }, { 'participantes.estudiante': req.user.id }],
      });
    } else if (req.user?.rol === 'profesor') {
      condiciones.push({ profesor: req.user.id });
    }

    const { estado, materia, tema, modalidad, fecha, asistencia } = req.query;
    if (
      typeof estado === 'string' &&
      ['pendiente', 'aceptada', 'cancelada', 'aplazada', 'finalizada'].includes(estado)
    ) {
      condiciones.push({ estado });
    }

    if (typeof materia === 'string' && materia.trim() !== '') {
      const escaped = materia.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      condiciones.push({ materia: { $regex: escaped, $options: 'i' } });
    }

    if (typeof tema === 'string' && tema.trim() !== '') {
      const escaped = tema.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      condiciones.push({ tema: { $regex: escaped, $options: 'i' } });
    }

    if (typeof modalidad === 'string' && ['virtual', 'presencial'].includes(modalidad.trim())) {
      condiciones.push({ modalidad: modalidad.trim() });
    }

    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha.trim())) {
      const inicioDia = new Date(`${fecha.trim()}T00:00:00.000Z`);
      const finDia = new Date(`${fecha.trim()}T23:59:59.999Z`);
      condiciones.push({
        $or: [
          { fechaPropuesta: { $gte: inicioDia, $lte: finDia } },
          { fechaPropuesta: { $exists: false }, createdAt: { $gte: inicioDia, $lte: finDia } },
        ],
      });
    }

    const filtroFinal = condiciones.length > 0 ? { $and: condiciones } : {};

    const tutorias = await SolicitudTutoria.find(filtroFinal)
      .populate('estudiante', 'nombre email carrera semestre')
      .populate('participantes.estudiante', 'nombre email carrera semestre')
      .populate('profesor', 'nombre email escuela carrera')
      .sort({ createdAt: -1 });

    let respuesta = tutorias.map((t) => sanitizarEnlacesSegunInscripcion(t, req.user));

    if (
      req.user?.rol === 'estudiante' &&
      typeof asistencia === 'string' &&
      ['true', 'false', 'pendiente'].includes(asistencia.trim())
    ) {
      const filtroAsis = asistencia.trim();
      respuesta = respuesta.filter((item) => {
        const valor = (item as { miAsistencia?: boolean | null }).miAsistencia ?? null;
        if (filtroAsis === 'true') return valor === true;
        if (filtroAsis === 'false') return valor === false;
        return valor === null;
      });
    }

    return res.json(respuesta);
  } catch (error) {
    console.error('Error en obtenerTutorias:', error);
    return res.status(500).json({ message: 'Error al obtener tutorías' });
  }
};

export const obtenerTutoriasGrupales = async (req: AuthRequest, res: Response) => {
  try {
    const tutorias = await SolicitudTutoria.find({
      tipo: 'grupal',
      estado: 'aceptada',
    })
      .populate('estudiante', 'nombre email carrera semestre')
      .populate('participantes.estudiante', 'nombre email carrera semestre')
      .populate('profesor', 'nombre email escuela carrera')
      .sort({ createdAt: -1 });

    let listaBase = tutorias;
    if (req.user?.rol === 'estudiante') {
      const alumno = await Usuario.findById(req.user.id).select('carrera');
      if (alumno?.carrera && alumno.carrera.trim() !== '') {
        listaBase = tutorias.filter((t) => {
          const prof = t.profesor as unknown as { carrera?: string } | null;
          return !prof?.carrera || prof.carrera === alumno.carrera;
        });
      }
    }

    const respuesta = listaBase.map((t) => sanitizarEnlacesSegunInscripcion(t, req.user));
    return res.json(respuesta);
  } catch (error) {
    console.error('Error en obtenerTutoriasGrupales:', error);
    return res.status(500).json({ message: 'Error al obtener tutorías grupales' });
  }
};

export const obtenerEnlacesTutoria = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tutoria = await SolicitudTutoria.findById(id)
      .populate('estudiante', 'nombre email')
      .populate('participantes.estudiante', 'nombre email')
      .populate('profesor', 'nombre email');

    if (!tutoria) {
      return res.status(404).json({ message: 'Tutoría no encontrada' });
    }

    if (req.user?.rol === 'estudiante' && !esEstudianteInscritoEnTutoria(tutoria, req.user.id)) {
      return res.status(403).json({
        message:
          'El enlace de reunión y la grabación solo son visibles para los estudiantes inscritos en esta tutoría',
      });
    }

    return res.json({
      _id: tutoria._id,
      materia: tutoria.materia,
      tema: tutoria.tema,
      modalidad: tutoria.modalidad,
      hora: tutoria.hora,
      lugar: tutoria.lugar,
      enlaceReunion: tutoria.enlaceReunion || '',
      enlaceGrabacion: tutoria.enlaceGrabacion || '',
      recursos: tutoria.recursos || [],
      esInscrito: true,
    });
  } catch (error) {
    console.error('Error en obtenerEnlacesTutoria:', error);
    return res.status(500).json({ message: 'Error al consultar enlaces de la tutoría' });
  }
};

export const crearTutoria = async (req: AuthRequest, res: Response) => {
  try {
    const { materia, descripcion, tema, profesorId, hora, modalidad, tipo, fechaPropuesta } =
      req.body;

    const estudianteId = req.user?.id;
    const profesorLimpio = typeof profesorId === 'string' ? profesorId.trim() : '';
    const materiaLimpia = typeof materia === 'string' ? materia.trim() : '';
    const temaLimpio = typeof tema === 'string' ? tema.trim() : '';
    const horaLimpia = typeof hora === 'string' ? hora.trim() : '';

    if (!estudianteId || !profesorLimpio || !materiaLimpia || !temaLimpio || !horaLimpia) {
      return res.status(400).json({
        message:
          'La solicitud debe incluir estudiante, profesor, materia, tema específico y horario elegido',
      });
    }

    let fechaParsed: Date = new Date();
    if (fechaPropuesta) {
      const candidate = new Date(fechaPropuesta);
      if (!Number.isNaN(candidate.getTime())) {
        fechaParsed = candidate;
      }
    }

    const descripcionLimpia =
      typeof descripcion === 'string' && descripcion.trim()
        ? descripcion.trim()
        : `Refuerzo académico sobre ${temaLimpio}`;

    const nueva = new SolicitudTutoria({
      materia: materiaLimpia,
      descripcion: descripcionLimpia,
      tema: temaLimpio,
      profesor: profesorLimpio,
      hora: horaLimpia,
      modalidad: modalidad || 'virtual',
      tipo: tipo || 'individual',
      estudiante: estudianteId,
      estado: 'pendiente',
      fechaPropuesta: fechaParsed,
    });
    await nueva.save();
    await nueva.populate([
      { path: 'estudiante', select: 'nombre email carrera semestre' },
      { path: 'profesor', select: 'nombre email escuela carrera' },
    ]);
    return res.status(201).json(nueva);
  } catch (error) {
    console.error('Error en crearTutoria:', error);
    return res.status(500).json({ message: 'Error al crear la solicitud' });
  }
};

export const cambiarEstadoTutoria = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      estado,
      hora,
      modalidad,
      tipo,
      cupoMaximo,
      lugar,
      comentarioProfesor,
      motivoCancelacion,
      comentarioEstudiante,
      enlaceReunion,
      enlaceGrabacion,
      fechaPropuesta,
    } = req.body;

    const ESTADOS_VALIDOS = ['pendiente', 'aceptada', 'cancelada', 'aplazada', 'finalizada'];
    if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ message: 'Estado de solicitud no válido' });
    }
    if (modalidad !== undefined && !['presencial', 'virtual'].includes(modalidad)) {
      return res.status(400).json({ message: 'Modalidad de tutoría no válida' });
    }
    if (tipo !== undefined && !['individual', 'grupal'].includes(tipo)) {
      return res.status(400).json({ message: 'Tipo de tutoría no válido' });
    }

    const tutoria = await SolicitudTutoria.findById(id);
    if (!tutoria) {
      return res.status(404).json({ message: 'Tutoría no encontrada' });
    }

    if (req.user?.rol === 'estudiante') {
      if (String(tutoria.estudiante) !== String(req.user.id)) {
        return res
          .status(403)
          .json({ message: 'No tienes permiso para cancelar una solicitud de otro estudiante' });
      }
      if (estado !== 'cancelada') {
        return res.status(403).json({ message: 'Solo puedes cancelar tu solicitud' });
      }
      if (tutoria.estado !== 'pendiente' && tutoria.estado !== 'aplazada') {
        return res
          .status(400)
          .json({ message: 'Solo se pueden cancelar solicitudes pendientes o aplazadas' });
      }
      tutoria.estado = 'cancelada';
      tutoria.canceladaPor = 'estudiante';
      tutoria.fechaCancelacion = new Date();
      const motivoLimpio =
        typeof motivoCancelacion === 'string'
          ? motivoCancelacion.trim()
          : typeof comentarioEstudiante === 'string'
            ? comentarioEstudiante.trim()
            : '';
      if (motivoLimpio) {
        tutoria.motivoCancelacion = motivoLimpio;
      }
      await tutoria.save();
      const pobladaEst = await SolicitudTutoria.findById(tutoria._id)
        .populate('estudiante', 'nombre email carrera semestre')
        .populate('participantes.estudiante', 'nombre email carrera semestre')
        .populate('profesor', 'nombre email escuela carrera');
      return res.json(pobladaEst || tutoria);
    }

    const estadoFinal = estado ?? tutoria.estado;
    const modalidadFinal = modalidad ?? tutoria.modalidad;
    const lugarFinal = lugar !== undefined ? String(lugar).trim() : (tutoria.lugar || '').trim();

    if (estadoFinal === 'aceptada' && modalidadFinal === 'presencial' && !lugarFinal) {
      return res.status(400).json({
        message: 'Al aceptar una tutoría presencial es obligatorio especificar el lugar o salón',
      });
    }

    if (estado) {
      tutoria.estado = estado;
      if (estado === 'cancelada') {
        tutoria.canceladaPor = 'profesor';
        tutoria.fechaCancelacion = new Date();
        if (typeof motivoCancelacion === 'string' && motivoCancelacion.trim()) {
          tutoria.motivoCancelacion = motivoCancelacion.trim();
        }
      }
    }
    if (hora !== undefined) tutoria.hora = hora;
    if (modalidad) tutoria.modalidad = modalidad;
    if (tipo) tutoria.tipo = tipo;

    const tipoFinal = tipo ?? tutoria.tipo;
    if (tipoFinal === 'individual') {
      tutoria.cupoMaximo = 1;
    } else if (cupoMaximo !== undefined) {
      tutoria.cupoMaximo = Number(cupoMaximo);
    }

    if (lugar !== undefined) tutoria.lugar = String(lugar).trim();
    if (comentarioProfesor !== undefined) tutoria.comentarioProfesor = comentarioProfesor;
    if (enlaceReunion !== undefined) tutoria.enlaceReunion = enlaceReunion;
    if (enlaceGrabacion !== undefined) tutoria.enlaceGrabacion = enlaceGrabacion;
    if (fechaPropuesta) {
      const candidate = new Date(fechaPropuesta);
      if (!Number.isNaN(candidate.getTime())) {
        tutoria.fechaPropuesta = candidate;
      }
    }

    if (
      estado !== undefined ||
      comentarioProfesor !== undefined ||
      hora !== undefined ||
      lugar !== undefined ||
      enlaceReunion !== undefined
    ) {
      tutoria.fechaRespuestaProfesor = new Date();
    }

    await tutoria.save();

    const tutoriaActualizada = await SolicitudTutoria.findById(tutoria._id)
      .populate('estudiante', 'nombre email carrera semestre')
      .populate('participantes.estudiante', 'nombre email carrera semestre')
      .populate('profesor', 'nombre email escuela carrera');

    return res.json(tutoriaActualizada || tutoria);
  } catch (error) {
    console.error('Error en cambiarEstadoTutoria:', error);
    return res.status(500).json({ message: 'Error al actualizar tutoría' });
  }
};

export const cancelarSolicitudTutoria = async (req: AuthRequest, res: Response) => {
  req.body = {
    ...(req.body || {}),
    estado: 'cancelada',
  };
  return cambiarEstadoTutoria(req, res);
};

export const inscribirseTutoriaGrupal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const estudianteId = req.user?.id;

    if (!estudianteId) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    if (req.user?.rol && req.user.rol !== 'estudiante') {
      return res
        .status(403)
        .json({ message: 'Solo los estudiantes pueden inscribirse en tutorías grupales' });
    }

    const tutoria = await SolicitudTutoria.findById(id);
    if (!tutoria) {
      return res.status(404).json({ message: 'Tutoría no encontrada' });
    }

    if (tutoria.tipo !== 'grupal' || tutoria.estado !== 'aceptada') {
      return res
        .status(400)
        .json({ message: 'Esta tutoría no está disponible para inscripción grupal' });
    }

    if (String(tutoria.estudiante) === String(estudianteId)) {
      return res.status(400).json({ message: 'Ya eres el solicitante principal de esta tutoría' });
    }

    const yaInscrito = tutoria.participantes.some(
      (p) => String(p.estudiante) === String(estudianteId)
    );
    if (yaInscrito) {
      return res.status(400).json({ message: 'Ya estás inscrito en esta tutoría grupal' });
    }

    const totalActual = 1 + tutoria.participantes.length;
    const tieneCupoMaximo = typeof tutoria.cupoMaximo === 'number' && tutoria.cupoMaximo > 0;
    if (tieneCupoMaximo && totalActual >= tutoria.cupoMaximo) {
      return res.status(400).json({ message: 'Cupo máximo alcanzado para esta tutoría' });
    }

    tutoria.participantes.push({ estudiante: estudianteId as unknown as never, asistio: null });
    await tutoria.save();

    const tutoriaPoblada = await SolicitudTutoria.findById(tutoria._id)
      .populate('estudiante', 'nombre email carrera semestre')
      .populate('participantes.estudiante', 'nombre email carrera semestre')
      .populate('profesor', 'nombre email escuela carrera');

    return res.json({
      message: 'Inscripción exitosa en la tutoría grupal',
      cuposOcupados: 1 + tutoria.participantes.length,
      cupoMaximo: tieneCupoMaximo ? tutoria.cupoMaximo : null,
      tutoria: tutoriaPoblada || tutoria,
    });
  } catch (error) {
    console.error('Error en inscribirseTutoriaGrupal:', error);
    return res.status(500).json({ message: 'Error al inscribirse en la tutoría grupal' });
  }
};

export const registrarAsistencia = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      asistenciaEstudiante,
      participantes,
      modalidad,
      tipo,
      cupoMaximo,
      lugar,
      enlaceReunion,
      comentarioProfesor,
      enlaceGrabacion,
    } = req.body;

    const tutoria = await SolicitudTutoria.findById(id);
    if (!tutoria) {
      return res.status(404).json({ message: 'Tutoría no encontrada' });
    }

    if (modalidad === 'virtual' || modalidad === 'presencial') {
      tutoria.modalidad = modalidad;
    }
    if (tipo === 'individual' || tipo === 'grupal') {
      tutoria.tipo = tipo;
      if (tipo === 'individual') {
        tutoria.cupoMaximo = 1;
      } else if (cupoMaximo !== undefined) {
        tutoria.cupoMaximo = Number(cupoMaximo);
      }
    } else if (cupoMaximo !== undefined && tutoria.tipo === 'grupal') {
      tutoria.cupoMaximo = Number(cupoMaximo);
    }
    if (lugar !== undefined) {
      tutoria.lugar = String(lugar).trim();
    }
    if (enlaceReunion !== undefined) {
      tutoria.enlaceReunion = enlaceReunion;
    }
    if (comentarioProfesor !== undefined) {
      tutoria.comentarioProfesor = comentarioProfesor;
    }
    if (enlaceGrabacion !== undefined) {
      tutoria.enlaceGrabacion = enlaceGrabacion;
    }

    if (asistenciaEstudiante !== undefined) {
      tutoria.asistenciaEstudiante = asistenciaEstudiante;
    }

    if (Array.isArray(participantes)) {
      tutoria.participantes = tutoria.participantes.map((p) => {
        const encontrado = participantes.find(
          (item: { estudianteId: string; asistio: boolean | null }) =>
            item.estudianteId === p.estudiante.toString()
        );
        if (encontrado) {
          p.asistio = encontrado.asistio;
        }
        return p;
      });
    }

    await tutoria.save();

    const tutoriaActualizada = await SolicitudTutoria.findById(tutoria._id)
      .populate('estudiante', 'nombre email carrera semestre')
      .populate('participantes.estudiante', 'nombre email carrera semestre')
      .populate('profesor', 'nombre email escuela carrera');

    return res.json(tutoriaActualizada || tutoria);
  } catch (error) {
    console.error('Error en registrarAsistencia:', error);
    return res.status(500).json({ message: 'Error al guardar asistencia' });
  }
};

export const agregarRecurso = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { link } = req.body;
    const actualizada = await SolicitudTutoria.findByIdAndUpdate(
      id,
      { $push: { recursos: link } },
      { new: true }
    );
    return res.json(actualizada);
  } catch (error) {
    console.error('Error en agregarRecurso:', error);
    return res.status(500).json({ message: 'Error al agregar recurso' });
  }
};

export const finalizarTutoria = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      modalidad,
      tipo,
      cupoMaximo,
      lugar,
      enlaceReunion,
      enlaceGrabacion,
      comentarioProfesor,
      asistenciaEstudiante,
      participantes,
    } = req.body || {};

    const tutoria = await SolicitudTutoria.findById(id);
    if (!tutoria) {
      return res.status(404).json({ message: 'Tutoría no encontrada' });
    }

    if (modalidad === 'virtual' || modalidad === 'presencial') {
      tutoria.modalidad = modalidad;
    }
    if (tipo === 'individual' || tipo === 'grupal') {
      tutoria.tipo = tipo;
      if (tipo === 'individual') {
        tutoria.cupoMaximo = 1;
      } else if (cupoMaximo !== undefined) {
        tutoria.cupoMaximo = Number(cupoMaximo);
      }
    } else if (cupoMaximo !== undefined && tutoria.tipo === 'grupal') {
      tutoria.cupoMaximo = Number(cupoMaximo);
    }
    if (lugar !== undefined) tutoria.lugar = String(lugar).trim();
    if (enlaceReunion !== undefined) tutoria.enlaceReunion = enlaceReunion;
    if (enlaceGrabacion !== undefined) tutoria.enlaceGrabacion = enlaceGrabacion;
    if (comentarioProfesor !== undefined) tutoria.comentarioProfesor = comentarioProfesor;
    if (asistenciaEstudiante !== undefined) {
      tutoria.asistenciaEstudiante = asistenciaEstudiante;
    }

    if (Array.isArray(participantes)) {
      tutoria.participantes = tutoria.participantes.map((p) => {
        const encontrado = participantes.find(
          (item: { estudianteId: string; asistio: boolean | null }) =>
            item.estudianteId === p.estudiante.toString()
        );
        if (encontrado) {
          p.asistio = encontrado.asistio;
        }
        return p;
      });
    }

    // Validación de evidencia HU-05
    const tieneEnlaceReunion = Boolean(tutoria.enlaceReunion && tutoria.enlaceReunion.trim() !== '');
    const tieneEnlaceGrabacion = Boolean(
      tutoria.enlaceGrabacion && tutoria.enlaceGrabacion.trim() !== ''
    );
    const tieneEnlaceComentario = Boolean(
      tutoria.comentarioProfesor && /https?:\/\/\S+/i.test(tutoria.comentarioProfesor)
    );

    if (
      tutoria.modalidad === 'virtual' &&
      !tieneEnlaceReunion &&
      !tieneEnlaceGrabacion &&
      !tieneEnlaceComentario
    ) {
      return res.status(400).json({
        message: 'Debes registrar el enlace de la reunión virtual como evidencia de la tutoría',
      });
    }

    const faltaAsistenciaPrincipal =
      tutoria.asistenciaEstudiante === null || tutoria.asistenciaEstudiante === undefined;
    const faltaAsistenciaParticipante = tutoria.participantes.some(
      (p) => p.asistio === null || p.asistio === undefined
    );

    if (faltaAsistenciaPrincipal || faltaAsistenciaParticipante) {
      return res.status(400).json({
        message:
          'Debes registrar la asistencia (Asistió o No asistió) de todos los estudiantes antes de finalizar',
      });
    }

    tutoria.estado = 'finalizada';

    await tutoria.save();

    const nombreClase = `Clase: ${tutoria.materia}${tutoria.tema ? ` - ${tutoria.tema}` : ''}`;
    const enlacesParaPublicar = [...(tutoria.recursos || [])];
    if (tutoria.enlaceGrabacion && tutoria.enlaceGrabacion.trim() !== '') {
      enlacesParaPublicar.push(tutoria.enlaceGrabacion.trim());
    }

    if (tutoria.profesor && enlacesParaPublicar.length > 0) {
      const profesorDoc = await Usuario.findById(tutoria.profesor).select('escuela');
      const escuelaProfesor = profesorDoc?.escuela || 'General';

      for (let i = 0; i < enlacesParaPublicar.length; i++) {
        const url = enlacesParaPublicar[i];
        const esGrabacion = url === tutoria.enlaceGrabacion;
        const tituloRecurso = esGrabacion
          ? `${nombreClase} (Grabación de sesión)`
          : `${nombreClase} - Material #${i + 1}`;

        const existe = await Recurso.findOne({
          titulo: tituloRecurso,
          link: url,
          profesor: tutoria.profesor,
        });

        if (!existe) {
          await Recurso.create({
            titulo: tituloRecurso,
            escuela: escuelaProfesor,
            materia: tutoria.materia,
            tema: tutoria.tema || 'General',
            tipo: esGrabacion ? 'video' : 'documento',
            claseOrigen: nombreClase,
            link: url,
            profesor: tutoria.profesor,
          });
        }
      }
    }

    const tutoriaFinalizada = await SolicitudTutoria.findById(tutoria._id)
      .populate('estudiante', 'nombre email carrera semestre')
      .populate('participantes.estudiante', 'nombre email carrera semestre')
      .populate('profesor', 'nombre email escuela carrera');

    return res.json(tutoriaFinalizada || tutoria);
  } catch (error) {
    console.error('Error en finalizarTutoria:', error);
    return res.status(500).json({ message: 'Error al finalizar tutoría' });
  }
};