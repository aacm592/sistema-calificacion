import mongoose, { Schema, Document } from 'mongoose';

export interface ICalificacion extends Document {
  grupoId: mongoose.Types.ObjectId;
  juradoId: mongoose.Types.ObjectId;
  criterios: {
    interpretacion: { afinacion: number; armonia: number; calidad: number; coordinacion: number; dominioTecnico: number; };
    expresion: { dominioEscenario: number; expresividad: number; conexionPublico: number; presencia: number; };
    presentacion: { vestimenta: number; cuerpoBaile: number; barra: number; };
    originalidad: { identidad: number; propuesta: number; };
  };
  puntajeTotal: number;
  ultimaEdicion: Date;
}

const CalificacionSchema: Schema = new Schema({
  grupoId: { type: Schema.Types.ObjectId, ref: 'Grupo', required: true },
  juradoId: { type: Schema.Types.ObjectId, ref: 'Jurado', required: true },
  
  criterios: {
    interpretacion: {
      afinacion: { type: Number, default: 0, min: 0, max: 12 },
      armonia: { type: Number, default: 0, min: 0, max: 12 },
      calidad: { type: Number, default: 0, min: 0, max: 12 },
      coordinacion: { type: Number, default: 0, min: 0, max: 12 },
      dominioTecnico: { type: Number, default: 0, min: 0, max: 12 }
    },
    expresion: {
      dominioEscenario: { type: Number, default: 0, min: 0, max: 5 },
      expresividad: { type: Number, default: 0, min: 0, max: 5 },
      conexionPublico: { type: Number, default: 0, min: 0, max: 5 },
      presencia: { type: Number, default: 0, min: 0, max: 5 }
    },
    presentacion: {
      vestimenta: { type: Number, default: 0, min: 0, max: 4 },
      cuerpoBaile: { type: Number, default: 0, min: 0, max: 3 },
      barra: { type: Number, default: 0, min: 0, max: 3 }
    },
    originalidad: {
      identidad: { type: Number, default: 0, min: 0, max: 5 },
      propuesta: { type: Number, default: 0, min: 0, max: 5 }
    }
  },
  
  puntajeTotal: { type: Number, default: 0, min: 0, max: 100 },
  ultimaEdicion: { type: Date, default: Date.now }
});

// Índice compuesto único: Garantiza que un mismo jurado no pueda tener dos registros de calificación para el mismo grupo.
CalificacionSchema.index({ grupoId: 1, juradoId: 1 }, { unique: true });

export default mongoose.models.Calificacion || mongoose.model<ICalificacion>('Calificacion', CalificacionSchema);