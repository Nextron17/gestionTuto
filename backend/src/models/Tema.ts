import { Schema, model } from 'mongoose';

const temaSchema = new Schema({
  nombre: { type: String, required: true },
  materia: { type: Schema.Types.ObjectId, ref: 'Materia', required: true }
}, { timestamps: true });

export default model('Tema', temaSchema);