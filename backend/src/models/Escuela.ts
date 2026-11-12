import { Schema, model } from 'mongoose';

const escuelaSchema = new Schema({
  nombre: { type: String, required: true, unique: true },
  codigo: { type: String, required: true }
}, { timestamps: true });

export default model('Escuela', escuelaSchema);