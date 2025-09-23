import { ExpenseForm } from '../expense-form';
import { type InsertExpense } from '@shared/schema';

export default function ExpenseFormExample() {
  const handleSubmit = (expense: InsertExpense) => {
    console.log('Expense submitted:', expense);
    // todo: remove mock functionality
  };

  return (
    <div className="max-w-md">
      <ExpenseForm onSubmit={handleSubmit} />
    </div>
  );
}