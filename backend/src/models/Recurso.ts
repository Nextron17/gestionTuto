import mongoose, { Schema, Document } from 'mongoose';

export interface IRecurso extends Document {
  titulo: string;
  escuela: string;
  materia: string;
  tema?: string;
  claseOrigen?: string;
  link: string;
  profesor: mongoose.Types.ObjectId;
}

const RecursoSchema = new Schema(
  {
    titulo: { type: String, required: true },
    escuela: { type: String, required: true, default: 'General' },
    materia: { type: String, required: true },
    tema: { type: String, default: '' },
    claseOrigen: { type: String, default: '' },
    link: { type: String, required: true },
    profesor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IRecurso>('Recurso', RecursoSchema);