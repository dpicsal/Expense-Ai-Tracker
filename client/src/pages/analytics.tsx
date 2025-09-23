import { ExpenseCharts } from "@/components/expense-charts";
import { useExpenses } from "@/hooks/use-expenses";

export default function Analytics() {
  const { data: expenses = [], isLoading } = useExpenses();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Analytics
        </h1>
        <p className="text-lg text-muted-foreground">
          Visualize your spending patterns and gain valuable insights
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