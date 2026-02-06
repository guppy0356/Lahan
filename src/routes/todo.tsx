import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { useTodoFacade } from '../features/todo/Todo.facade'
import { TodoView } from '../features/todo/Todo.component'

export const Route = createFileRoute('/todo')({
  component: TodoPage,
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
