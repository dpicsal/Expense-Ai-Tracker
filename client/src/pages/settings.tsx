import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Settings as SettingsIcon, Download, FileSpreadsheet, Shield, Bot, Save, Trash } from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCategories, useDeleteCategory } from "@/hooks/use-categories";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useExpenses } from "@/hooks/use-expenses";
import { useTelegramBotConfig, useUpdateTelegramBotConfig, useDeleteTelegramBotConfig } from "@/hooks/use-telegram-bot-config";
import { useWhatsappBotConfig, useUpdateWhatsappBotConfig, useDeleteWhatsappBotConfig } from "@/hooks/use-whatsapp-bot-config";
import { useIsMobile } from "@/hooks/use-mobile";
import ExcelJS from "exceljs";
import { CategoryForm } from "@/components/category-form";
import { cn } from "@/lib/utils";
import { type Category } from "@shared/schema";

export default function Settings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramWebhookSecret, setTelegramWebhookSecret] = useState("");
  const [telegramChatWhitelist, setTelegramChatWhitelist] = useState("");
  const [telegramIsEnabled, setTelegramIsEnabled] = useState(false);
  
  const [whatsappAppId, setWhatsappAppId] = useState("");
  const [whatsappAppSecret, setWhatsappAppSecret] = useState("");
  const [whatsappAccessToken, setWhatsappAccessToken] = useState("");
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState("");
  const [whatsappVerifyToken, setWhatsappVerifyToken] = useState("");
  const [whatsappChatWhitelist, setWhatsappChatWhitelist] = useState("");
  const [whatsappIsEnabled, setWhatsappIsEnabled] = useState(false);
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const { data: categories = [], isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();
  const { settings, updateSettings } = useAppSettings();
  const { data: expenses = [] } = useExpenses();
  const { data: telegramConfig, isLoading: isTelegramConfigLoading } = useTelegramBotConfig();
  const updateTelegramConfig = useUpdateTelegramBotConfig();
  const deleteTelegramConfig = useDeleteTelegramBotConfig();
  
  const { data: whatsappConfig, isLoading: isWhatsappConfigLoading } = useWhatsappBotConfig();
  const updateWhatsappConfig = useUpdateWhatsappBotConfig();
  const deleteWhatsappConfig = useDeleteWhatsappBotConfig();

  useEffect(() => {
    if (telegramConfig) {
      setTelegramBotToken(telegramConfig.botToken || "");
      setTelegramWebhookSecret(telegramConfig.webhookSecret || "");
      setTelegramChatWhitelist(telegramConfig.chatWhitelist?.join(", ") || "");
      setTelegramIsEnabled(telegramConfig.isEnabled || false);
    }
  }, [telegramConfig]);

  useEffect(() => {
    if (whatsappConfig) {
      setWhatsappAppId(whatsappConfig.appId || "");
      setWhatsappAppSecret(whatsappConfig.appSecret || "");
      setWhatsappAccessToken(whatsappConfig.accessToken || "");
      setWhatsappPhoneNumberId(whatsappConfig.phoneNumberId || "");
      setWhatsappVerifyToken(whatsappConfig.verifyToken || "");
      setWhatsappChatWhitelist(whatsappConfig.chatWhitelist?.join(", ") || "");
      setWhatsappIsEnabled(whatsappConfig.isEnabled || false);
    }
  }, [whatsappConfig]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleLoadDefaultCategories = async () => {
    try {
      const response = await fetch('/api/categories/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load default categories');
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: `Loaded ${result.seeded} default categories. You can now edit them!`,
      });

      // The categories list will automatically refresh due to React Query
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load default categories",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryToDelete: Category) => {
    try {
      await deleteCategory.mutateAsync(categoryToDelete.id);
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
    } catch (error) {
      // Parse server error message
      const errorMessage = error instanceof Error ? error.message : "Failed to delete category";
      const serverMessage = errorMessage.includes(":") ? errorMessage.split(":").slice(1).join(":").trim() : errorMessage;
      
      toast({
        title: "Error",
        description: serverMessage,
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
    }
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setDeletingCategory(null);
    }
  };


  const handleExportExpenses = async () => {
    try {
      if (expenses.length === 0) {
        toast({
          title: "No Data",
          description: "No expenses found to export.",
          variant: "destructive",
        });
        return;
      }

      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Expenses');

      // Define columns
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Description', key: 'description', width: 30 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Amount (AED)', key: 'amount', width: 15 },
      ];

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add data rows
      expenses.forEach((expense) => {
        worksheet.addRow({
          date: format(toZonedTime(new Date(expense.date), "Asia/Dubai"), "dd/MM/yyyy"),
          description: expense.description,
          category: expense.category,
          amount: parseFloat(expense.amount),
        });
      });

      // Format amount column as currency
      const amountColumn = worksheet.getColumn('amount');
      amountColumn.numFmt = '#,##0.00';

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        if (column.header !== 'Description') {
          column.width = Math.max(column.width || 10, 12);
        }
      });

      // Add summary at the bottom
      const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      worksheet.addRow({});
      worksheet.addRow({
        description: 'TOTAL',
        amount: totalAmount
      });

      // Style the total row
      const totalRow = worksheet.lastRow;
      if (totalRow) {
        totalRow.font = { bold: true };
        totalRow.getCell('amount').numFmt = '#,##0.00';
      }

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Create and trigger download
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expenses-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Exported ${expenses.length} expenses to Excel file.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export expenses. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveTelegramConfig = async () => {
    try {
      await updateTelegramConfig.mutateAsync({
        botToken: telegramBotToken || undefined,
        webhookSecret: telegramWebhookSecret || undefined,
        chatWhitelist: telegramChatWhitelist ? telegramChatWhitelist.split(',').map(id => id.trim()).filter(Boolean) : [],
        isEnabled: telegramIsEnabled,
      });
      toast({
        title: "Success",
        description: "Telegram bot configuration saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save Telegram bot configuration",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTelegramConfig = async () => {
    try {
      await deleteTelegramConfig.mutateAsync();
      setTelegramBotToken("");
      setTelegramWebhookSecret("");
      setTelegramChatWhitelist("");
      setTelegramIsEnabled(false);
      toast({
        title: "Success",
        description: "Telegram bot configuration deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete Telegram bot configuration",
        variant: "destructive",
      });
    }
  };

  const handleSaveWhatsappConfig = async () => {
    try {
      await updateWhatsappConfig.mutateAsync({
        appId: whatsappAppId || undefined,
        appSecret: whatsappAppSecret || undefined,
        accessToken: whatsappAccessToken || undefined,
        phoneNumberId: whatsappPhoneNumberId || undefined,
        verifyToken: whatsappVerifyToken || undefined,
        chatWhitelist: whatsappChatWhitelist ? whatsappChatWhitelist.split(',').map(num => num.trim()).filter(Boolean) : [],
        isEnabled: whatsappIsEnabled,
      });
      toast({
        title: "Success",
        description: "WhatsApp bot configuration saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save WhatsApp bot configuration",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWhatsappConfig = async () => {
    try {
      await deleteWhatsappConfig.mutateAsync();
      setWhatsappAppId("");
      setWhatsappAppSecret("");
      setWhatsappAccessToken("");
      setWhatsappPhoneNumberId("");
      setWhatsappVerifyToken("");
      setWhatsappChatWhitelist("");
      setWhatsappIsEnabled(false);
      toast({
        title: "Success",
        description: "WhatsApp bot configuration deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete WhatsApp bot configuration",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`${isMobile ? 'space-y-6' : 'space-y-8'} animate-fade-in-up`}>
      {/* Header */}
      <div className="space-y-1">
        <h1 className={`${isMobile ? 'text-2xl' : 'text-2xl md:text-4xl'} font-semibold tracking-tight text-foreground`}>
          Settings
        </h1>
        <p className={`${isMobile ? 'text-sm' : 'text-base md:text-lg'} text-muted-foreground`}>
          Manage your categories and export your data
        </p>
      </div>

      {/* App Preferences */}
      <Card className="shadow-md">
        <CardHeader className={isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}>
          <div className="flex items-center gap-3">
            <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-green-100 dark:bg-green-900`}>
              <Shield className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-green-600 dark:text-green-400`} />
            </div>
            <div>
              <CardTitle className={`${isMobile ? 'text-base' : 'text-lg md:text-xl'} font-semibold`}>App Preferences</CardTitle>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1`}>Control app features and permissions</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-card/50">
              <div className="space-y-1">
                <div className="font-medium text-foreground">Category Management</div>
                <p className="text-sm text-muted-foreground">
                  Allow adding, editing, and deleting expense categories
                </p>
              </div>
              <Switch
                checked={settings.allowCategoryManagement}
                onCheckedChange={(checked) => {
                  updateSettings({ allowCategoryManagement: checked });
                  toast({
                    title: checked ? "Category Management Enabled" : "Category Management Disabled",
                    description: checked 
                      ? "You can now add, edit, and delete categories" 
                      : "Category management has been disabled",
                  });
                }}
                data-testid="switch-category-management"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Telegram Bot Configuration */}
      <Card className="shadow-md">
        <CardHeader className={isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}>
          <div className="flex items-center gap-3">
            <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-purple-100 dark:bg-purple-900`}>
              <Bot className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-purple-600 dark:text-purple-400`} />
            </div>
            <div>
              <CardTitle className={`${isMobile ? 'text-base' : 'text-lg md:text-xl'} font-semibold`}>Telegram Bot Configuration</CardTitle>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1`}>Configure your Telegram bot settings</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isTelegramConfigLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-ios-spinner"></div>
                <div className="animate-pulse-glow">Loading configuration...</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-card/50">
                <div className="space-y-1">
                  <div className="font-medium text-foreground">Enable Bot</div>
                  <p className="text-sm text-muted-foreground">
                    Activate the Telegram bot integration
                  </p>
                </div>
                <Switch
                  checked={telegramIsEnabled}
                  onCheckedChange={setTelegramIsEnabled}
                  data-testid="switch-telegram-enabled"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bot-token">Bot Token</Label>
                <Input
                  id="bot-token"
                  type="password"
                  placeholder="Enter your Telegram bot token"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  data-testid="input-bot-token"
                />
                <p className="text-xs text-muted-foreground">
                  Get your bot token from @BotFather on Telegram
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Webhook Secret</Label>
                <Input
                  id="webhook-secret"
                  type="password"
                  placeholder="Enter webhook secret (optional)"
                  value={telegramWebhookSecret}
                  onChange={(e) => setTelegramWebhookSecret(e.target.value)}
                  data-testid="input-webhook-secret"
                />
                <p className="text-xs text-muted-foreground">
                  Optional secret token for webhook validation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chat-whitelist">Chat Whitelist</Label>
                <Input
                  id="chat-whitelist"
                  type="text"
                  placeholder="Enter allowed chat IDs (comma-separated)"
                  value={telegramChatWhitelist}
                  onChange={(e) => setTelegramChatWhitelist(e.target.value)}
                  data-testid="input-chat-whitelist"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of allowed chat IDs (e.g., 123456789, 987654321)
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSaveTelegramConfig}
                  disabled={updateTelegramConfig.isPending}
                  data-testid="button-save-telegram-config"
                >
                  {updateTelegramConfig.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={deleteTelegramConfig.isPending}
                      data-testid="button-delete-telegram-config"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete Configuration
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Telegram Bot Configuration</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the Telegram bot configuration? 
                        This action cannot be undone and will disable the bot.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteTelegramConfig}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* WhatsApp Bot Configuration */}
      <Card className="shadow-md">
        <CardHeader className={isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}>
          <div className="flex items-center gap-3">
            <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-green-100 dark:bg-green-900`}>
              <Bot className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-green-600 dark:text-green-400`} />
            </div>
            <div>
              <CardTitle className={`${isMobile ? 'text-base' : 'text-lg md:text-xl'} font-semibold`}>WhatsApp Bot Configuration</CardTitle>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1`}>Configure your WhatsApp bot settings</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isWhatsappConfigLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-ios-spinner"></div>
                <div className="animate-pulse-glow">Loading configuration...</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-card/50">
                <div className="space-y-1">
                  <div className="font-medium text-foreground">Enable Bot</div>
                  <p className="text-sm text-muted-foreground">
                    Activate the WhatsApp bot integration
                  </p>
                </div>
                <Switch
                  checked={whatsappIsEnabled}
                  onCheckedChange={setWhatsappIsEnabled}
                  data-testid="switch-whatsapp-enabled"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp-app-id">App ID</Label>
                <Input
                  id="whatsapp-app-id"
                  type="text"
                  placeholder="Enter your Meta App ID"
                  value={whatsappAppId}
                  onChange={(e) => setWhatsappAppId(e.target.value)}
                  data-testid="input-whatsapp-app-id"
                />
                <p className="text-xs text-muted-foreground">
                  Your Meta/Facebook App ID from the Developer Portal
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp-app-secret">App Secret</Label>
                <Input
                  id="whatsapp-app-secret"
                  type="password"
                  placeholder="Enter your Meta App Secret"
                  value={whatsappAppSecret}
                  onChange={(e) => setWhatsappAppSecret(e.target.value)}
                  data-testid="input-whatsapp-app-secret"
                />
                <p className="text-xs text-muted-foreground">
                  Your Meta/Facebook App Secret for webhook signature verification
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp-access-token">Access Token</Label>
                <Input
                  id="whatsapp-access-token"
                  type="password"
                  placeholder="Enter your WhatsApp Access Token"
                  value={whatsappAccessToken}
                  onChange={(e) => setWhatsappAccessToken(e.target.value)}
                  data-testid="input-whatsapp-access-token"
                />
                <p className="text-xs text-muted-foreground">
                  Your WhatsApp API access token from Meta Business Manager
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp-phone-number-id">Phone Number ID</Label>
                <Input
                  id="whatsapp-phone-number-id"
                  type="text"
                  placeholder="Enter your WhatsApp Phone Number ID"
                  value={whatsappPhoneNumberId}
                  onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
                  data-testid="input-whatsapp-phone-number-id"
                />
                <p className="text-xs text-muted-foreground">
                  Your WhatsApp Business Phone Number ID from the API Setup
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp-verify-token">Verify Token</Label>
                <Input
                  id="whatsapp-verify-token"
                  type="text"
                  placeholder="Enter webhook verify token"
                  value={whatsappVerifyToken}
                  onChange={(e) => setWhatsappVerifyToken(e.target.value)}
                  data-testid="input-whatsapp-verify-token"
                />
                <p className="text-xs text-muted-foreground">
                  Custom token for webhook verification (you create this)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp-chat-whitelist">Phone Whitelist</Label>
                <Input
                  id="whatsapp-chat-whitelist"
                  type="text"
                  placeholder="Enter allowed phone numbers (comma-separated)"
                  value={whatsappChatWhitelist}
                  onChange={(e) => setWhatsappChatWhitelist(e.target.value)}
                  data-testid="input-whatsapp-chat-whitelist"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of allowed phone numbers (e.g., 971501234567, 971509876543)
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSaveWhatsappConfig}
                  disabled={updateWhatsappConfig.isPending}
                  data-testid="button-save-whatsapp-config"
                >
                  {updateWhatsappConfig.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={deleteWhatsappConfig.isPending}
                      data-testid="button-delete-whatsapp-config"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete Configuration
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete WhatsApp Bot Configuration</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the WhatsApp bot configuration? 
                        This action cannot be undone and will disable the bot.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteWhatsappConfig}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Category Management */}
      {settings.allowCategoryManagement && (
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingCategory(null);
        }}>
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-primary/10`}>
                    <SettingsIcon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
                  </div>
                  <div>
                    <CardTitle className={`${isMobile ? 'text-base' : 'text-lg md:text-xl'} font-semibold`}>Category Management</CardTitle>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1`}>Add, edit, or remove expense categories</p>
                  </div>
                </div>
                {categories.length > 0 && (
                  <DialogTrigger asChild>
                    <Button onClick={handleAddCategory} size={isMobile ? "lg" : "default"} className={isMobile ? 'min-h-11' : ''} data-testid="button-add-category">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                )}
              </div>
            </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-ios-spinner"></div>
                <div className="animate-pulse-glow">Loading categories...</div>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8" data-testid="text-no-categories">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <SettingsIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium mb-2`}>No categories found</h3>
              <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground mb-4`}>Load the default categories to get started editing them</p>
              <div className={isMobile ? 'space-y-2 flex flex-col' : 'space-y-3'}>
                <Button onClick={handleLoadDefaultCategories} size={isMobile ? "lg" : "default"} className={isMobile ? 'min-h-11' : 'mr-3'} data-testid="button-load-default-categories">
                  Load Default Categories
                </Button>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={handleAddCategory} size={isMobile ? "lg" : "default"} className={isMobile ? 'min-h-11' : ''} data-testid="button-add-category-empty">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Category
                  </Button>
                </DialogTrigger>
              </div>
            </div>
          ) : (
            <div className="grid gap-3" data-testid="category-list">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-card/50 hover:bg-card/80 transition-colors"
                  data-testid={`category-item-${category.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const IconComponent = Icons[category.icon as keyof typeof Icons] as React.ComponentType<any>;
                        return IconComponent ? (
                          <div className="p-1.5 rounded-md bg-muted/50">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ) : null;
                      })()}
                      <Badge className={cn(category.color)} data-testid={`category-badge-${category.id}`}>
                        {category.name}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1">
                      {category.allocatedFunds && parseFloat(category.allocatedFunds) > 0 && (
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                          Available Fund: AED {parseFloat(category.allocatedFunds).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditCategory(category)}
                      data-testid={`button-edit-category-${category.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog 
                      open={deleteDialogOpen && deletingCategory?.id === category.id}
                      onOpenChange={handleDeleteDialogOpenChange}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setDeletingCategory(category);
                            setDeleteDialogOpen(true);
                          }}
                          data-testid={`button-delete-category-${category.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Category</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the "{category.name}" category? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCategory(category)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
          </Card>
          <DialogContent className={isMobile ? 'w-[95vw] max-w-md' : 'sm:max-w-md'}>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? 'Modify the category details below. Changes will affect existing expenses in this category.'
                  : 'Create a new category to organize your expenses with custom colors and budget settings.'}
              </DialogDescription>
            </DialogHeader>
            <CategoryForm 
              onClose={() => setIsDialogOpen(false)}
              initialData={editingCategory || undefined}
              isEditing={!!editingCategory}
            />
          </DialogContent>
        </Dialog>
      )}

      {!isMobile && (
        <Card className="shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl font-semibold">Reports & Export</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Download your expense data in Excel format</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-gradient-to-r from-blue-50/50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/50">
                <div>
                  <h3 className="font-medium text-foreground">Export All Expenses</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Download all your expenses in an Excel spreadsheet with categories and date ranges
                  </p>
                </div>
                <Button 
                  onClick={handleExportExpenses}
                  data-testid="button-export-expenses"
                  className="shrink-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
          
              <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
                <strong>Note:</strong> The exported Excel file will include all your expense data with proper AED formatting, 
                category breakdowns, and monthly summaries for easy analysis.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}