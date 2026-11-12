import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import tutoriasRoutes from './routes/tutorias.routes';
import horariosRoutes from './routes/horarios.routes';
import recursosRoutes from './routes/recursos.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tutorias', tutoriasRoutes);
app.use('/api/horarios', horariosRoutes);
app.use('/api/recursos', recursosRoutes);
app.use('/api/admin', adminRoutes);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion_tutorias';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Conectado a MongoDB');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error conectando a MongoDB:', error);
  });