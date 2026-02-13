import { createFileRoute } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ApiError } from '../api/client'
import { useTodoFacade } from '../features/todo/Todo.facade'
import { TodoView } from '../features/todo/Todo.component'

function TodoError({ error }: ErrorComponentProps) {
  return (
    <div className="p-8 text-center">
      <p className="text-red-600 font-semibold">
        {error instanceof ApiError
          ? `Error ${error.status}: ${error.message}`
          : error.message}
      </p>
    </div>
  );
}

export const Route = createFileRoute('/todo')({
  component: TodoPage,
  errorComponent: TodoError,
})

function TodoSkeleton() {
  return <div className="p-8 text-center animate-pulse">Loading Todos...</div>
}

function TodoContent() {
  const facade = useTodoFacade();
  return <TodoView {...facade} />;
}

function TodoPage() {
  return (
    <div className="p-2">
      <Suspense fallback={<TodoSkeleton />}>
        <TodoContent />
      </Suspense>
    </div>
  )
}
