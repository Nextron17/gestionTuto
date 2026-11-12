import { Schema, model } from 'mongoose';

const carreraSchema = new Schema({
  nombre: { type: String, required: true },
  escuela: { type: Schema.Types.ObjectId, ref: 'Escuela', required: true }
}, { timestamps: true });

export default model('Carrera', carreraSchema);