import { Router } from 'express';
import { obtenerHorarios, crearHorario, eliminarHorario } from '../controllers/horarios.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();
router.use(verificarToken);

router.get('/', obtenerHorarios);
router.post('/', crearHorario);
router.delete('/:id', eliminarHorario);

export default router;