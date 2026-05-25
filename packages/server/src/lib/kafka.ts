import { Kafka, Producer } from 'kafkajs';

let producer: Producer | null = null;

export const createProducer = async (): Promise<void> => {
  const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');
  try {
    const kafka = new Kafka({ clientId: 'simple-todo-server', brokers });
    producer = kafka.producer();
    await producer.connect();
    console.log(`Kafka producer connected (${brokers.join(',')})`);
  } catch (error) {
    producer = null;
    console.warn('Kafka producer unavailable, continuing without Kafka events.', error);
  }
};

export const publishTodoEvent = async (
  eventType: 'todo.created' | 'todo.deleted',
  payload: unknown,
): Promise<void> => {
  if (!producer) return;

  const topic = process.env.KAFKA_TOPIC ?? 'todo-events';

  console.log('🚀 sending event to kafka', eventType, payload);

  await producer.send({
    topic,
    messages: [
      {
        key: eventType,
        value: JSON.stringify({ eventType, timestamp: new Date().toISOString(), payload }),
      },
    ],
  });
};
