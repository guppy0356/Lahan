import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi, type Todo } from './Todo.api';

export function useTodoFacade() {
  const queryClient = useQueryClient();

  const { data: todos } = useSuspenseQuery({
    queryKey: ['todos'],
    queryFn: todoApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: todoApi.create,
    onSuccess: (newTodo) => {
      queryClient.setQueryData(['todos'], (todos: Todo[] | undefined) => {
        return todos ? [newTodo, ...todos] : [newTodo];
      });
    },
  });

  const handleToggleTodo = (id: number) => {
    queryClient.setQueryData(['todos'], (todos: Todo[] | undefined) => {
      if (!todos) return [];
      return todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    });
  };

  return {
    todos,
    addTodo: (title: string) => createMutation.mutateAsync(title),
    toggleTodo: handleToggleTodo,
    isCreating: createMutation.isPending,
  };
}
