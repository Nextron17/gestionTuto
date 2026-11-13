import mongoose, { Schema, Document } from 'mongoose';

export interface IHorarioDisponible extends Document {
  profesor: mongoose.Types.ObjectId;
  nombreProfesor: string;
  materia: string;
  semestre: number;
  dia: string;
  horaInicio: string;
  horaFin: string;
}

const HorarioDisponibleSchema = new Schema(
  {
    profesor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombreProfesor: { type: String, required: true, trim: true },
    materia: { type: String, required: true, trim: true },
    semestre: { type: Number, required: true, min: 1, max: 12 },
    dia: { type: String, required: true },
    horaInicio: { type: String, required: true },
    horaFin: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IHorarioDisponible>('HorarioDisponible', HorarioDisponibleSchema);