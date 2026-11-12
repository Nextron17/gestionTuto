import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICarrera extends Document {
  nombre: string;
  codigo: string;
  escuela: Types.ObjectId;
}

const CarreraSchema: Schema = new Schema(
  {
    nombre: { type: String, required: true },
    codigo: { type: String, required: true, unique: true },
    escuela: { type: Schema.Types.ObjectId, ref: 'Escuela', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICarrera>('Carrera', CarreraSchema);