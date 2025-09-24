import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useExpenses } from "@/hooks/use-expenses";

const categories = [
  "Food & Dining",
  "Transportation",
  "Shopping", 
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Education",
  "Other"
];

const categoryColors: Record<string, string> = {
  "Food & Dining": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "Transportation": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Shopping": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "Entertainment": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  "Bills & Utilities": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "Healthcare": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Travel": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  "Education": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  "Other": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export default function Categories() {
  const { data: expenses = [], isLoading } = useExpenses();

  const categoryStats = categories.map(category => {
    const categoryExpenses = expenses.filter(e => e.category === category);
    const total = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const count = categoryExpenses.length;
    return { category, total, count };
  });

  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Categories
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage your expense categories and analyze spending patterns
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading categories...
        </div>
      ) : (
        <div className="grid gap-4">
          {categoryStats.map(({ category, total, count }) => {
            const percentage = totalSpent > 0 ? (total / totalSpent) * 100 : 0;
            
            return (
              <Card key={category} className="hover-elevate border-0 shadow-md bg-gradient-to-r from-card to-card/50 transition-all duration-200" data-testid={`category-card-${category}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={categoryColors[category]}
                        data-testid={`category-badge-${category}`}
                      >
                        {category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {count} transaction{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-lg font-semibold tabular-nums" data-testid={`category-total-${category}`}>
                      AED {total.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Percentage of total spending</span>
                      <span className="tabular-nums">{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2"
                      data-testid={`category-progress-${category}`}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {categoryStats.filter(c => c.count === 0).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unused Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categoryStats
                .filter(c => c.count === 0)
                .map(({ category }) => (
                  <Badge 
                    key={category} 
                    variant="outline"
                    className={categoryColors[category]}
                  >
                    {category}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}