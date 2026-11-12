import mongoose, { Schema, Document } from 'mongoose';

export interface IUsuario extends Document {
  nombre: string;
  email: string;
  passwordHash: string;
  rol: 'estudiante' | 'profesor' | 'admin';
  escuela?: string;
  carrera?: string;
  semestre?: number;
  materias?: string[];
}

const UsuarioSchema: Schema = new Schema(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    rol: {
      type: String,
      enum: ['estudiante', 'profesor', 'admin'],
      default: 'estudiante',
    },
    escuela: { type: String },
    carrera: { type: String },
    semestre: { type: Number },
    materias: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IUsuario>('Usuario', UsuarioSchema);