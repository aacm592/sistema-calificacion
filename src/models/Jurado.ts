import mongoose, { Schema, Document } from 'mongoose';

export interface IJurado extends Document {
  nombre: string;
  foto: string;
  aceptado: boolean;
  fechaRegistro: Date;
}

const JuradoSchema: Schema = new Schema({
  nombre: { type: String, required: true },
  foto: { type: String, default: '' },
  aceptado: { type: Boolean, default: false }, // El administrador debe pasarlo a true
  fechaRegistro: { type: Date, default: Date.now }
});

export default mongoose.models.Jurado || mongoose.model<IJurado>('Jurado', JuradoSchema);