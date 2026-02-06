import { useState, useCallback } from 'react';
import type { useTodoFacade } from './Todo.facade';

type Props = Pick<ReturnType<typeof useTodoFacade>, 'addTodo'>;

export function useTodoPresenter({ addTodo }: Props) {
  const [newTitle, setNewTitle] = useState('');

  const handleNewTitleChange = useCallback((title: string) => {
    setNewTitle(title);
  }, []);

  const handleAddSubmit = useCallback(async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await addTodo(newTitle);
    setNewTitle('');
  }, [newTitle, addTodo]);

  return {
    newTitle,
    onNewTitleChange: handleNewTitleChange,
    onAddSubmit: handleAddSubmit,
  };
}