import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { Kafka, Producer } from 'kafkajs';

dotenv.config();

type Todo = {
  id: string;
  text: string;
  createdAt: string;
};

const app = express();
const port = Number(process.env.PORT ?? 4000);
const kafkaBrokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');
const kafkaTopic = process.env.KAFKA_TOPIC ?? 'todo-events';

const todos: Todo[] = [];

app.use(cors());
app.use(express.json());

let producer: Producer | null = null;

const createProducer = async (): Promise<void> => {
  try {
    const kafka = new Kafka({
      clientId: 'simple-todo-server',
      brokers: kafkaBrokers,
    });
    producer = kafka.producer();
    await producer.connect();
    console.log(`Kafka producer connected (${kafkaBrokers.join(',')})`);
  } catch (error) {
    producer = null;
    console.warn('Kafka producer unavailable, continuing without Kafka events.', error);
  }
};

const publishTodoEvent = async (eventType: 'todo.created' | 'todo.deleted', payload: unknown): Promise<void> => {
  if (!producer) {
    return;
  }

  console.log("🚀 sending event to kafka", eventType, payload);

  await producer.send({
    topic: kafkaTopic,
    messages: [
      {
        key: eventType,
        value: JSON.stringify({
          eventType,
          timestamp: new Date().toISOString(),
          payload,
        }),
      },
    ],
  });
};

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/todos', (_req, res) => {
  res.json(todos);
});

app.post('/todos', async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

  if (!text) {
    return res.status(400).json({ message: 'text is required' });
  }

  const todo: Todo = {
    id: crypto.randomUUID(),
    text,
    createdAt: new Date().toISOString(),
  };

  todos.unshift(todo);

  try {
    await publishTodoEvent('todo.created', todo);
  } catch (error) {
    console.warn('Failed to publish todo.created event.', error);
  }

  return res.status(201).json(todo);
});

app.delete('/todos/:id', async (req, res) => {
  const index = todos.findIndex((todo) => todo.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'todo not found' });
  }

  const [deleted] = todos.splice(index, 1);

  try {
    await publishTodoEvent('todo.deleted', deleted);
  } catch (error) {
    console.warn('Failed to publish todo.deleted event.', error);
  }

  return res.status(204).send();
});

const start = async (): Promise<void> => {
  await createProducer();

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start server.', error);
  process.exit(1);
});
