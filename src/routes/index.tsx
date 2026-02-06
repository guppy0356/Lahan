import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="p-2">
      <h2 className="text-2xl font-bold">Welcome to Dashboard</h2>
      <p className="mt-4 text-gray-600">サイドバーからメニューを選択してください。</p>
    </div>
  )
}
