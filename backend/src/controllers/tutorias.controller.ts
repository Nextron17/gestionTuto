import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import SolicitudTutoria from '../models/SolicitudTutoria';
import Usuario from '../models/Usuario';
import Recurso from '../models/Recurso';

export const obtenerTutorias = async (req: AuthRequest, res: Response) => {
  try {
    let filtro: Record<string, unknown> = {};

    if (req.user?.rol === 'estudiante') {
      filtro = {
        $or: [
          { estudiante: req.user.id },
          { 'participantes.estudiante': req.user.id },
        ],
      };
    } else if (req.user?.rol === 'profesor') {
      filtro = { profesor: req.user.id };
    }

    const tutorias = await SolicitudTutoria.find(filtro)
      .populate('estudiante', 'nombre email carrera semestre')
      .populate('participantes.estudiante', 'nombre email carrera semestre')
      .populate('profesor', 'nombre email escuela carrera')
      .sort({ createdAt: -1 });

    return res.json(tutorias);
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

    if (req.user?.rol === 'estudiante') {
      const alumno = await Usuario.findById(req.user.id).select('carrera');
      if (alumno?.carrera && alumno.carrera.trim() !== '') {
        const filtradas = tutorias.filter((t) => {
          const prof = t.profesor as unknown as { carrera?: string } | null;
          return !prof?.carrera || prof.carrera === alumno.carrera;
        });
        return res.json(filtradas);
      }
    }

    return res.json(tutorias);
  } catch (error) {
    console.error('Error en obtenerTutoriasGrupales:', error);
    return res.status(500).json({ message: 'Error al obtener tutorías grupales' });
  }
};

export const crearTutoria = async (req: AuthRequest, res: Response) => {
  try {
    const { materia, descripcion, tema, profesorId, hora, modalidad, tipo } = req.body;
    const nueva = new SolicitudTutoria({
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
      comentarioProfesor,
      enlaceGrabacion,
    } = req.body;

    const tutoria = await SolicitudTutoria.findById(id);
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

    if (estado) tutoria.estado = estado;
    if (hora !== undefined) tutoria.hora = hora;
    if (modalidad) tutoria.modalidad = modalidad;
    if (tipo) tutoria.tipo = tipo;
    if (cupoMaximo !== undefined) tutoria.cupoMaximo = Number(cupoMaximo);
    if (comentarioProfesor !== undefined) tutoria.comentarioProfesor = comentarioProfesor;
    if (enlaceGrabacion !== undefined) tutoria.enlaceGrabacion = enlaceGrabacion;

    await tutoria.save();
    return res.json(tutoria);
  } catch (error) {
    console.error('Error en cambiarEstadoTutoria:', error);
    return res.status(500).json({ message: 'Error al actualizar tutoría' });
  }
};

export const inscribirseTutoriaGrupal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const estudianteId = req.user?.id;

    if (!estudianteId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const tutoria = await SolicitudTutoria.findById(id);
    if (!tutoria) {
      return res.status(404).json({ message: 'Tutoría no encontrada' });
    }

    if (tutoria.tipo !== 'grupal' || tutoria.estado !== 'aceptada') {
      return res.status(400).json({ message: 'Esta tutoría no está disponible para inscripción grupal' });
    }

    if (tutoria.estudiante.toString() === estudianteId) {
      return res.status(400).json({ message: 'Ya eres el solicitante principal de esta tutoría' });
    }

    const yaInscrito = tutoria.participantes.some(
      (p) => p.estudiante.toString() === estudianteId
    );
    if (yaInscrito) {
      return res.status(400).json({ message: 'Ya estás inscrito en esta tutoría grupal' });
    }

    const totalActual = 1 + tutoria.participantes.length;
    if (totalActual >= (tutoria.cupoMaximo || 10)) {
      return res.status(400).json({ message: 'Cupo máximo alcanzado para esta tutoría' });
    }

    tutoria.participantes.push({ estudiante: estudianteId as unknown as never, asistio: null });
    await tutoria.save();

    return res.json({ message: 'Inscripción exitosa', tutoria });
  } catch (error) {
    console.error('Error en inscribirseTutoriaGrupal:', error);
    return res.status(500).json({ message: 'Error al inscribirse en la tutoría grupal' });
  }
};

export const registrarAsistencia = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { asistenciaEstudiante, participantes } = req.body;

    const tutoria = await SolicitudTutoria.findById(id);
    if (!tutoria) {
      return res.status(404).json({ message: 'Tutoría no encontrada' });
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
    return res.json(tutoria);
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
    const { enlaceGrabacion, comentarioProfesor } = req.body || {};

    const tutoria = await SolicitudTutoria.findById(id);
    if (!tutoria) {
      return res.status(404).json({ message: 'Tutoría no encontrada' });
    }

    if (enlaceGrabacion !== undefined) tutoria.enlaceGrabacion = enlaceGrabacion;
    if (comentarioProfesor !== undefined) tutoria.comentarioProfesor = comentarioProfesor;
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
            tema: tutoria.tema || '',
            claseOrigen: nombreClase,
            link: url,
            profesor: tutoria.profesor,
          });
        }
      }
    }

    return res.json(tutoria);
  } catch (error) {
    console.error('Error en finalizarTutoria:', error);
    return res.status(500).json({ message: 'Error al finalizar tutoría' });
  }
};