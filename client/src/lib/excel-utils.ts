import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { type Expense, type Category, type PaymentMethod, type FundHistory } from '@shared/schema';

export interface ExcelExportData {
  expenses: Expense[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  fundHistory: FundHistory[];
}

export async function exportToExcel(data: ExcelExportData, categoryName?: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(categoryName || 'Expense Tracker');

  // Set up columns based on the Excel image format (8 columns total)
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Payment Method', key: 'paymentMethod', width: 15 },
    { header: 'Amount', key: 'amount', width: 12 },
    { header: 'Description', key: 'description', width: 20 },
    { header: 'Total Expenses', key: 'totalExpenses', width: 15 },
    { header: 'Available Fund', key: 'availableFund', width: 15 },
    { header: 'Add Funds', key: 'addFunds', width: 12 },
    { header: 'Total Funds', key: 'totalFunds', width: 15 },
  ];

  // Style the header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4472C4' }
  };

  // Filter expenses by category if specified
  const filteredExpenses = categoryName 
    ? data.expenses.filter(expense => expense.category === categoryName)
    : data.expenses;

  // Get category data
  const category = data.categories.find(cat => cat.name === categoryName);
  const categoryFundHistory = categoryName 
    ? data.fundHistory.filter(fund => {
        const fundCategory = data.categories.find(cat => cat.id === fund.categoryId);
        return fundCategory?.name === categoryName;
      })
    : data.fundHistory;

  // Calculate initial fund total from category allocation and fund history
  let runningExpenseTotal = 0;
  let runningFundTotal = category ? parseFloat(category.allocatedFunds || '0') : 0;
  
  // Add all fund history to the initial fund total for this category
  categoryFundHistory.forEach(fund => {
    runningFundTotal += parseFloat(fund.amount);
  });

  // Create a combined array of expenses and fund additions, sorted by date
  const combinedData: Array<{
    type: 'expense' | 'fund';
    date: Date;
    data: Expense | FundHistory;
  }> = [];

  // Add expenses
  filteredExpenses.forEach(expense => {
    combinedData.push({
      type: 'expense',
      date: new Date(expense.date),
      data: expense
    });
  });

  // Add fund history
  categoryFundHistory.forEach(fund => {
    combinedData.push({
      type: 'fund',
      date: new Date(fund.addedAt),
      data: fund
    });
  });

  // Sort by date
  combinedData.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Reset running fund total to track chronologically
  runningFundTotal = category ? parseFloat(category.allocatedFunds || '0') : 0;
  runningExpenseTotal = 0;

  // Process each row chronologically
  combinedData.forEach((item, index) => {
    const row = worksheet.getRow(index + 2); // +2 because Excel is 1-indexed and we have a header

    if (item.type === 'expense') {
      const expense = item.data as Expense;
      runningExpenseTotal += parseFloat(expense.amount);
      
      row.values = {
        date: new Date(expense.date).toLocaleDateString(),
        paymentMethod: expense.paymentMethod,
        amount: `AED ${parseFloat(expense.amount).toFixed(2)}`,
        description: expense.description,
        totalExpenses: `AED ${runningExpenseTotal.toFixed(2)}`,
        availableFund: `AED ${(runningFundTotal - runningExpenseTotal).toFixed(2)}`,
        addFunds: '',
        totalFunds: `AED ${runningFundTotal.toFixed(2)}`
      };
    } else {
      const fund = item.data as FundHistory;
      runningFundTotal += parseFloat(fund.amount);
      
      row.values = {
        date: new Date(fund.addedAt).toLocaleDateString(),
        paymentMethod: '',
        amount: '',
        description: fund.description || 'Fund Addition',
        totalExpenses: `AED ${runningExpenseTotal.toFixed(2)}`,
        availableFund: `AED ${(runningFundTotal - runningExpenseTotal).toFixed(2)}`,
        addFunds: `AED ${parseFloat(fund.amount).toFixed(2)}`,
        totalFunds: `AED ${runningFundTotal.toFixed(2)}`
      };
    }
  });

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Generate the Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const fileName = categoryName 
    ? `${categoryName}_expenses_${new Date().toISOString().split('T')[0]}.xlsx`
    : `expense_tracker_${new Date().toISOString().split('T')[0]}.xlsx`;
    
  saveAs(blob, fileName);
}

export async function importFromExcel(file: File): Promise<Expense[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
          throw new Error('No worksheet found');
        }
        
        const expenses: Expense[] = [];
        
        // Skip header row, start from row 2
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header
          
          const values = row.values as any[];
          
          // Only process rows with expense data (has date, payment method, amount, description)
          if (values[1] && values[2] && values[3] && values[4]) {
            const expense: Expense = {
              id: '', // Will be generated by the database
              date: new Date(values[1]),
              paymentMethod: values[2] as string,
              amount: values[3].toString().replace('AED ', ''),
              description: values[4] as string,
              category: 'Imported', // Default category, can be changed later
            };
            
            expenses.push(expense);
          }
        });
        
        resolve(expenses);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}