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
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";

export default function BackupRestorePage() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
    <div className={`${isMobile ? 'max-w-full' : 'container mx-auto max-w-4xl'}`}>
      <div className={isMobile ? 'space-y-5' : 'space-y-6'}>
        {/* Header */}
        <div>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-semibold tracking-tight text-foreground`} data-testid="text-backup-restore-title">
            Backup & Restore
          </h1>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground mt-1`}>
            Create backups of your data or restore from a previous backup
          </p>
        </div>

        {/* Warning Alert */}
        <Alert className={`border-orange-500/50 bg-orange-500/10 ${isMobile ? 'p-3' : ''}`}>
          <AlertTriangle className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-orange-500`} />
          <AlertDescription className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
            <strong>Important:</strong> Restoring from a backup will replace all your current data. 
            Make sure to create a backup of your current data before restoring.
          </AlertDescription>
        </Alert>

        {/* Backup Section */}
        <Card>
          <CardHeader className={isMobile ? 'p-4 pb-3' : ''}>
            <div className="flex items-center gap-3">
              <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-primary/10`}>
                <Download className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
              </div>
              <div>
                <CardTitle className={isMobile ? 'text-base' : ''}>Create Backup</CardTitle>
                <CardDescription className={isMobile ? 'text-xs' : ''}>
                  Download all your data as a JSON file
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className={`space-y-4 ${isMobile ? 'p-4 pt-0' : ''}`}>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
              Your backup will include:
            </p>
            <ul className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground space-y-2 ml-6 list-disc`}>
              <li>All expenses and transactions</li>
              <li>Categories and their allocated funds</li>
              <li>Payment methods and balances</li>
              <li>All fund history records</li>
            </ul>
            <Button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="w-full"
              size={isMobile ? "default" : "default"}
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
          <CardHeader className={isMobile ? 'p-4 pb-3' : ''}>
            <div className="flex items-center gap-3">
              <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-primary/10`}>
                <Upload className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
              </div>
              <div>
                <CardTitle className={isMobile ? 'text-base' : ''}>Restore from Backup</CardTitle>
                <CardDescription className={isMobile ? 'text-xs' : ''}>
                  Upload a backup file to restore your data
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className={`space-y-4 ${isMobile ? 'p-4 pt-0' : ''}`}>
            <Alert className={`border-destructive/50 bg-destructive/10 ${isMobile ? 'p-3' : ''}`}>
              <AlertTriangle className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-destructive`} />
              <AlertDescription className={isMobile ? 'text-xs' : 'text-sm'}>
                This will permanently delete all your current data and replace it with the backup data.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-3">
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                id="backup-file-input"
                data-testid="input-restore-file"
              />
              <label htmlFor="backup-file-input" className="w-full">
                <Button
                  asChild
                  variant="outline"
                  disabled={isRestoring}
                  size={isMobile ? "default" : "default"}
                  className="w-full"
                  data-testid="button-select-backup-file"
                >
                  <span className="cursor-pointer">
                    <Database className="w-4 h-4 mr-2" />
                    Select Backup File
                  </span>
                </Button>
              </label>
              {selectedFile && (
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground flex items-center break-all`}>
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
