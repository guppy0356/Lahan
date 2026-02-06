import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-wider">Lahan App</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {/* Dashboard Link */}
          <Link
            to="/"
            className="block px-4 py-2 rounded transition-colors text-gray-400 hover:bg-gray-800 hover:text-white"
            activeProps={{ className: 'bg-gray-800 text-white' }}
          >
            Dashboard
          </Link>

          {/* TODO Link */}
          <Link
            to="/todo"
            className="block px-4 py-2 rounded transition-colors text-gray-400 hover:bg-gray-800 hover:text-white"
            activeProps={{ className: 'bg-blue-600 text-white' }}
          >
            Todo
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>

      {/* DevTools (開発時のみ表示) */}
      <TanStackRouterDevtools />
    </div>
  )
}
