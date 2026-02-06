import { memo } from 'react';
import type { useTodoFacade } from './Todo.facade';
import { useTodoPresenter } from './Todo.presenter';

type TodoViewProps = ReturnType<typeof useTodoFacade>;

export const TodoView = memo(({ 
  todos, 
  addTodo, 
  toggleTodo,
  isCreating 
}: TodoViewProps) => {
  const { newTitle, onNewTitleChange, onAddSubmit } = useTodoPresenter({ addTodo });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">My Tasks</h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {todos.length} Items
        </span>
      </div>

      <form onSubmit={onAddSubmit} className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => onNewTitleChange(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          disabled={isCreating}
        />
        <button
          type="submit"
          disabled={!newTitle.trim() || isCreating}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isCreating ? 'Adding...' : 'Add'}
        </button>
      </form>

      <ul className="divide-y divide-gray-100 bg-white rounded-xl shadow-sm border border-gray-200">
        {todos.map((todo) => (
          <li 
            key={todo.id} 
            className="p-4 hover:bg-gray-50 flex items-center gap-3 cursor-pointer transition-colors"
            onClick={() => toggleTodo(todo.id)}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              readOnly
              className="w-5 h-5 text-blue-600 rounded pointer-events-none"
            />
            <span className={`flex-1 ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
              {todo.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});

TodoView.displayName = 'TodoView';