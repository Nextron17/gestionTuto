import mongoose, { Schema, Document } from 'mongoose';

export interface IRecurso extends Document {
  titulo: string;
  materia: string;
  link: string;
  profesor: mongoose.Types.ObjectId;
}

const RecursoSchema = new Schema({
  titulo: { type: String, required: true },
  materia: { type: String, required: true },
  link: { type: String, required: true },
  profesor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
}, { timestamps: true });

export default mongoose.model<IRecurso>('Recurso', RecursoSchema);