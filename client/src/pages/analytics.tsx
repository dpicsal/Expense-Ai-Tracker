import { ExpenseCharts } from "@/components/expense-charts";
import { useExpenses } from "@/hooks/use-expenses";

export default function Analytics() {
  const { data: expenses = [], isLoading } = useExpenses();

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="text-base sm:text-lg font-normal text-muted-foreground">
          Visualize your spending patterns and gain valuable insights
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-ios-spinner"></div>
            <div className="animate-pulse-glow">Loading analytics...</div>
          </div>
        </div>
      ) : (
        <ExpenseCharts expenses={expenses} />
      )}
    </div>
  );
}