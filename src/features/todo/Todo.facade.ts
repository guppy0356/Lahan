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

  const { mutate: toggleTodo } = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      todoApi.toggle(id, completed),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const previous = queryClient.getQueryData<Todo[]>(['todos']);
      queryClient.setQueryData(['todos'], (todos: Todo[] | undefined) => {
        if (!todos) return [];
        return todos.map(t => t.id === id ? { ...t, completed } : t);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['todos'], context.previous);
      }
    },
  });

  const handleToggleTodo = useCallback(
    (id: number) => {
      const todo = todos.find(t => t.id === id);
      if (todo) toggleTodo({ id, completed: !todo.completed });
    },
    [todos, toggleTodo],
  );

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
