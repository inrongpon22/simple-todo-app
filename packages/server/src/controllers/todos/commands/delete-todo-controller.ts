import { Request, Response } from 'express';
import { supabase } from '../../../lib/supabase.js';
import { publishTodoEvent } from '../../../lib/kafka.js';
import { toTodo, TodoRow } from '../../../models/todo.js';

export const deleteTodo = async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('todos')
    .delete()
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    res.status(404).json({ message: 'todo not found' });
    return;
  }

  const deleted = toTodo(data as TodoRow);

  try {
    await publishTodoEvent('todo.deleted', deleted);
  } catch (err) {
    console.warn('Failed to publish todo.deleted event.', err);
  }

  res.status(204).send();
};
