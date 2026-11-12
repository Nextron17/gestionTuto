import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes';
import tutoriasRoutes from './routes/tutorias.routes';
import horariosRoutes from './routes/horarios.routes';
import recursosRoutes from './routes/recursos.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI as string;

mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectado a MongoDB Atlas'))
  .catch((err) => console.error('Error conectando a MongoDB:', err));

app.get('/api/status', (req: Request, res: Response) => {
  res.json({ message: '¡El backend en TypeScript está funcionando correctamente!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tutorias', tutoriasRoutes);
app.use('/api/horarios', horariosRoutes);
app.use('/api/recursos', recursosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor TS corriendo en http://localhost:${PORT}`);
});