import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario';
import Carrera from '../models/Carrera';
import { AuthRequest } from '../middlewares/auth.middleware';

export const registro = async (req: Request, res: Response) => {
  try {
    const { nombre, email, password, carrera, semestre } = req.body;

    if (!nombre || !email || !password || !carrera || !semestre) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const existeUsuario = await Usuario.findOne({ email });
    if (existeUsuario) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Registro público forzado a rol de estudiante
    const usuario = new Usuario({
      nombre,
      email,
      passwordHash,
      rol: 'estudiante',
      carrera,
      semestre: Number(semestre),
    });

    await usuario.save();
    return res.status(201).json({ message: 'Estudiante registrado exitosamente' });
  } catch (error) {
    console.error('Error en el registro:', error);
    return res.status(500).json({ message: 'Error en el servidor al registrar usuario' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const esCorrecta = await bcrypt.compare(password, usuario.passwordHash);
    if (!esCorrecta) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1d' }
    );

    return res.json({
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        carrera: usuario.carrera,
        escuela: usuario.escuela,
        materias: usuario.materias || [],
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const obtenerProfesores = async (req: AuthRequest, res: Response) => {
  try {
    const filtro: Record<string, unknown> = { rol: 'profesor' };

    if (req.user?.rol === 'estudiante') {
      const estudiante = await Usuario.findById(req.user.id).select('carrera');
      if (estudiante?.carrera && estudiante.carrera.trim() !== '') {
        filtro.carrera = estudiante.carrera;
      }
    } else if (typeof req.query.carrera === 'string' && req.query.carrera.trim() !== '') {
      filtro.carrera = req.query.carrera;
    }

    const profesores = await Usuario.find(filtro).select('nombre email escuela carrera materias');
    return res.json(profesores);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener la lista de profesores' });
  }
};

export const obtenerCarrerasPublicas = async (req: Request, res: Response) => {
  try {
    const listaOficial = [
      'Gobierno y Relaciones Internacionales',
      'Derecho',
      'Entrenamiento Deportivo',
      'Licenciatura en Educación Infantil',
      'Ingeniería Civil',
      'Ingeniería Energética',
      'Finanzas y Negocios Internacionales',
      'Administración de Empresas',
      'Contaduría Pública',
      'Matemáticas Aplicadas en Ciencia de Datos',
      'Ingeniería Ambiental y de Saneamiento',
      'Ingeniería Electrónica',
      'Ingeniería de Software y computación',
    ];

    let carrerasBD: { nombre: string }[] = [];
    try {
      carrerasBD = await Carrera.find().select('nombre');
    } catch {
      carrerasBD = [];
    }

    const nombresBD = carrerasBD.map((c) => c.nombre);
    const unificadas = Array.from(new Set([...listaOficial, ...nombresBD]));

    return res.json(unificadas.map((nombre, i) => ({ id: `carr-${i}`, nombre })));
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener carreras' });
  }
};