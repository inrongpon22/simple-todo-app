import React from 'react';
import type { ChangeEvent, FormEvent } from 'react';

interface Todo {
  id: string;
  text: string;
  createdAt: string;
}

interface TodoPageState {
  todos: Todo[];
  text: string;
  loading: boolean;
  error: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export class TodoPage extends React.Component<Record<string, never>, TodoPageState> {
  state: TodoPageState = { todos: [], text: '', loading: false, error: '' };

  componentDidMount(): void {
    void this._loadTodos();
  }

  private _loadTodos = async (): Promise<void> => {
    this.setState({ loading: true, error: '' });
    try {
      const response = await fetch(`${API_BASE_URL}/todos`);
      if (!response.ok) throw new Error('Failed to fetch todos');
      const data = (await response.json()) as Todo[];
      this.setState({ todos: data });
    } catch (err) {
      this.setState({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      this.setState({ loading: false });
    }
  };

  private _handleAddTodo = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const value = this.state.text.trim();
    if (!value) return;
    this.setState({ error: '' });
    try {
      const response = await fetch(`${API_BASE_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value }),
      });
      if (!response.ok) throw new Error('Failed to add todo');
      const created = (await response.json()) as Todo;
      this.setState((prev) => ({ todos: [created, ...prev.todos], text: '' }));
    } catch (err) {
      this.setState({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  private _handleDeleteTodo = async (id: string): Promise<void> => {
    this.setState({ error: '' });
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete todo');
      this.setState((prev) => ({ todos: prev.todos.filter((t) => t.id !== id) }));
    } catch (err) {
      this.setState({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  private _handleTextChange = (event: ChangeEvent<HTMLInputElement>): void => {
    this.setState({ text: event.target.value });
  };

  render(): React.ReactNode {
    const { todos, text, loading, error } = this.state;

    return (
      <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-10">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Simple TODO App</h1>
          <p className="mt-1 text-sm text-slate-500">React + Express + Kafka events</p>

          <form className="mt-6 flex gap-2" onSubmit={this._handleAddTodo}>
            <input
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              placeholder="Add a new todo..."
              value={text}
              onChange={this._handleTextChange}
            />
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
            >
              Add
            </button>
          </form>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {loading && <p className="mt-3 text-sm text-slate-500">Loading todos...</p>}

          <ul className="mt-6 space-y-2">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
              >
                <span>{todo.text}</span>
                <button
                  type="button"
                  className="rounded border border-red-300 px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => void this._handleDeleteTodo(todo.id)}
                >
                  Delete
                </button>
              </li>
            ))}
            {!loading && todos.length === 0 && (
              <li className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-center text-slate-500">
                No todos yet
              </li>
            )}
          </ul>
        </section>
      </main>
    );
  }
}
