import { Router } from 'express';
import {
  obtenerTutorias,
  obtenerTutoriasGrupales,
  crearTutoria,
  cambiarEstadoTutoria,
  inscribirseTutoriaGrupal,
  registrarAsistencia,
  agregarRecurso,
  finalizarTutoria,
} from '../controllers/tutorias.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(verificarToken);

router.get('/', obtenerTutorias);
router.get('/grupales', obtenerTutoriasGrupales);
router.post('/', crearTutoria);
router.patch('/:id', cambiarEstadoTutoria);
router.post('/:id/inscribirse', inscribirseTutoriaGrupal);
router.patch('/:id/asistencia', registrarAsistencia);
router.post('/:id/recursos', agregarRecurso);
router.patch('/:id/finalizar', finalizarTutoria);

export default router;