import { renderHook, act } from '@testing-library/react';
import { useTodoPresenter } from './Todo.presenter';

describe('useTodoPresenter', () => {
  const mockAddTodo = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has empty newTitle initially', () => {
    const { result } = renderHook(() =>
      useTodoPresenter({ addTodo: mockAddTodo }),
    );
    expect(result.current.newTitle).toBe('');
  });

  it('updates newTitle via onNewTitleChange', () => {
    const { result } = renderHook(() =>
      useTodoPresenter({ addTodo: mockAddTodo }),
    );

    act(() => {
      result.current.onNewTitleChange('New Task');
    });

    expect(result.current.newTitle).toBe('New Task');
  });

  it('calls addTodo and clears input on submit', async () => {
    const { result } = renderHook(() =>
      useTodoPresenter({ addTodo: mockAddTodo }),
    );

    act(() => {
      result.current.onNewTitleChange('New Task');
    });

    const submitEvent = new Event('submit', { cancelable: true }) as unknown as React.SubmitEvent;
    submitEvent.preventDefault = vi.fn();

    await act(async () => {
      await result.current.onAddSubmit(submitEvent);
    });

    expect(mockAddTodo).toHaveBeenCalledWith('New Task');
    expect(result.current.newTitle).toBe('');
    expect(submitEvent.preventDefault).toHaveBeenCalled();
  });

  it('does not call addTodo when title is empty', async () => {
    const { result } = renderHook(() =>
      useTodoPresenter({ addTodo: mockAddTodo }),
    );

    const submitEvent = new Event('submit', { cancelable: true }) as unknown as React.SubmitEvent;
    submitEvent.preventDefault = vi.fn();

    await act(async () => {
      await result.current.onAddSubmit(submitEvent);
    });

    expect(mockAddTodo).not.toHaveBeenCalled();
  });

  it('does not call addTodo when title is whitespace only', async () => {
    const { result } = renderHook(() =>
      useTodoPresenter({ addTodo: mockAddTodo }),
    );

    act(() => {
      result.current.onNewTitleChange('   ');
    });

    const submitEvent = new Event('submit', { cancelable: true }) as unknown as React.SubmitEvent;
    submitEvent.preventDefault = vi.fn();

    await act(async () => {
      await result.current.onAddSubmit(submitEvent);
    });

    expect(mockAddTodo).not.toHaveBeenCalled();
  });
});
