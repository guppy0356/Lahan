import { render, screen, fireEvent } from '@testing-library/react';
import { TodoView } from './Todo.component';
import { useTodoPresenter } from './Todo.presenter';
import type { Todo } from './Todo.api';

vi.mock('./Todo.presenter', () => ({
  useTodoPresenter: vi.fn(),
}));

const mockTodos: Todo[] = [
  { id: 1, userId: 1, title: 'Task 1', completed: false },
  { id: 2, userId: 1, title: 'Task 2', completed: true },
];

const mockPresenter = {
  newTitle: '',
  onNewTitleChange: vi.fn(),
  onAddSubmit: vi.fn(async (e: React.SubmitEvent) => { e.preventDefault(); }),
};

const defaultProps = {
  todos: mockTodos,
  addTodo: vi.fn(),
  toggleTodo: vi.fn(),
  isCreating: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useTodoPresenter).mockReturnValue(mockPresenter);
});

describe('TodoView', () => {
  it('renders all todos', () => {
    render(<TodoView {...defaultProps} />);

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('2 Items')).toBeInTheDocument();
  });

  it('applies line-through to completed todo', () => {
    render(<TodoView {...defaultProps} />);

    const completedSpan = screen.getByText('Task 2');
    expect(completedSpan).toHaveClass('line-through');

    const activeSpan = screen.getByText('Task 1');
    expect(activeSpan).not.toHaveClass('line-through');
  });

  it('calls toggleTodo when clicking a todo item', () => {
    render(<TodoView {...defaultProps} />);

    fireEvent.click(screen.getByText('Task 1'));
    expect(defaultProps.toggleTodo).toHaveBeenCalledWith(1);
  });

  it('calls onNewTitleChange when typing in input', () => {
    render(<TodoView {...defaultProps} />);

    const input = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.change(input, { target: { value: 'New Task' } });

    expect(mockPresenter.onNewTitleChange).toHaveBeenCalledWith('New Task');
  });

  it('calls onAddSubmit when form is submitted', () => {
    render(<TodoView {...defaultProps} />);

    const form = screen.getByPlaceholderText('What needs to be done?').closest('form')!;
    fireEvent.submit(form);

    expect(mockPresenter.onAddSubmit).toHaveBeenCalled();
  });

  it('disables input and shows Adding... when isCreating', () => {
    render(<TodoView {...defaultProps} isCreating={true} />);

    const input = screen.getByPlaceholderText('What needs to be done?');
    expect(input).toBeDisabled();

    expect(screen.getByText('Adding...')).toBeInTheDocument();
  });

  it('disables Add button when input is empty', () => {
    vi.mocked(useTodoPresenter).mockReturnValue({ ...mockPresenter, newTitle: '' });
    render(<TodoView {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'Add' });
    expect(button).toBeDisabled();
  });

  it('enables Add button when input has text', () => {
    vi.mocked(useTodoPresenter).mockReturnValue({ ...mockPresenter, newTitle: 'Something' });
    render(<TodoView {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'Add' });
    expect(button).not.toBeDisabled();
  });
});
