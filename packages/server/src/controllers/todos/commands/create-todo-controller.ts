import { Request, Response } from 'express';
import { supabase } from '../../../lib/supabase.js';
import { publishTodoEvent } from '../../../lib/kafka.js';
import { toTodo, TodoRow } from '../../../models/todo.js';

export const createTodo = async (req: Request, res: Response): Promise<void> => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

  if (!text) {
    res.status(400).json({ message: 'text is required' });
    return;
  }

  const { data, error } = await supabase
    .from('todos')
    .insert({ text })
    .select()
    .single();

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  const todo = toTodo(data as TodoRow);

  try {
    await publishTodoEvent('todo.created', todo);
  } catch (err) {
    console.warn('Failed to publish todo.created event.', err);
  }

  res.status(201).json(todo);
};
