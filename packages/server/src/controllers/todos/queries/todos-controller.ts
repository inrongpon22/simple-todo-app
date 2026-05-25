import { Request, Response } from 'express';
import { supabase } from '../../../lib/supabase.js';
import { toTodo, TodoRow } from '../../../models/todo.js';

export const listTodos = async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  res.json((data as TodoRow[]).map(toTodo));
};
