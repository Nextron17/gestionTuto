import { Router } from 'express';
import {
  obtenerHorarios,
  obtenerMateriasDisponiblesProfesor,
  crearHorario,
  actualizarHorario,
  eliminarHorario,
} from '../controllers/horarios.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();
router.use(verificarToken);

router.get('/materias-disponibles', obtenerMateriasDisponiblesProfesor);
router.get('/', obtenerHorarios);
router.post('/', crearHorario);
router.put('/:id', actualizarHorario);
router.patch('/:id', actualizarHorario);
router.delete('/:id', eliminarHorario);

export default router;