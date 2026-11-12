import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISolicitudTutoria extends Document {
  estudiante: Types.ObjectId;
  profesor?: Types.ObjectId;
  materia: string;
  tema?: string;
  descripcion: string;
  hora?: string;
  estado: 'pendiente' | 'aceptada' | 'cancelada' | 'aplazada' | 'finalizada';
  recursos?: string[];
  fechaPropuesta?: Date;
}

const SolicitudTutoriaSchema: Schema = new Schema({
  estudiante: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  profesor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  materia: { type: String, required: true },
  tema: { type: String },
  descripcion: { type: String, required: true },
  hora: { type: String },
  estado: { 
    type: String, 
    enum: ['pendiente', 'aceptada', 'cancelada', 'aplazada', 'finalizada'], 
    default: 'pendiente' 
  },
  recursos: [{ type: String }],
  fechaPropuesta: { type: Date }
}, { timestamps: true });

export default mongoose.model<ISolicitudTutoria>('SolicitudTutoria', SolicitudTutoriaSchema);