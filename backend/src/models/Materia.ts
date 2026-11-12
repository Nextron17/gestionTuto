import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMateria extends Document {
  nombre: string;
  codigo: string;
  carrera: Types.ObjectId;
}

const MateriaSchema: Schema = new Schema(
  {
    nombre: { type: String, required: true },
    codigo: { type: String, required: true, unique: true },
    carrera: { type: Schema.Types.ObjectId, ref: 'Carrera', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMateria>('Materia', MateriaSchema);