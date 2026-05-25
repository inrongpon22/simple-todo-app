export type Todo = {
  id: string;
  text: string;
  createdAt: string;
};

export type TodoRow = {
  id: string;
  text: string;
  created_at: string;
};

export const toTodo = (row: TodoRow): Todo => ({
  id: row.id,
  text: row.text,
  createdAt: row.created_at,
});
