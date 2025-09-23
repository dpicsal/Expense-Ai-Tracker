import { ExpenseCharts } from '../expense-charts';
import { type Expense } from '@shared/schema';

export default function ExpenseChartsExample() {
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
    {
      id: '4',
      amount: '25.00',
      description: 'Movie tickets',
      category: 'Entertainment',
      date: new Date('2024-02-01'),
    },
    {
      id: '5',
      amount: '150.00',
      description: 'Electric bill',
      category: 'Bills & Utilities',
      date: new Date('2024-02-05'),
    },
  ];

  return (
    <div className="w-full">
      <ExpenseCharts expenses={mockExpenses} />
    </div>
  );
}