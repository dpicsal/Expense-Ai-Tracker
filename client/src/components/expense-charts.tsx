import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Expense } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface ExpenseChartsProps {
  expenses: Expense[];
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function ExpenseCharts({ expenses }: ExpenseChartsProps) {
  // Group expenses by category
  const categoryData = expenses.reduce((acc, expense) => {
    const category = expense.category;
    const amount = parseFloat(expense.amount);
    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryData).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  // Group expenses by month for bar chart
  const monthlyData = expenses.reduce((acc, expense) => {
    const date = new Date(expense.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const amount = parseFloat(expense.amount);
    acc[monthKey] = (acc[monthKey] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({
      month: format(toZonedTime(new Date(month + '-01'), "Asia/Dubai"), "MMM yy"),
      amount,
    }));

  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
      {/* Category Distribution */}
      <Card className="shadow-ios-sm bg-card/95 backdrop-blur-md" data-testid="chart-category-distribution">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl font-semibold">Spending by Category</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">Breakdown of your expenses by category</p>
        </CardHeader>
        <CardContent className="pb-4 sm:pb-6">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={75}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Amount']} 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: 'none',
                    borderRadius: '1rem',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                  <PieChart className="h-6 w-6" />
                </div>
                <p className="text-sm">No data to display</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Spending */}
      <Card className="shadow-ios-sm bg-card/95 backdrop-blur-md" data-testid="chart-monthly-spending">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl font-semibold">Monthly Spending</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">Track your spending trends over time</p>
        </CardHeader>
        <CardContent className="pb-4 sm:pb-6">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Amount']} 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: 'none',
                    borderRadius: '1rem',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="hsl(var(--primary))" 
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                  <BarChart className="h-6 w-6" />
                </div>
                <p className="text-sm">No data to display</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card className="md:col-span-2 shadow-ios-sm bg-gradient-to-br from-primary/8 to-primary/12 backdrop-blur-md" data-testid="summary-stats">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl font-semibold">Summary Statistics</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">Key metrics about your spending habits</p>
        </CardHeader>
        <CardContent className="pb-4 sm:pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 rounded-xl bg-card/60 backdrop-blur-sm">
              <div className="text-lg sm:text-2xl font-bold tabular-nums text-primary" data-testid="stat-total-expenses">
                {formatCurrency(totalExpenses)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Expenses</div>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-xl bg-card/60 backdrop-blur-sm">
              <div className="text-lg sm:text-2xl font-bold tabular-nums text-primary" data-testid="stat-expense-count">
                {expenses.length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Transactions</div>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-xl bg-card/60 backdrop-blur-sm">
              <div className="text-lg sm:text-2xl font-bold tabular-nums text-primary" data-testid="stat-average-expense">
                {expenses.length > 0 ? formatCurrency(totalExpenses / expenses.length) : formatCurrency(0)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Average Expense</div>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-xl bg-card/60 backdrop-blur-sm">
              <div className="text-lg sm:text-2xl font-bold tabular-nums text-primary" data-testid="stat-categories-count">
                {Object.keys(categoryData).length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Categories Used</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}