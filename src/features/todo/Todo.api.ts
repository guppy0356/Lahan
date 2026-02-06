export type Todo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
};

const BASE_URL = 'https://jsonplaceholder.typicode.com/todos';

export const todoApi = {
  getAll: async (): Promise<Todo[]> => {
    const res = await fetch(`${BASE_URL}?_limit=8`);
    if (!res.ok) throw new Error('Failed to fetch todos');
    return res.json();
  },

  create: async (title: string): Promise<Todo> => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({ title, userId: 1, completed: false }),
      headers: { 'Content-type': 'application/json; charset=UTF-8' },
    });
    if (!res.ok) throw new Error('Failed to create todo');
    return res.json();
  },
};
