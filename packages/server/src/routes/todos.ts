import { Router } from 'express';
import { listTodos } from '../controllers/todos/queries/todos-controller.js';
import { createTodo } from '../controllers/todos/commands/create-todo-controller.js';
import { deleteTodo } from '../controllers/todos/commands/delete-todo-controller.js';

const router = Router();

router.get('/', listTodos);
router.post('/', createTodo);
router.delete('/:id', deleteTodo);

export default router;
