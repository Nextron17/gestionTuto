import { Router } from 'express';
import { registro, login, obtenerProfesores } from '../controllers/auth.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/registro', registro);
router.post('/login', login);
router.get('/profesores', verificarToken, obtenerProfesores);

export default router;