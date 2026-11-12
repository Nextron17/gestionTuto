import { Router } from 'express';
import {
  obtenerTutorias,
  crearTutoria,
  cambiarEstadoTutoria,
  agregarRecurso,
  finalizarTutoria,
} from '../controllers/tutorias.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(verificarToken);

router.get('/', obtenerTutorias);
router.post('/', crearTutoria);
router.patch('/:id', cambiarEstadoTutoria);
router.post('/:id/recursos', agregarRecurso);
router.patch('/:id/finalizar', finalizarTutoria);

export default router;