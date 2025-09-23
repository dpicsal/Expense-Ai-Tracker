import { ExpenseCharts } from "@/components/expense-charts";
import { useExpenses } from "@/hooks/use-expenses";

export default function Analytics() {
  const { data: expenses = [], isLoading } = useExpenses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Visualize your spending patterns and trends
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading analytics...
        </div>
      ) : (
        <ExpenseCharts expenses={expenses} />
      )}
    </div>
  );
}