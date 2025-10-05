import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs sm:text-sm text-muted-foreground">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-primary font-semibold">
            {formatCurrency(Number(payload[0].value))}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
      <Card data-testid="chart-category-distribution">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl font-semibold">Spending by Category</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">Breakdown of your expenses by category</p>
        </CardHeader>
        <CardContent className="pb-4 sm:pb-6">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="40%"
                  labelLine={false}
                  outerRadius={85}
                  innerRadius={45}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  content={renderLegend}
                  verticalAlign="bottom"
                  height={36}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <p className="text-sm">No data to display</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="chart-monthly-spending">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl font-semibold">Monthly Spending</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">Track your spending trends over time</p>
        </CardHeader>
        <CardContent className="pb-4 sm:pb-6">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  dy={5}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="amount" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-sm">No data to display</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2" data-testid="summary-stats">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl font-semibold">Summary Statistics</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">Key metrics about your spending habits</p>
        </CardHeader>
        <CardContent className="pb-4 sm:pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-4 sm:p-5 rounded-lg border bg-card/50">
              <div className="text-2xl sm:text-3xl font-bold tabular-nums text-primary" data-testid="stat-total-expenses">
                {formatCurrency(totalExpenses)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-2">Total Expenses</div>
            </div>
            <div className="text-center p-4 sm:p-5 rounded-lg border bg-card/50">
              <div className="text-2xl sm:text-3xl font-bold tabular-nums text-primary" data-testid="stat-expense-count">
                {expenses.length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-2">Total Transactions</div>
            </div>
            <div className="text-center p-4 sm:p-5 rounded-lg border bg-card/50">
              <div className="text-2xl sm:text-3xl font-bold tabular-nums text-primary" data-testid="stat-average-expense">
                {expenses.length > 0 ? formatCurrency(totalExpenses / expenses.length) : formatCurrency(0)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-2">Average Expense</div>
            </div>
            <div className="text-center p-4 sm:p-5 rounded-lg border bg-card/50">
              <div className="text-2xl sm:text-3xl font-bold tabular-nums text-primary" data-testid="stat-categories-count">
                {Object.keys(categoryData).length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-2">Categories Used</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
