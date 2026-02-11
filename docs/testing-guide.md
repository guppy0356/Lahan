# Testing Guide

## 概要

本プロジェクトでは Feature Module Pattern の3層（facade / presenter / component）に対応したテスト戦略を採用する。各レイヤーの責務に応じて依存をモックし、単体テストとして独立に検証する。

| レイヤー | 責務 | テスト観点 |
|---------|------|-----------|
| **facade** | TanStack Query によるサーバー状態管理 | データ取得、キャッシュ更新、楽観的更新・ロールバック、ローディング状態 |
| **presenter** | フォーム入力・バリデーション等の UI ロジック | 状態変更、イベントハンドラ、バリデーション |
| **component** | DOM レンダリング・ユーザーインタラクション | 表示内容、条件付きスタイル、イベント発火、disabled 状態 |

---

## テスト環境

**Vitest + jsdom + Testing Library** で構成されている。

### vite.config.ts

```ts
test: {
  globals: true,          // describe, it, expect 等をインポート不要に
  environment: 'jsdom',   // DOM API を提供
  setupFiles: ['./vitest.setup.ts'],
},
```

### vitest.setup.ts

```ts
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom';

afterEach(() => {
  cleanup();
});
```

- `@testing-library/jest-dom` を import することで `toBeInTheDocument()` 等のカスタムマッチャーが利用可能になる。
- `cleanup()` を毎テスト後に呼ぶことでレンダリング済み DOM をリセットする。

### tsconfig.app.json

```json
"types": ["vite/client", "vitest/globals", "@testing-library/jest-dom/vitest"]
```

> **注意**: `@testing-library/jest-dom/vitest` を `types` に追加しないと、`toBeInTheDocument()` 等で型エラーになる。

---

## facade.test.ts

TanStack Query フック（`useSuspenseQuery`, `useMutation`）をテストする。

### API 層のモック

`vi.mock` でモジュール全体をモックし、各テストで `vi.mocked()` を使って戻り値を制御する。

```ts
vi.mock('./Todo.api', () => ({
  todoApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    toggle: vi.fn(),
  },
}));
```

### createWrapper パターン

`useSuspenseQuery` は `QueryClientProvider` と `Suspense` boundary が必要。テスト用のラッパーを生成するヘルパーを用意する。

```ts
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(Suspense, { fallback: createElement('div') }, children),
    );
  };
}
```

- `retry: false` にしてテストの高速化・決定性を確保する。
- テストごとに新しい `QueryClient` を生成し、キャッシュの分離を保証する。

### データ取得の検証

```ts
it('fetches todos via todoApi.getAll', async () => {
  vi.mocked(todoApi.getAll).mockResolvedValue(mockTodos);

  const { result } = renderHook(() => useTodoFacade(), {
    wrapper: createWrapper(),
  });

  await waitFor(() => {
    expect(result.current.todos).toEqual(mockTodos);
  });
  expect(todoApi.getAll).toHaveBeenCalledOnce();
});
```

### 楽観的更新・ロールバックの検証

```ts
// 楽観的更新: mutation 発火後、API 応答前にキャッシュが更新されることを確認
result.current.toggleTodo(1);

await waitFor(() => {
  expect(result.current.todos.find((t) => t.id === 1)?.completed).toBe(true);
});

// ロールバック: API がエラーを返した場合、元の状態に戻ることを確認
vi.mocked(todoApi.toggle).mockRejectedValue(new Error('Network error'));

result.current.toggleTodo(1);

await waitFor(() => {
  expect(result.current.todos.find((t) => t.id === 1)?.completed).toBe(false);
});
```

### mutationFn の第2引数

TanStack Query は `mutationFn` にコンテキストオブジェクトを第2引数として渡す。テストでは `expect.anything()` で無視する。

```ts
expect(todoApi.create).toHaveBeenCalledWith('Task 3', expect.anything());
```

### isPending ローディング状態の検証

Promise を手動 resolve するパターンで、ローディング中の状態を確実にキャプチャする。

```ts
let resolveCreate!: (value: Todo) => void;
vi.mocked(todoApi.create).mockImplementation(
  () => new Promise((resolve) => { resolveCreate = resolve; }),
);

const promise = result.current.addTodo('Pending task');

await waitFor(() => {
  expect(result.current.isCreating).toBe(true);
});

resolveCreate({ id: 4, userId: 1, title: 'Pending task', completed: false });
await promise;

await waitFor(() => {
  expect(result.current.isCreating).toBe(false);
});
```

---

## presenter.test.ts

Presenter は facade への依存を `vi.fn()` で注入し、純粋な UI ロジックとしてテストする。

### facade 依存の注入

`Pick<ReturnType<typeof useFacade>, ...>` の型に合わせてモック関数を渡す。

```ts
const mockAddTodo = vi.fn().mockResolvedValue(undefined);

const { result } = renderHook(() =>
  useTodoPresenter({ addTodo: mockAddTodo }),
);
```

> **注意**: `mockAddTodo` は `async` 関数（`Promise<void>` を返す）にする必要がある。`.mockResolvedValue(undefined)` を使う。

