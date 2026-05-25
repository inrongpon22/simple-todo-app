import cors from 'cors';
import express from 'express';
import todosRouter from './routes/todos.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/todos', todosRouter);

export default app;
