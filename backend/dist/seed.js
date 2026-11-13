"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Escuela_1 = __importDefault(require("./models/Escuela"));
const Carrera_1 = __importDefault(require("./models/Carrera"));
const Materia_1 = __importDefault(require("./models/Materia"));
const Tema_1 = __importDefault(require("./models/Tema"));
const Usuario_1 = __importDefault(require("./models/Usuario"));
const HorarioDisponible_1 = __importDefault(require("./models/HorarioDisponible"));
const SolicitudTutoria_1 = __importDefault(require("./models/SolicitudTutoria"));
const Recurso_1 = __importDefault(require("./models/Recurso"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion_tutorias';
async function seed() {
    try {
        console.log('Conectando a MongoDB...');
        await mongoose_1.default.connect(MONGO_URI);
        console.log('Conexión establecida correctamente.');
        // 1. Limpiar colecciones existentes para evitar duplicados o conflictos de índices únicos
        await Promise.all([
            SolicitudTutoria_1.default.deleteMany({}),
            Recurso_1.default.deleteMany({}),
            HorarioDisponible_1.default.deleteMany({}),
            Tema_1.default.deleteMany({}),
            Materia_1.default.deleteMany({}),
            Carrera_1.default.deleteMany({}),
            Escuela_1.default.deleteMany({}),
            Usuario_1.default.deleteMany({}),
        ]);
        console.log('Colecciones previas limpiadas.');
        // 2. Escuelas (4)
        const [ecei, eiam, epri, emd] = await Escuela_1.default.insertMany([
            { nombre: 'Escuela de Ciencias Exactas e Ingeniería', codigo: 'ECEI' },
            { nombre: 'Escuela Internacional de Administración y Marketing', codigo: 'EIAM' },
            { nombre: 'Escuela de Política y Relaciones Internacionales', codigo: 'EPRI' },
            { nombre: 'Escuela Mayor de Derecho', codigo: 'EMD' },
        ]);
        // 3. Carreras (6) — nombres alineados con listaOficial en auth.controller.ts
        const [carrSoft, carrDatos, carrElec, carrFinanzas, carrAdmin, carrDerecho] = await Carrera_1.default.insertMany([
            {
                nombre: 'Ingeniería de Software y computación',
                codigo: 'ISC-01',
                escuela: ecei._id,
            },
            {
                nombre: 'Matemáticas Aplicadas en Ciencia de Datos',
                codigo: 'MACD-02',
                escuela: ecei._id,
            },
            {
                nombre: 'Ingeniería Electrónica',
                codigo: 'IEL-03',
                escuela: ecei._id,
            },
            {
                nombre: 'Finanzas y Negocios Internacionales',
                codigo: 'FNI-04',
                escuela: eiam._id,
            },
            {
                nombre: 'Administración de Empresas',
                codigo: 'ADE-05',
                escuela: eiam._id,
            },
            {
                nombre: 'Derecho',
                codigo: 'DER-06',
                escuela: emd._id,
            },
        ]);
        // 4. Materias (10)
        const [matEda, matAsc, matBd, matCalc, matEst, matMl, matCirc, matMatFin, matEconFin, matDerConst,] = await Materia_1.default.insertMany([
            {
                nombre: 'Estructuras de Datos y Algoritmos',
                codigo: 'ISC-EDA-101',
                carrera: carrSoft._id,
            },
            {
                nombre: 'Arquitectura de Software y Cloud',
                codigo: 'ISC-ASC-102',
                carrera: carrSoft._id,
            },
            {
                nombre: 'Bases de Datos NoSQL y Relacionales',
                codigo: 'ISC-BD-103',
                carrera: carrSoft._id,
            },
            {
                nombre: 'Cálculo Diferencial e Integral',
                codigo: 'ISC-CDI-104',
                carrera: carrSoft._id,
            },
            {
                nombre: 'Estadística Inferencial y Probabilidad',
                codigo: 'MACD-EIP-201',
                carrera: carrDatos._id,
            },
            {
                nombre: 'Machine Learning y Modelos Predictivos',
                codigo: 'MACD-ML-202',
                carrera: carrDatos._id,
            },
            {
                nombre: 'Circuitos Digitales y Microcontroladores',
                codigo: 'IEL-CDM-301',
                carrera: carrElec._id,
            },
            {
                nombre: 'Matemática Financiera y Valoración',
                codigo: 'FNI-MFV-401',
                carrera: carrFinanzas._id,
            },
            {
                nombre: 'Econometría Financiera',
                codigo: 'FNI-ECF-402',
                carrera: carrFinanzas._id,
            },
            {
                nombre: 'Derecho Constitucional Colombiano',
                codigo: 'DER-DCC-501',
                carrera: carrDerecho._id,
            },
        ]);
        // 5. Temas (12)
        const temas = await Tema_1.default.insertMany([
            { nombre: 'Árboles Balanceados (AVL y Red-Black)', materia: matEda._id },
            { nombre: 'Complejidad Algorítmica y Recursividad', materia: matEda._id },
            { nombre: 'Grafos y Camino Más Corto (Dijkstra)', materia: matEda._id },
            { nombre: 'Despliegue de Microservicios y REST API', materia: matAsc._id },
            { nombre: 'Patrones de Arquitectura Hexagonal', materia: matAsc._id },
            { nombre: 'Agregaciones en MongoDB ($lookup y $facet)', materia: matBd._id },
            { nombre: 'Integrales por Partes y Sustitución Trigonométrica', materia: matCalc._id },
            { nombre: 'Pruebas de Hipótesis y Distribución Normal', materia: matEst._id },
            { nombre: 'Regresión Logística y Validación Cruzada', materia: matMl._id },
            { nombre: 'Compuertas Lógicas y Mapas de Karnaugh', materia: matCirc._id },
            { nombre: 'Valor Presente Neto (VPN) y TIR', materia: matMatFin._id },
            { nombre: 'Series de Tiempo ARIMA', materia: matEconFin._id },
        ]);
        // 6. Usuarios (12): 1 Admin, 4 Profesores, 7 Estudiantes (contraseña común: 123456)
        const passwordHash = await bcryptjs_1.default.hash('123456', 10);
        const [adminUser, profCarlos, profMarcela, profAlejandro, profDiana, estLaura, estMateo, estSofia, estSantiago, estValeria, estDaniel, estCamila,] = await Usuario_1.default.insertMany([
            {
                nombre: 'Administrador General',
                email: 'admin@universidad.edu',
                passwordHash,
                rol: 'admin',
            },
            {
                nombre: 'Dr. Carlos Andrés Ruiz',
                email: 'carlos.ruiz@universidad.edu',
                passwordHash,
                rol: 'profesor',
                escuela: ecei.nombre,
                carrera: carrSoft.nombre,
                materias: [matEda.nombre, matAsc.nombre, matBd.nombre],
            },
            {
                nombre: 'Dra. Marcela Restrepo Gómez',
                email: 'marcela.restrepo@universidad.edu',
                passwordHash,
                rol: 'profesor',
                escuela: ecei.nombre,
                carrera: carrSoft.nombre,
                materias: [matCalc.nombre, matEda.nombre],
            },
            {
                nombre: 'Mg. Alejandro Torres Vega',
                email: 'alejandro.torres@universidad.edu',
                passwordHash,
                rol: 'profesor',
                escuela: ecei.nombre,
                carrera: carrDatos.nombre,
                materias: [matEst.nombre, matMl.nombre],
            },
            {
                nombre: 'Dra. Diana Patricia Mendoza',
                email: 'diana.mendoza@universidad.edu',
                passwordHash,
                rol: 'profesor',
                escuela: eiam.nombre,
                carrera: carrFinanzas.nombre,
                materias: [matMatFin.nombre, matEconFin.nombre],
            },
            {
                nombre: 'Laura Valentina Gómez',
                email: 'laura.gomez@universidad.edu',
                passwordHash,
                rol: 'estudiante',
                carrera: carrSoft.nombre,
                semestre: 4,
            },
            {
                nombre: 'Mateo Sebastián Vargas',
                email: 'mateo.vargas@universidad.edu',
                passwordHash,
                rol: 'estudiante',
                carrera: carrSoft.nombre,
                semestre: 4,
            },
            {
                nombre: 'Sofía Camila Martínez',
                email: 'sofia.martinez@universidad.edu',
                passwordHash,
                rol: 'estudiante',
                carrera: carrSoft.nombre,
                semestre: 6,
            },
            {
                nombre: 'Santiago José Herrera',
                email: 'santiago.herrera@universidad.edu',
                passwordHash,
                rol: 'estudiante',
                carrera: carrSoft.nombre,
                semestre: 2,
            },
            {
                nombre: 'Valeria Andrea Castro',
                email: 'valeria.castro@universidad.edu',
                passwordHash,
                rol: 'estudiante',
                carrera: carrDatos.nombre,
                semestre: 5,
            },
            {
                nombre: 'Daniel Felipe Morales',
                email: 'daniel.morales@universidad.edu',
                passwordHash,
                rol: 'estudiante',
                carrera: carrDatos.nombre,
                semestre: 5,
            },
            {
                nombre: 'Camila Andrea Rojas',
                email: 'camila.rojas@universidad.edu',
                passwordHash,
                rol: 'estudiante',
                carrera: carrFinanzas.nombre,
                semestre: 3,
            },
        ]);
        // 7. Horarios Disponibles (10)
        const horarios = await HorarioDisponible_1.default.insertMany([
            {
                profesor: profCarlos._id,
                nombreProfesor: profCarlos.nombre,
                materia: matEda.nombre,
                semestre: 4,
                dia: 'Lunes',
                horaInicio: '08:00',
                horaFin: '10:00',
            },
            {
                profesor: profCarlos._id,
                nombreProfesor: profCarlos.nombre,
                materia: matAsc.nombre,
                semestre: 6,
                dia: 'Miércoles',
                horaInicio: '14:00',
                horaFin: '16:00',
            },
            {
                profesor: profCarlos._id,
                nombreProfesor: profCarlos.nombre,
                materia: matBd.nombre,
                semestre: 4,
                dia: 'Viernes',
                horaInicio: '10:00',
                horaFin: '12:00',
            },
            {
                profesor: profMarcela._id,
                nombreProfesor: profMarcela.nombre,
                materia: matCalc.nombre,
                semestre: 2,
                dia: 'Martes',
                horaInicio: '09:00',
                horaFin: '11:00',
            },
            {
                profesor: profMarcela._id,
                nombreProfesor: profMarcela.nombre,
                materia: matCalc.nombre,
                semestre: 2,
                dia: 'Jueves',
                horaInicio: '15:00',
                horaFin: '17:00',
            },
            {
                profesor: profMarcela._id,
                nombreProfesor: profMarcela.nombre,
                materia: matEda.nombre,
                semestre: 4,
                dia: 'Sábado',
                horaInicio: '08:00',
                horaFin: '10:00',
            },
            {
                profesor: profAlejandro._id,
                nombreProfesor: profAlejandro.nombre,
                materia: matMl.nombre,
                semestre: 5,
                dia: 'Lunes',
                horaInicio: '16:00',
                horaFin: '18:00',
            },
            {
                profesor: profAlejandro._id,
                nombreProfesor: profAlejandro.nombre,
                materia: matEst.nombre,
                semestre: 5,
                dia: 'Jueves',
                horaInicio: '10:00',
                horaFin: '12:00',
            },
            {
                profesor: profDiana._id,
                nombreProfesor: profDiana.nombre,
                materia: matMatFin.nombre,
                semestre: 3,
                dia: 'Martes',
                horaInicio: '14:00',
                horaFin: '16:00',
            },
            {
                profesor: profDiana._id,
                nombreProfesor: profDiana.nombre,
                materia: matEconFin.nombre,
                semestre: 3,
                dia: 'Viernes',
                horaInicio: '08:00',
                horaFin: '10:00',
            },
            {
                profesor: profCarlos._id,
                nombreProfesor: profCarlos.nombre,
                materia: matAsc.nombre,
                semestre: 6,
                dia: 'Jueves',
                horaInicio: '08:00',
                horaFin: '10:00',
            },
            {
                profesor: profDiana._id,
                nombreProfesor: profDiana.nombre,
                materia: matEconFin.nombre,
                semestre: 3,
                dia: 'Miércoles',
                horaInicio: '10:00',
                horaFin: '12:00',
            },
        ]);
        // 8. Solicitudes de Tutoría (15) — cubre todos los estados, tipos y alimenta HU-22
        const solicitudes = await SolicitudTutoria_1.default.insertMany([
            {
                estudiante: estLaura._id,
                profesor: profCarlos._id,
                materia: matEda.nombre,
                tema: 'Árboles Balanceados (AVL y Red-Black)',
                descripcion: 'Repaso práctico de rotaciones simples y dobles en inserción de árboles AVL.',
                hora: 'Lunes 08:00 - 10:00',
                modalidad: 'virtual',
                tipo: 'grupal',
                cupoMaximo: 8,
                participantes: [{ estudiante: estMateo._id, asistio: null }],
                enlaceReunion: 'https://meet.google.com/avl-trees-carlos',
                comentarioProfesor: 'Sesión abierta para reforzar el taller del segundo corte.',
                estado: 'aceptada',
                recursos: ['https://visualgo.net/en/bst'],
                fechaPropuesta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            },
            {
                estudiante: estSofia._id,
                profesor: profCarlos._id,
                materia: matAsc.nombre,
                tema: 'Despliegue de Microservicios y REST API',
                descripcion: 'Taller sobre variables de entorno, conexión a MongoDB Atlas y despliegue.',
                hora: 'Miércoles 14:00 - 16:00',
                modalidad: 'virtual',
                tipo: 'grupal',
                cupoMaximo: 10,
                participantes: [{ estudiante: estLaura._id, asistio: null }],
                enlaceReunion: 'https://meet.google.com/cloud-rest-carlos',
                comentarioProfesor: 'Traer el repositorio clonado y Node.js 20 instalado.',
                estado: 'aceptada',
                recursos: ['https://expressjs.com/en/guide/routing.html'],
                fechaPropuesta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            },
            {
                estudiante: estMateo._id,
                profesor: profCarlos._id,
                materia: matEda.nombre,
                tema: 'Árboles Balanceados (AVL y Red-Black)',
                descripcion: 'Dudas puntuales sobre eliminación de nodos y rebalanceo en árboles AVL.',
                hora: 'Viernes 10:00 - 12:00',
                modalidad: 'presencial',
                tipo: 'individual',
                cupoMaximo: 1,
                estado: 'pendiente',
                recursos: [],
                fechaPropuesta: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
            },
            {
                estudiante: estLaura._id,
                profesor: profCarlos._id,
                materia: matBd.nombre,
                tema: 'Agregaciones en MongoDB ($lookup y $facet)',
                descripcion: 'Cómo cruzar colecciones y generar reportes analíticos con pipelines.',
                hora: 'Lunes 08:00 - 10:00',
                modalidad: 'virtual',
                tipo: 'individual',
                asistenciaEstudiante: true,
                enlaceReunion: 'https://meet.google.com/mongo-agg-carlos',
                comentarioProfesor: 'Excelente dominio de pipelines de agregación en Mongoose.',
                enlaceGrabacion: 'https://meet.universidad.edu/rec/mongodb-aggregations-01',
                estado: 'finalizada',
                recursos: ['https://www.mongodb.com/docs/manual/aggregation/'],
                fechaPropuesta: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            },
            {
                estudiante: estSofia._id,
                profesor: profCarlos._id,
                materia: matEda.nombre,
                tema: 'Complejidad Algorítmica y Recursividad',
                descripcion: 'Análisis de recurrencias mediante Teorema Maestro para algoritmos divide y vencerás.',
                hora: 'Miércoles 14:00 - 16:00',
                modalidad: 'virtual',
                tipo: 'grupal',
                cupoMaximo: 10,
                asistenciaEstudiante: true,
                participantes: [
                    { estudiante: estLaura._id, asistio: true },
                    { estudiante: estMateo._id, asistio: true },
                ],
                enlaceReunion: 'https://meet.google.com/bigo-eda-carlos',
                comentarioProfesor: 'Se resolvieron 5 ejercicios tipo parcial con análisis Big-O.',
                enlaceGrabacion: 'https://meet.universidad.edu/rec/complejidad-big-o',
                estado: 'finalizada',
                recursos: ['https://www.bigocheatsheet.com/'],
                fechaPropuesta: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
            {
                estudiante: estSantiago._id,
                profesor: profMarcela._id,
                materia: matCalc.nombre,
                tema: 'Integrales por Partes y Sustitución Trigonométrica',
                descripcion: 'Ejercicios paso a paso para identificar sustitución adecuada en integrales.',
                hora: 'Martes 09:00 - 11:00',
                modalidad: 'presencial',
                tipo: 'individual',
                cupoMaximo: 1,
                lugar: 'Salón 204 - Bloque de Ciencias Básicas',
                asistenciaEstudiante: true,
                comentarioProfesor: 'Revisar identidades trigonométricas básicas antes del quiz.',
                estado: 'finalizada',
                recursos: ['https://tutorial.math.lamar.edu/Classes/CalcII/IntegrationByParts.aspx'],
                fechaPropuesta: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            },
            {
                estudiante: estSantiago._id,
                profesor: profMarcela._id,
                materia: matCalc.nombre,
                tema: 'Integrales por Partes y Sustitución Trigonométrica',
                descripcion: 'Preparación de taller sobre integrales impropias y volúmenes de revolución.',
                hora: 'Jueves 15:00 - 17:00',
                modalidad: 'virtual',
                tipo: 'individual',
                estado: 'pendiente',
                recursos: [],
                fechaPropuesta: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            },
            {
                estudiante: estMateo._id,
                profesor: profMarcela._id,
                materia: matEda.nombre,
                tema: 'Complejidad Algorítmica y Recursividad',
                descripcion: 'Optimización de funciones recursivas con memoización y programación dinámica.',
                hora: 'Sábado 08:00 - 10:00',
                modalidad: 'virtual',
                tipo: 'individual',
                comentarioProfesor: 'Reprogramada para la siguiente franja del sábado por cruce de comité.',
                estado: 'aplazada',
                recursos: [],
                fechaPropuesta: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            },
            {
                estudiante: estLaura._id,
                profesor: profCarlos._id,
                materia: matAsc.nombre,
                tema: 'Patrones de Arquitectura Hexagonal',
                descripcion: 'Separación de puertos y adaptadores en APIs TypeScript.',
                hora: 'Viernes 10:00 - 12:00',
                modalidad: 'virtual',
                tipo: 'individual',
                estado: 'cancelada',
                recursos: [],
                fechaPropuesta: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
            {
                estudiante: estValeria._id,
                profesor: profAlejandro._id,
                materia: matMl.nombre,
                tema: 'Regresión Logística y Validación Cruzada',
                descripcion: 'Interpretación de matriz de confusión, curva ROC-AUC y ajuste de hiperparámetros.',
                hora: 'Lunes 16:00 - 18:00',
                modalidad: 'virtual',
                tipo: 'grupal',
                cupoMaximo: 8,
                participantes: [{ estudiante: estDaniel._id, asistio: null }],
                enlaceReunion: 'https://meet.google.com/ml-roc-alejandro',
                comentarioProfesor: 'Traer notebook con scikit-learn listo para pruebas.',
                estado: 'aceptada',
                recursos: ['https://scikit-learn.org/stable/modules/cross_validation.html'],
                fechaPropuesta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            },
            {
                estudiante: estDaniel._id,
                profesor: profAlejandro._id,
                materia: matMl.nombre,
                tema: 'Regresión Logística y Validación Cruzada',
                descripcion: 'Manejo de desbalanceo de clases con SMOTE y ponderación de pesos.',
                hora: 'Jueves 10:00 - 12:00',
                modalidad: 'virtual',
                tipo: 'individual',
                asistenciaEstudiante: true,
                enlaceReunion: 'https://meet.google.com/ml-smote-alejandro',
                comentarioProfesor: 'Se validó F1-score sobre dataset desbalanceado.',
                enlaceGrabacion: 'https://meet.universidad.edu/rec/ml-validacion-cruzada',
                estado: 'finalizada',
                recursos: ['https://scikit-learn.org/stable/modules/generated/sklearn.metrics.roc_auc_score.html'],
                fechaPropuesta: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            },
            {
                estudiante: estValeria._id,
                profesor: profAlejandro._id,
                materia: matEst.nombre,
                tema: 'Pruebas de Hipótesis y Distribución Normal',
                descripcion: 'Elección entre prueba Z y t-Student según tamaño muestral y varianza conocida.',
                hora: 'Lunes 16:00 - 18:00',
                modalidad: 'presencial',
                tipo: 'individual',
                estado: 'pendiente',
                recursos: [],
                fechaPropuesta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            },
            {
                estudiante: estDaniel._id,
                profesor: profAlejandro._id,
                materia: matEst.nombre,
                tema: 'Pruebas de Hipótesis y Distribución Normal',
                descripcion: 'Interpretación del p-valor y potencia estadística en experimentos A/B.',
                hora: 'Jueves 10:00 - 12:00',
                modalidad: 'virtual',
                tipo: 'individual',
                asistenciaEstudiante: false,
                enlaceReunion: 'https://meet.google.com/stat-pval-alejandro',
                comentarioProfesor: 'El estudiante no pudo conectarse; se comparte material guía.',
                estado: 'finalizada',
                recursos: [],
                fechaPropuesta: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
            },
            {
                estudiante: estCamila._id,
                profesor: profDiana._id,
                materia: matMatFin.nombre,
                tema: 'Valor Presente Neto (VPN) y TIR',
                descripcion: 'Evaluación comparativa de proyectos mutuamente excluyentes con flujos irregulares.',
                hora: 'Martes 14:00 - 16:00',
                modalidad: 'virtual',
                tipo: 'individual',
                asistenciaEstudiante: true,
                enlaceReunion: 'https://meet.google.com/fin-vpn-diana',
                comentarioProfesor: 'Revisamos cálculo en Excel con funciones VNA y TIR.',
                enlaceGrabacion: 'https://meet.universidad.edu/rec/vpn-tir-finanzas',
                estado: 'finalizada',
                recursos: ['https://support.microsoft.com/es-es/office/vna-funci%C3%B3n-vna-8672cb67-2576-4d07-b67b-ac28acf2a568'],
                fechaPropuesta: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            },
            {
                estudiante: estCamila._id,
                profesor: profDiana._id,
                materia: matEconFin.nombre,
                tema: 'Series de Tiempo ARIMA',
                descripcion: 'Pruebas de estacionariedad Dickey-Fuller y selección de parámetros (p, d, q).',
                hora: 'Viernes 08:00 - 10:00',
                modalidad: 'presencial',
                tipo: 'individual',
                cupoMaximo: 1,
                lugar: 'Sala de Finanzas 302 - Edificio Administrativo',
                estado: 'aceptada',
                comentarioProfesor: 'Traer archivo Excel con la serie histórica descargada.',
                recursos: [],
                fechaPropuesta: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            },
        ]);
        // 9. Recursos Académicos (8) — mezcla de clases finalizadas y publicaciones directas
        const recursos = await Recurso_1.default.insertMany([
            {
                titulo: 'Clase: Bases de Datos NoSQL y Relacionales - Agregaciones en MongoDB ($lookup y $facet) (Grabación de sesión)',
                escuela: ecei.nombre,
                materia: matBd.nombre,
                tema: 'Agregaciones en MongoDB ($lookup y $facet)',
                tipo: 'video',
                claseOrigen: 'Clase: Bases de Datos NoSQL y Relacionales - Agregaciones en MongoDB ($lookup y $facet)',
                link: 'https://meet.universidad.edu/rec/mongodb-aggregations-01',
                profesor: profCarlos._id,
            },
            {
                titulo: 'Clase: Estructuras de Datos y Algoritmos - Complejidad Algorítmica y Recursividad (Grabación de sesión)',
                escuela: ecei.nombre,
                materia: matEda.nombre,
                tema: 'Complejidad Algorítmica y Recursividad',
                tipo: 'video',
                claseOrigen: 'Clase: Estructuras de Datos y Algoritmos - Complejidad Algorítmica y Recursividad',
                link: 'https://meet.universidad.edu/rec/complejidad-big-o',
                profesor: profCarlos._id,
            },
            {
                titulo: 'Visualizador Interactivo de Árboles AVL y Red-Black',
                escuela: ecei.nombre,
                materia: matEda.nombre,
                tema: 'Árboles Balanceados (AVL y Red-Black)',
                tipo: 'enlace',
                claseOrigen: '',
                link: 'https://visualgo.net/en/bst',
                profesor: profCarlos._id,
            },
            {
                titulo: 'Guía Práctica de REST API y Despliegue con Express y Mongoose',
                escuela: ecei.nombre,
                materia: matAsc.nombre,
                tema: 'Despliegue de Microservicios y REST API',
                tipo: 'guia',
                claseOrigen: '',
                link: 'https://expressjs.com/en/guide/routing.html',
                profesor: profCarlos._id,
            },
            {
                titulo: 'Notas y Ejercicios Resueltos: Integración por Partes',
                escuela: ecei.nombre,
                materia: matCalc.nombre,
                tema: 'Integrales por Partes y Sustitución Trigonométrica',
                tipo: 'documento',
                claseOrigen: 'Clase: Cálculo Diferencial e Integral - Integrales por Partes y Sustitución Trigonométrica',
                link: 'https://tutorial.math.lamar.edu/Classes/CalcII/IntegrationByParts.aspx',
                profesor: profMarcela._id,
            },
            {
                titulo: 'Clase: Machine Learning y Modelos Predictivos - Regresión Logística y Validación Cruzada (Grabación de sesión)',
                escuela: ecei.nombre,
                materia: matMl.nombre,
                tema: 'Regresión Logística y Validación Cruzada',
                tipo: 'video',
                claseOrigen: 'Clase: Machine Learning y Modelos Predictivos - Regresión Logística y Validación Cruzada',
                link: 'https://meet.universidad.edu/rec/ml-validacion-cruzada',
                profesor: profAlejandro._id,
            },
            {
                titulo: 'Documentación Oficial de Validación Cruzada en Scikit-Learn',
                escuela: ecei.nombre,
                materia: matMl.nombre,
                tema: 'Regresión Logística y Validación Cruzada',
                tipo: 'documento',
                claseOrigen: '',
                link: 'https://scikit-learn.org/stable/modules/cross_validation.html',
                profesor: profAlejandro._id,
            },
            {
                titulo: 'Clase: Matemática Financiera y Valoración - Valor Presente Neto (VPN) y TIR (Grabación de sesión)',
                escuela: eiam.nombre,
                materia: matMatFin.nombre,
                tema: 'Valor Presente Neto (VPN) y TIR',
                tipo: 'video',
                claseOrigen: 'Clase: Matemática Financiera y Valoración - Valor Presente Neto (VPN) y TIR',
                link: 'https://meet.universidad.edu/rec/vpn-tir-finanzas',
                profesor: profDiana._id,
            },
        ]);
        console.log('\n=== SEED COMPLETADO CON ÉXITO ===');
        console.log(`- Escuelas insertadas:             4`);
        console.log(`- Carreras insertadas:             6`);
        console.log(`- Materias insertadas:             10`);
        console.log(`- Temas insertados:                ${temas.length}`);
        console.log(`- Usuarios insertados:             12 (1 admin, 4 profesores, 7 estudiantes)`);
        console.log(`- Horarios disponibles insertados: ${horarios.length}`);
        console.log(`- Solicitudes de tutoría:          ${solicitudes.length}`);
        console.log(`- Recursos académicos:             ${recursos.length}`);
        console.log('\nCredenciales de prueba (contraseña para todos: 123456):');
        console.log(`  [Admin]      ${adminUser.email}`);
        console.log(`  [Profesor]   ${profCarlos.email} (${profCarlos.carrera})`);
        console.log(`  [Profesor]   ${profMarcela.email} (${profMarcela.carrera})`);
        console.log(`  [Profesor]   ${profAlejandro.email} (${profAlejandro.carrera})`);
        console.log(`  [Profesor]   ${profDiana.email} (${profDiana.carrera})`);
        console.log(`  [Estudiante] ${estLaura.email} (${estLaura.carrera}, Sem. ${estLaura.semestre})`);
        console.log(`  [Estudiante] ${estValeria.email} (${estValeria.carrera}, Sem. ${estValeria.semestre})`);
        console.log(`  [Estudiante] ${estCamila.email} (${estCamila.carrera}, Sem. ${estCamila.semestre})`);
    }
    catch (error) {
        console.error('Error ejecutando el seed:', error);
        process.exitCode = 1;
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Desconectado de MongoDB.');
    }
}
seed();
