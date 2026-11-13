import { Router } from 'express';
import {
  obtenerRecursos,
  crearRecurso,
  obtenerEscuelasRecursos,
  actualizarRecursoProfesor,
  eliminarRecursoProfesor,
} from '../controllers/recursos.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();
router.use(verificarToken);

router.get('/escuelas', obtenerEscuelasRecursos);
router.get('/', obtenerRecursos);
router.post('/', crearRecurso);
router.put('/:id', actualizarRecursoProfesor);
router.delete('/:id', eliminarRecursoProfesor);

export default router;