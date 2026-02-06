// src/routes/todo.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/todo')({
  component: Todo,
})

function Todo() {
  // ゆくゆくはここで Facade を呼び出し、Presenter に渡す形になります
  // const { todos, addTodo } = useTodoFacade();
  
  return (
    <div className="p-2">
      <h2 className="text-2xl font-bold mb-4">TODO List</h2>
      <div className="p-4 bg-white rounded shadow">
        TODO
      </div>
    </div>
  )
}
