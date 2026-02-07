import { useCallback } from 'react';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi, type Todo } from './Todo.api';

export function useTodoFacade() {
  const queryClient = useQueryClient();

  const { data: todos } = useSuspenseQuery({
    queryKey: ['todos'],
    queryFn: todoApi.getAll,
  });

  const { mutateAsync, isPending: isCreating } = useMutation({
    mutationFn: todoApi.create,
    onSuccess: (newTodo) => {
      queryClient.setQueryData(['todos'], (todos: Todo[] | undefined) => {
        return todos ? [newTodo, ...todos] : [newTodo];
      });
    },
  });

  const handleToggleTodo = useCallback((id: number) => {
    queryClient.setQueryData(['todos'], (todos: Todo[] | undefined) => {
      if (!todos) return [];
      return todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    });
  }, [queryClient]);

  const handleAddTodo = useCallback(
    (title: string) => mutateAsync(title),
    [mutateAsync],
  );

  return {
    todos,
    addTodo: handleAddTodo,
    toggleTodo: handleToggleTodo,
    isCreating,
  };
}
