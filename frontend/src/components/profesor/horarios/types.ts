export interface TutoriaAsociada {
  _id: string;
  materia: string;
  tema?: string;
  hora?: string;
  estudiante?: {
    _id: string;
    nombre: string;
    email?: string;
  };
}

export interface Horario {
  _id: string;
  nombreProfesor?: string;
  materia?: string;
  semestre?: number;
  dia: string;
  horaInicio: string;
  horaFin: string;
  tieneTutoriasAceptadas?: boolean;
  tutoriasAceptadas?: TutoriaAsociada[];
}

export interface FranjaForm {
  horaInicio: string;
  horaFin: string;
}

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const SEMESTRES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
