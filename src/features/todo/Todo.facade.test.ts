import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, createElement, type ReactNode } from 'react';
import { useTodoFacade } from './Todo.facade';
import { todoApi, type Todo } from './Todo.api';

vi.mock('./Todo.api', () => ({
  todoApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    toggle: vi.fn(),
  },
}));

const mockTodos: Todo[] = [
  { id: 1, userId: 1, title: 'Task 1', completed: false },
  { id: 2, userId: 1, title: 'Task 2', completed: true },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(Suspense, { fallback: createElement('div') }, children),
    );
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useTodoFacade', () => {
  it('fetches todos via todoApi.getAll', async () => {
    vi.mocked(todoApi.getAll).mockResolvedValue(mockTodos);

    const { result } = renderHook(() => useTodoFacade(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.todos).toEqual(mockTodos);
    });
    expect(todoApi.getAll).toHaveBeenCalledOnce();
  });

  it('addTodo updates the cache on success', async () => {
    vi.mocked(todoApi.getAll).mockResolvedValue(mockTodos);
    const newTodo: Todo = { id: 3, userId: 1, title: 'Task 3', completed: false };
    vi.mocked(todoApi.create).mockResolvedValue(newTodo);

    const { result } = renderHook(() => useTodoFacade(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.todos).toEqual(mockTodos);
    });

    await result.current.addTodo('Task 3');

    await waitFor(() => {
      expect(result.current.todos).toContainEqual(newTodo);
    });
    expect(todoApi.create).toHaveBeenCalledWith('Task 3', expect.anything());
  });

  it('toggleTodo optimistically updates the cache', async () => {
    vi.mocked(todoApi.getAll).mockResolvedValue(mockTodos);
    vi.mocked(todoApi.toggle).mockResolvedValue({ ...mockTodos[0], completed: true });

    const { result } = renderHook(() => useTodoFacade(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.todos).toEqual(mockTodos);
    });

    result.current.toggleTodo(1);

    await waitFor(() => {
      expect(result.current.todos.find((t) => t.id === 1)?.completed).toBe(true);
    });
  });

  it('toggleTodo rolls back on error', async () => {
    vi.mocked(todoApi.getAll).mockResolvedValue(mockTodos);
    vi.mocked(todoApi.toggle).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTodoFacade(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.todos).toEqual(mockTodos);
    });

    result.current.toggleTodo(1);

    // After the mutation settles (error), the cache should be rolled back to original
    await waitFor(() => {
      expect(todoApi.toggle).toHaveBeenCalled();
    });

    // The rollback restores original state
    await waitFor(() => {
      expect(result.current.todos.find((t) => t.id === 1)?.completed).toBe(false);
    });
  });

  it('exposes isCreating while addTodo is pending', async () => {
    vi.mocked(todoApi.getAll).mockResolvedValue(mockTodos);

    let resolveCreate!: (value: Todo) => void;
    vi.mocked(todoApi.create).mockImplementation(
      () => new Promise((resolve) => { resolveCreate = resolve; }),
    );

    const { result } = renderHook(() => useTodoFacade(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.todos).toEqual(mockTodos);
    });

    expect(result.current.isCreating).toBe(false);

    const promise = result.current.addTodo('Pending task');

    await waitFor(() => {
      expect(result.current.isCreating).toBe(true);
    });

    resolveCreate({ id: 4, userId: 1, title: 'Pending task', completed: false });
    await promise;

    await waitFor(() => {
      expect(result.current.isCreating).toBe(false);
    });
  });
});
