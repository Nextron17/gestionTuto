"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerCarrerasPublicas = exports.obtenerProfesores = exports.login = exports.registro = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Usuario_1 = __importDefault(require("../models/Usuario"));
const Carrera_1 = __importDefault(require("../models/Carrera"));
const registro = async (req, res) => {
    try {
        const { nombre, email, password, carrera, semestre } = req.body;
        if (!nombre || !email || !password || !carrera || !semestre) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }
        const existeUsuario = await Usuario_1.default.findOne({ email });
        if (existeUsuario) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        // Registro público forzado a rol de estudiante
        const usuario = new Usuario_1.default({
            nombre,
            email,
            passwordHash,
            rol: 'estudiante',
            carrera,
            semestre: Number(semestre),
        });
        await usuario.save();
        return res.status(201).json({ message: 'Estudiante registrado exitosamente' });
    }
    catch (error) {
        console.error('Error en el registro:', error);
        return res.status(500).json({ message: 'Error en el servidor al registrar usuario' });
    }
};
exports.registro = registro;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await Usuario_1.default.findOne({ email });
        if (!usuario) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }
        const esCorrecta = await bcryptjs_1.default.compare(password, usuario.passwordHash);
        if (!esCorrecta) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }
        const token = jsonwebtoken_1.default.sign({ id: usuario._id, rol: usuario.rol }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1d' });
        return res.json({
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                carrera: usuario.carrera,
                escuela: usuario.escuela,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.login = login;
const obtenerProfesores = async (req, res) => {
    try {
        const filtro = { rol: 'profesor' };
        if (req.user?.rol === 'estudiante') {
            const estudiante = await Usuario_1.default.findById(req.user.id).select('carrera');
            if (estudiante?.carrera && estudiante.carrera.trim() !== '') {
                filtro.carrera = estudiante.carrera;
            }
        }
        else if (typeof req.query.carrera === 'string' && req.query.carrera.trim() !== '') {
            filtro.carrera = req.query.carrera;
        }
        const profesores = await Usuario_1.default.find(filtro).select('nombre email escuela carrera materias');
        return res.json(profesores);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al obtener la lista de profesores' });
    }
};
exports.obtenerProfesores = obtenerProfesores;
const obtenerCarrerasPublicas = async (req, res) => {
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
        let carrerasBD = [];
        try {
            carrerasBD = await Carrera_1.default.find().select('nombre');
        }
        catch {
            carrerasBD = [];
        }
        const nombresBD = carrerasBD.map((c) => c.nombre);
        const unificadas = Array.from(new Set([...listaOficial, ...nombresBD]));
        return res.json(unificadas.map((nombre, i) => ({ id: `carr-${i}`, nombre })));
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al obtener carreras' });
    }
};
exports.obtenerCarrerasPublicas = obtenerCarrerasPublicas;
