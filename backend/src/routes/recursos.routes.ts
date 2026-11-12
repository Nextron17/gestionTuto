import { Router } from 'express';
import {
  obtenerRecursos,
  crearRecurso,
  obtenerEscuelasRecursos,
} from '../controllers/recursos.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();
router.use(verificarToken);

router.get('/escuelas', obtenerEscuelasRecursos);
router.get('/', obtenerRecursos);
router.post('/', crearRecurso);

export default router;