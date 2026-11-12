import { Schema, model } from 'mongoose';

const materiaSchema = new Schema({
  nombre: { type: String, required: true },
  codigo: { type: String, required: true },
  carrera: { type: Schema.Types.ObjectId, ref: 'Carrera', required: true }
}, { timestamps: true });

export default model('Materia', materiaSchema);