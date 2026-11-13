import { Router } from 'express';
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarRolUsuario,
  eliminarUsuario,
  obtenerCatalogo,
  crearEscuela,
  eliminarEscuela,
  crearCarrera,
  eliminarCarrera,
  crearMateria,
  eliminarMateria,
  obtenerReportesGlobales,
  obtenerRecursosAdmin,
  actualizarRecursoAdmin,
  eliminarRecursoAdmin,
} from '../controllers/admin.controller';
import { verificarToken } from '../middlewares/auth.middleware';
import { permitirRoles } from '../middlewares/role.middleware';

const router = Router();

router.use(verificarToken);
router.use(permitirRoles('admin'));

router.get('/usuarios', obtenerUsuarios);
router.post('/usuarios', crearUsuario);
router.put('/usuarios/:id', actualizarUsuario);
router.patch('/usuarios/:id/rol', cambiarRolUsuario);
router.delete('/usuarios/:id', eliminarUsuario);

router.get('/catalogo', obtenerCatalogo);
router.post('/escuelas', crearEscuela);
router.delete('/escuelas/:id', eliminarEscuela);
router.post('/carreras', crearCarrera);
router.delete('/carreras/:id', eliminarCarrera);
router.post('/materias', crearMateria);
router.delete('/materias/:id', eliminarMateria);

router.get('/reportes', obtenerReportesGlobales);

router.get('/recursos', obtenerRecursosAdmin);
router.put('/recursos/:id', actualizarRecursoAdmin);
router.delete('/recursos/:id', eliminarRecursoAdmin);

export default router;