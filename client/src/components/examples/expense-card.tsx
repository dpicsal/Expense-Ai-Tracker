import { ExpenseCard } from '../expense-card';
import { type Expense } from '@shared/schema';

export default function ExpenseCardExample() {
  // todo: remove mock functionality
  const mockExpense: Expense = {
    id: '1',
    amount: '45.50',
    description: 'Lunch at downtown restaurant',
    category: 'Food & Dining',
    date: new Date('2024-01-15'),
  };

  const handleEdit = (expense: Expense) => {
    console.log('Edit expense:', expense);
  };

  const handleDelete = (id: string) => {
    console.log('Delete expense:', id);
  };

  return (
    <div className="max-w-sm">
      <ExpenseCard 
        expense={mockExpense}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}