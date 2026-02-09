import { apiClient } from '../../api/client';
import type { components } from '../../api/schema';

export type Todo = components['schemas']['Todo'];
type CreateTodoInput = components['schemas']['CreateTodoInput'];

export const todoApi = {
  getAll: () =>
    apiClient<Todo[]>('/todos?_limit=8'),

  create: (title: string) =>
    apiClient<Todo>('/todos', {
      method: 'POST',
      body: JSON.stringify({ title, userId: 1, completed: false } satisfies CreateTodoInput),
    }),
};
