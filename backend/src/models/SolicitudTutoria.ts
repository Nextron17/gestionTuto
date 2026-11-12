import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IParticipante {
  estudiante: Types.ObjectId;
  asistio?: boolean | null;
}

export interface ISolicitudTutoria extends Document {
  estudiante: Types.ObjectId;
  asistenciaEstudiante?: boolean | null;
  participantes: IParticipante[];
  profesor?: Types.ObjectId;
  materia: string;
  tema?: string;
  descripcion: string;
  hora?: string;
  modalidad: 'presencial' | 'virtual';
  tipo: 'individual' | 'grupal';
  cupoMaximo: number;
  comentarioProfesor?: string;
  enlaceGrabacion?: string;
  estado: 'pendiente' | 'aceptada' | 'cancelada' | 'aplazada' | 'finalizada';
  recursos: string[];
  fechaPropuesta?: Date;
}

const SolicitudTutoriaSchema: Schema = new Schema(
  {
    estudiante: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    asistenciaEstudiante: { type: Boolean, default: null },
    participantes: [
      {
        estudiante: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
        asistio: { type: Boolean, default: null },
      },
    ],
    profesor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    materia: { type: String, required: true },
    tema: { type: String },
    descripcion: { type: String, required: true },
    hora: { type: String },
    modalidad: {
      type: String,
      enum: ['presencial', 'virtual'],
      default: 'virtual',
    },
    tipo: {
      type: String,
      enum: ['individual', 'grupal'],
      default: 'individual',
    },
    cupoMaximo: { type: Number, default: 10 },
    comentarioProfesor: { type: String, default: '' },
    enlaceGrabacion: { type: String, default: '' },
    estado: {
      type: String,
      enum: ['pendiente', 'aceptada', 'cancelada', 'aplazada', 'finalizada'],
      default: 'pendiente',
    },
    recursos: [{ type: String }],
    fechaPropuesta: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ISolicitudTutoria>('SolicitudTutoria', SolicitudTutoriaSchema);