import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Settings as SettingsIcon, Download, FileSpreadsheet, Shield, Bot, Save, Trash, Copy, Check, ChevronDown } from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { useWhatsappBotConfig, useUpdateWhatsappBotConfig, useDeleteWhatsappBotConfig, useWhatsappWebhookUrl } from "@/hooks/use-whatsapp-bot-config";
import { useGeminiConfig, useUpdateGeminiConfig, useDeleteGeminiConfig } from "@/hooks/use-gemini-config";
import { useOpenAIConfig, useUpdateOpenAIConfig, useDeleteOpenAIConfig } from "@/hooks/use-openai-config";
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
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [geminiIsEnabled, setGeminiIsEnabled] = useState(false);
  
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [openaiIsEnabled, setOpenaiIsEnabled] = useState(false);

  // Collapsible state for each section
  const [appPrefsOpen, setAppPrefsOpen] = useState(false);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [geminiOpen, setGeminiOpen] = useState(false);
  const [openaiOpen, setOpenaiOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  
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
  const { data: whatsappWebhookData } = useWhatsappWebhookUrl();
  const updateWhatsappConfig = useUpdateWhatsappBotConfig();
  const deleteWhatsappConfig = useDeleteWhatsappBotConfig();
  
  const { data: geminiConfig, isLoading: isGeminiConfigLoading } = useGeminiConfig();
  const updateGeminiConfig = useUpdateGeminiConfig();
  const deleteGeminiConfig = useDeleteGeminiConfig();
  
  const { data: openaiConfig, isLoading: isOpenAIConfigLoading } = useOpenAIConfig();
  const updateOpenAIConfig = useUpdateOpenAIConfig();
  const deleteOpenAIConfig = useDeleteOpenAIConfig();

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

  useEffect(() => {
    if (geminiConfig) {
      setGeminiApiKey(geminiConfig.apiKey || "");
      setGeminiIsEnabled(geminiConfig.isEnabled || false);
    }
  }, [geminiConfig]);

  useEffect(() => {
    if (openaiConfig) {
      setOpenaiApiKey(openaiConfig.apiKey || "");
      setOpenaiIsEnabled(openaiConfig.isEnabled || false);
    }
  }, [openaiConfig]);

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

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Expenses');

      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Description', key: 'description', width: 30 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Amount (AED)', key: 'amount', width: 15 },
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      expenses.forEach((expense) => {
        worksheet.addRow({
          date: format(toZonedTime(new Date(expense.date), "Asia/Dubai"), "dd/MM/yyyy"),
          description: expense.description,
          category: expense.category,
          amount: parseFloat(expense.amount),
        });
      });

      const amountColumn = worksheet.getColumn('amount');
      amountColumn.numFmt = '#,##0.00';

      worksheet.columns.forEach(column => {
        if (column.header !== 'Description') {
          column.width = Math.max(column.width || 10, 12);
        }
      });

      const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      worksheet.addRow({});
      worksheet.addRow({
        description: 'TOTAL',
        amount: totalAmount
      });

      const totalRow = worksheet.lastRow;
      if (totalRow) {
        totalRow.font = { bold: true };
        totalRow.getCell('amount').numFmt = '#,##0.00';
      }

      const buffer = await workbook.xlsx.writeBuffer();
      
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

  const handleCopyWebhookUrl = async () => {
    if (whatsappWebhookData?.webhookUrl) {
      try {
        await navigator.clipboard.writeText(whatsappWebhookData.webhookUrl);
        setCopiedWebhookUrl(true);
        toast({
          title: "Copied!",
          description: "Webhook URL copied to clipboard",
        });
        setTimeout(() => setCopiedWebhookUrl(false), 2000);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveGeminiConfig = async () => {
    try {
      await updateGeminiConfig.mutateAsync({
        apiKey: geminiApiKey || undefined,
        isEnabled: geminiIsEnabled,
      });
      toast({
        title: "Success",
        description: "Gemini AI configuration saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save Gemini AI configuration",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGeminiConfig = async () => {
    try {
      await deleteGeminiConfig.mutateAsync();
      setGeminiApiKey("");
      setGeminiIsEnabled(false);
      toast({
        title: "Success",
        description: "Gemini AI configuration deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete Gemini AI configuration",
        variant: "destructive",
      });
    }
  };

  const handleSaveOpenAIConfig = async () => {
    try {
      await updateOpenAIConfig.mutateAsync({
        apiKey: openaiApiKey || undefined,
        isEnabled: openaiIsEnabled,
      });
      toast({
        title: "Success",
        description: "OpenAI configuration saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save OpenAI configuration",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOpenAIConfig = async () => {
    try {
      await deleteOpenAIConfig.mutateAsync();
      setOpenaiApiKey("");
      setOpenaiIsEnabled(false);
      toast({
        title: "Success",
        description: "OpenAI configuration deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete OpenAI configuration",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6'} animate-fade-in-up`}>
      {/* Header */}
      <div className="space-y-1">
        <h1 className={`${isMobile ? 'text-2xl' : 'text-2xl md:text-4xl'} font-semibold tracking-tight text-foreground`}>
          Settings
        </h1>
        <p className={`${isMobile ? 'text-sm' : 'text-base md:text-lg'} text-muted-foreground`}>
          Manage your app preferences and integrations
        </p>
      </div>

      {/* App Preferences */}
      <Collapsible open={appPrefsOpen} onOpenChange={setAppPrefsOpen}>
        <Card className="shadow-md hover-elevate">
          <CollapsibleTrigger className="w-full" data-testid="toggle-app-preferences">
            <CardHeader className={isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-green-100 dark:bg-green-900`}>
                    <Shield className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-green-600 dark:text-green-400`} />
                  </div>
                  <div className="text-left">
                    <CardTitle className={`${isMobile ? 'text-base' : 'text-lg md:text-xl'} font-semibold`}>App Preferences</CardTitle>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1`}>
                      {appPrefsOpen ? 'Control app features and permissions' : 'Manage category settings'}
                    </p>
                  </div>
                </div>
                <ChevronDown className={cn("h-5 w-5 transition-transform text-muted-foreground", appPrefsOpen && "rotate-180")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Telegram Bot Configuration */}
      <Collapsible open={telegramOpen} onOpenChange={setTelegramOpen}>
        <Card className="shadow-md hover-elevate">
          <CollapsibleTrigger className="w-full" data-testid="toggle-telegram-config">
            <CardHeader className={isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-purple-100 dark:bg-purple-900`}>
                    <Bot className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-purple-600 dark:text-purple-400`} />
                  </div>
                  <div className="text-left">
                    <CardTitle className={`${isMobile ? 'text-base' : 'text-lg md:text-xl'} font-semibold`}>Telegram Bot</CardTitle>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1`}>
                      {telegramOpen ? 'Configure your Telegram bot settings' : telegramIsEnabled ? (
                        <Badge variant="secondary" className="text-xs">Enabled</Badge>
                      ) : (
                        <span>Not configured</span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronDown className={cn("h-5 w-5 transition-transform text-muted-foreground", telegramOpen && "rotate-180")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
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
                          <AlertDialogTitle>Delete Telegram Configuration</AlertDialogTitle>
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* WhatsApp Bot Configuration */}
      <Collapsible open={whatsappOpen} onOpenChange={setWhatsappOpen}>
        <Card className="shadow-md hover-elevate">
          <CollapsibleTrigger className="w-full" data-testid="toggle-whatsapp-config">
            <CardHeader className={isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-blue-100 dark:bg-blue-900`}>
                    <Bot className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-600 dark:text-blue-400`} />
                  </div>
                  <div className="text-left">
                    <CardTitle className={`${isMobile ? 'text-base' : 'text-lg md:text-xl'} font-semibold`}>WhatsApp Bot</CardTitle>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1`}>
                      {whatsappOpen ? 'Configure your WhatsApp bot settings' : whatsappIsEnabled ? (
                        <Badge variant="secondary" className="text-xs">Enabled</Badge>
                      ) : (
                        <span>Not configured</span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronDown className={cn("h-5 w-5 transition-transform text-muted-foreground", whatsappOpen && "rotate-180")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
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

                  {whatsappWebhookData?.webhookUrl && (
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={whatsappWebhookData.webhookUrl}
                          readOnly
                          className="font-mono text-xs"
                          data-testid="input-whatsapp-webhook-url"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={handleCopyWebhookUrl}
                          data-testid="button-copy-webhook-url"
                        >
                          {copiedWebhookUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Use this URL in your Meta WhatsApp App webhook configuration
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-app-id">App ID</Label>
                    <Input
                      id="whatsapp-app-id"
                      type="text"
                      placeholder="Enter your WhatsApp App ID"
                      value={whatsappAppId}
                      onChange={(e) => setWhatsappAppId(e.target.value)}
                      data-testid="input-whatsapp-app-id"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your WhatsApp Business App ID from Meta Business Manager
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-app-secret">App Secret</Label>
                    <Input
                      id="whatsapp-app-secret"
                      type="password"
                      placeholder="Enter your WhatsApp App Secret"
                      value={whatsappAppSecret}
                      onChange={(e) => setWhatsappAppSecret(e.target.value)}
                      data-testid="input-whatsapp-app-secret"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your WhatsApp Business App Secret from Meta Business Manager
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
                      Custom verify token for webhook verification (set this in Meta webhook config)
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
                          <AlertDialogTitle>Delete WhatsApp Configuration</AlertDialogTitle>
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Gemini AI Configuration */}
      <Collapsible open={geminiOpen} onOpenChange={setGeminiOpen}>
        <Card className="shadow-md hover-elevate">
          <CollapsibleTrigger className="w-full" data-testid="toggle-gemini-config">
            <CardHeader className={isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-orange-100 dark:bg-orange-900`}>
                    <Bot className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-orange-600 dark:text-orange-400`} />
                  </div>
                  <div className="text-left">
                    <CardTitle className={`${isMobile ? 'text-base' : 'text-lg md:text-xl'} font-semibold`}>Gemini AI</CardTitle>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1`}>
                      {geminiOpen ? 'Configure your Gemini AI settings' : geminiIsEnabled ? (
                        <Badge variant="secondary" className="text-xs">Enabled</Badge>
                      ) : (
                        <span>Not configured</span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronDown className={cn("h-5 w-5 transition-transform text-muted-foreground", geminiOpen && "rotate-180")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {isGeminiConfigLoading ? (
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
                      <div className="font-medium text-foreground">Enable Gemini AI</div>
                      <p className="text-sm text-muted-foreground">
                        Use Gemini for intelligent responses and features
                      </p>
                    </div>
                    <Switch
                      checked={geminiIsEnabled}
                      onCheckedChange={setGeminiIsEnabled}
                      data-testid="switch-gemini-enabled"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gemini-api-key">API Key</Label>
                    <Input
                      id="gemini-api-key"
                      type="password"
                      placeholder="Enter your Gemini API key"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      data-testid="input-gemini-api-key"
                    />
                    <p className="text-xs text-muted-foreground">
                      Get your API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveGeminiConfig}
                      disabled={updateGeminiConfig.isPending}
                      data-testid="button-save-gemini-config"
                    >
                      {updateGeminiConfig.isPending ? (
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
                          disabled={deleteGeminiConfig.isPending}
                          data-testid="button-delete-gemini-config"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete Configuration
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Gemini Configuration</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the Gemini AI configuration? 
                            This action cannot be undone and will disable Gemini features.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteGeminiConfig}
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* OpenAI Configuration */}
      <Collapsible open={openaiOpen} onOpenChange={setOpenaiOpen}>
        <Card className="shadow-md hover-elevate">
          <CollapsibleTrigger className="w-full" data-testid="toggle-openai-config">
            <CardHeader className={isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-emerald-100 dark:bg-emerald-900`}>
                    <Bot className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-emerald-600 dark:text-emerald-400`} />
                  </div>
                  <div className="text-left">
                    <CardTitle className={`${isMobile ? 'text-base' : 'text-lg md:text-xl'} font-semibold`}>OpenAI</CardTitle>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1`}>
                      {openaiOpen ? 'Configure your OpenAI settings' : openaiIsEnabled ? (
                        <Badge variant="secondary" className="text-xs">Enabled</Badge>
                      ) : (
                        <span>Not configured</span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronDown className={cn("h-5 w-5 transition-transform text-muted-foreground", openaiOpen && "rotate-180")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {isOpenAIConfigLoading ? (
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
                      <div className="font-medium text-foreground">Enable OpenAI</div>
                      <p className="text-sm text-muted-foreground">
                        Use OpenAI for intelligent responses and features
                      </p>
                    </div>
                    <Switch
                      checked={openaiIsEnabled}
                      onCheckedChange={setOpenaiIsEnabled}
                      data-testid="switch-openai-enabled"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openai-api-key">API Key</Label>
                    <Input
                      id="openai-api-key"
                      type="password"
                      placeholder="Enter your OpenAI API key"
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      data-testid="input-openai-api-key"
                    />
                    <p className="text-xs text-muted-foreground">
                      Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI Platform</a>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveOpenAIConfig}
                      disabled={updateOpenAIConfig.isPending}
                      data-testid="button-save-openai-config"
                    >
                      {updateOpenAIConfig.isPending ? (
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
                          disabled={deleteOpenAIConfig.isPending}
                          data-testid="button-delete-openai-config"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete Configuration
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete OpenAI Configuration</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the OpenAI configuration? 
                            This action cannot be undone and will disable OpenAI features.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteOpenAIConfig}
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Category Management */}
      {settings.allowCategoryManagement && (
        <Collapsible open={categoryOpen} onOpenChange={setCategoryOpen}>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingCategory(null);
          }}>
            <Card className="shadow-md hover-elevate">
              <CollapsibleTrigger className="w-full" data-testid="toggle-category-management">
                <CardHeader className={isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-primary/10`}>
                        <SettingsIcon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
                      </div>
                      <div className="text-left">
                        <CardTitle className={`${isMobile ? 'text-base' : 'text-lg md:text-xl'} font-semibold`}>Category Management</CardTitle>
                        <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1`}>
                          {categoryOpen ? 'Add, edit, or remove expense categories' : `${categories.length} categories`}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={cn("h-5 w-5 transition-transform text-muted-foreground", categoryOpen && "rotate-180")} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
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
                    <>
                      <div className="flex justify-end mb-4">
                        <DialogTrigger asChild>
                          <Button onClick={handleAddCategory} size={isMobile ? "lg" : "default"} className={isMobile ? 'min-h-11' : ''} data-testid="button-add-category">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Category
                          </Button>
                        </DialogTrigger>
                      </div>
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
                    </>
                  )}
                </CardContent>
              </CollapsibleContent>
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
        </Collapsible>
      )}

      {/* Reports & Export */}
      {!isMobile && (
        <Collapsible open={exportOpen} onOpenChange={setExportOpen}>
          <Card className="shadow-md hover-elevate">
            <CollapsibleTrigger className="w-full" data-testid="toggle-export">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-lg md:text-xl font-semibold">Reports & Export</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {exportOpen ? 'Download your expense data in Excel format' : `${expenses.length} expenses available`}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={cn("h-5 w-5 transition-transform text-muted-foreground", exportOpen && "rotate-180")} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
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
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}
