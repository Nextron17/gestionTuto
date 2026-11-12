import mongoose, { Schema, Document } from 'mongoose';

export interface IEscuela extends Document {
  nombre: string;
  codigo: string;
}

const EscuelaSchema: Schema = new Schema(
  {
    nombre: { type: String, required: true, unique: true },
    codigo: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model<IEscuela>('Escuela', EscuelaSchema);