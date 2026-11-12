import mongoose, { Schema, Document } from 'mongoose';

export interface IHorarioDisponible extends Document {
  profesor: mongoose.Types.ObjectId;
  dia: string;
  horaInicio: string;
  horaFin: string;
}

const HorarioDisponibleSchema = new Schema({
  profesor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  dia: { type: String, required: true },
  horaInicio: { type: String, required: true },
  horaFin: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IHorarioDisponible>('HorarioDisponible', HorarioDisponibleSchema);