### renderHook + act による状態変更

```ts
it('updates newTitle via onNewTitleChange', () => {
  const { result } = renderHook(() =>
    useTodoPresenter({ addTodo: mockAddTodo }),
  );

  act(() => {
    result.current.onNewTitleChange('New Task');
  });

  expect(result.current.newTitle).toBe('New Task');
});
```

### SubmitEvent のモック

jsdom は `SubmitEvent` コンストラクタを完全にサポートしないため、`Event` から生成して型アサーションする。

```ts
const submitEvent = new Event('submit', { cancelable: true }) as unknown as React.SubmitEvent;
submitEvent.preventDefault = vi.fn();

await act(async () => {
  await result.current.onAddSubmit(submitEvent);
});

expect(submitEvent.preventDefault).toHaveBeenCalled();
```

### バリデーションの検証

空文字・空白のみの入力で `addTodo` が呼ばれないことを確認する。

```ts
// 空文字
it('does not call addTodo when title is empty', async () => {
  // newTitle はデフォルトで ''
  await act(async () => {
    await result.current.onAddSubmit(submitEvent);
  });
  expect(mockAddTodo).not.toHaveBeenCalled();
});

// 空白のみ
it('does not call addTodo when title is whitespace only', async () => {
  act(() => {
    result.current.onNewTitleChange('   ');
  });
  await act(async () => {
    await result.current.onAddSubmit(submitEvent);
  });
  expect(mockAddTodo).not.toHaveBeenCalled();
});
```

---

## component.test.tsx

コンポーネントは presenter をモックし、facade の値は props として直接注入してテストする。

### presenter のモック

```ts
vi.mock('./Todo.presenter', () => ({
  useTodoPresenter: vi.fn(),
}));

const mockPresenter = {
  newTitle: '',
  onNewTitleChange: vi.fn(),
  onAddSubmit: vi.fn(async (e: React.SubmitEvent) => { e.preventDefault(); }),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useTodoPresenter).mockReturnValue(mockPresenter);
});
```

> **注意**: `onAddSubmit` のモックは `async` にして `Promise<void>` 型を合わせる。また `e.preventDefault()` を呼ぶことで form のデフォルト動作を抑止する。

### facade は props として直接注入

コンポーネントが props で facade の値を受け取る設計のため、モック不要。

```ts
const defaultProps = {
  todos: mockTodos,
  addTodo: vi.fn(),
  toggleTodo: vi.fn(),
  isCreating: false,
};

render(<TodoView {...defaultProps} />);
```

### DOM 検証とインタラクション

```ts
// テキスト表示の確認
expect(screen.getByText('Task 1')).toBeInTheDocument();

// CSS クラスの確認
expect(screen.getByText('Task 2')).toHaveClass('line-through');

// クリックイベント
fireEvent.click(screen.getByText('Task 1'));
expect(defaultProps.toggleTodo).toHaveBeenCalledWith(1);

// input の変更
fireEvent.change(input, { target: { value: 'New Task' } });
expect(mockPresenter.onNewTitleChange).toHaveBeenCalledWith('New Task');

// フォーム送信
fireEvent.submit(form);
expect(mockPresenter.onAddSubmit).toHaveBeenCalled();
```

### 条件付き表示・disabled 状態

```ts
// isCreating 中は input が無効化され「Adding...」が表示される
render(<TodoView {...defaultProps} isCreating={true} />);
expect(screen.getByPlaceholderText('What needs to be done?')).toBeDisabled();
expect(screen.getByText('Adding...')).toBeInTheDocument();

// presenter の戻り値を変更して Add ボタンの有効/無効を検証
vi.mocked(useTodoPresenter).mockReturnValue({ ...mockPresenter, newTitle: '' });
render(<TodoView {...defaultProps} />);
expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();

vi.mocked(useTodoPresenter).mockReturnValue({ ...mockPresenter, newTitle: 'Something' });
render(<TodoView {...defaultProps} />);
expect(screen.getByRole('button', { name: 'Add' })).not.toBeDisabled();
```

---

## 注意事項

### 型定義

- `tsconfig.app.json` の `types` に `@testing-library/jest-dom/vitest` を追加すること。これがないと `toBeInTheDocument()`, `toHaveClass()`, `toBeDisabled()` 等で TypeScript の型エラーが発生する。

### モック関数の型合わせ

- presenter テストで facade のアクション関数をモックする際、`vi.fn()` だけでは `Promise<void>` を返さない。`vi.fn().mockResolvedValue(undefined)` を使うこと。
- component テストで `onAddSubmit` をモックする際も同様に `async` にする。

### useSuspenseQuery と Suspense

- `useSuspenseQuery` は Promise を throw するため、`Suspense` boundary なしでは React がエラーを投げる。facade テストでは必ず `createWrapper` に `Suspense` を含めること。

### テスト間の分離

- `beforeEach` で `vi.clearAllMocks()` を呼び、テスト間でモックの呼び出し履歴をリセットする。
- `createWrapper` はテストごとに新しい `QueryClient` を生成し、キャッシュが共有されないようにする。
