import { ExpenseList } from '../expense-list';
import { type Expense } from '@shared/schema';

export default function ExpenseListExample() {
  // todo: remove mock functionality
  const mockExpenses: Expense[] = [
    {
      id: '1',
      amount: '45.50',
      description: 'Lunch at downtown restaurant',
      category: 'Food & Dining',
      date: new Date('2024-01-15'),
    },
    {
      id: '2',
      amount: '85.00',
      description: 'Gas station fill-up',
      category: 'Transportation',
      date: new Date('2024-01-14'),
    },
    {
      id: '3',
      amount: '120.00',
      description: 'Grocery shopping for the week',
      category: 'Shopping',
      date: new Date('2024-01-13'),
    },
  ];

  const handleEdit = (expense: Expense) => {
    console.log('Edit expense:', expense);
  };

  const handleDelete = (id: string) => {
    console.log('Delete expense:', id);
  };

  return (
    <div className="max-w-2xl">
      <ExpenseList 
        expenses={mockExpenses}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}