import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Expense } from "@shared/schema";

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
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      amount,
    }));

  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Category Distribution */}
      <Card className="border-0 shadow-md" data-testid="chart-category-distribution">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Spending by Category</CardTitle>
          <p className="text-sm text-muted-foreground">Breakdown of your expenses by category</p>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data to display
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Spending */}
      <Card className="border-0 shadow-md" data-testid="chart-monthly-spending">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Monthly Spending</CardTitle>
          <p className="text-sm text-muted-foreground">Track your spending trends over time</p>
        </CardHeader>
        <CardContent>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data to display
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card className="md:col-span-2 border-0 shadow-md bg-gradient-to-br from-primary/5 to-primary/10" data-testid="summary-stats">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Summary Statistics</CardTitle>
          <p className="text-sm text-muted-foreground">Key metrics about your spending habits</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold tabular-nums" data-testid="stat-total-expenses">
                ${totalExpenses.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Expenses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold tabular-nums" data-testid="stat-expense-count">
                {expenses.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold tabular-nums" data-testid="stat-average-expense">
                ${expenses.length > 0 ? (totalExpenses / expenses.length).toFixed(2) : '0.00'}
              </div>
              <div className="text-sm text-muted-foreground">Average Expense</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold tabular-nums" data-testid="stat-categories-count">
                {Object.keys(categoryData).length}
              </div>
              <div className="text-sm text-muted-foreground">Categories Used</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}