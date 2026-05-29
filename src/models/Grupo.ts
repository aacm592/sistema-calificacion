import mongoose, { Schema, Document } from 'mongoose';

export interface IGrupo extends Document {
  nombre: string;
  fechaCreacion: Date;
}

const GrupoSchema: Schema = new Schema({
  nombre: { type: String, required: true },
  fechaCreacion: { type: Date, default: Date.now }
});

export default mongoose.models.Grupo || mongoose.model<IGrupo>('Grupo', GrupoSchema);