import { useState } from "react";
import { Download, Upload, AlertTriangle, CheckCircle2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function BackupRestorePage() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const response = await fetch("/api/backup");
      if (!response.ok) throw new Error("Backup failed");
      
      const backup = await response.json();
      const dataStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup successful",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Backup failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowRestoreDialog(true);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) return;

    setIsRestoring(true);
    setShowRestoreDialog(false);

    try {
      const fileContent = await selectedFile.text();
      const backup = JSON.parse(fileContent);

      await apiRequest("POST", "/api/restore", backup);

      toast({
        title: "Restore successful",
        description: "Your data has been restored successfully.",
      });

      // Reload the page to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast({
        title: "Restore failed",
        description: error instanceof Error ? error.message : "Failed to restore backup. Please check the file and try again.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-backup-restore-title">
            Backup & Restore
          </h1>
          <p className="text-muted-foreground mt-2">
            Create backups of your data or restore from a previous backup
          </p>
        </div>

        {/* Warning Alert */}
        <Alert className="border-orange-500/50 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-sm">
            <strong>Important:</strong> Restoring from a backup will replace all your current data. 
            Make sure to create a backup of your current data before restoring.
          </AlertDescription>
        </Alert>

        {/* Backup Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Create Backup</CardTitle>
                <CardDescription>
                  Download all your data as a JSON file
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your backup will include:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
              <li>All expenses and transactions</li>
              <li>Categories and their allocated funds</li>
              <li>Payment methods and balances</li>
              <li>All fund history records</li>
            </ul>
            <Button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="w-full sm:w-auto"
              data-testid="button-create-backup"
            >
              {isBackingUp ? (
                <>
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-ios-spinner mr-2"></div>
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Restore Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Restore from Backup</CardTitle>
                <CardDescription>
                  Upload a backup file to restore your data
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-sm">
                This will permanently delete all your current data and replace it with the backup data.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                id="backup-file-input"
                data-testid="input-restore-file"
              />
              <label htmlFor="backup-file-input">
                <Button
                  asChild
                  variant="outline"
                  disabled={isRestoring}
                  data-testid="button-select-backup-file"
                >
                  <span className="cursor-pointer">
                    <Database className="w-4 h-4 mr-2" />
                    Select Backup File
                  </span>
                </Button>
              </label>
              {selectedFile && (
                <span className="text-sm text-muted-foreground flex items-center">
                  Selected: {selectedFile.name}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all your current data
              and restore it from the backup file "{selectedFile?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-restore">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-restore"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Restore Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
