import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Github, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface GitHubImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GitHubImportModal({ isOpen, onClose, onSuccess }: GitHubImportModalProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [autoSetup, setAutoSetup] = useState(true);
  const [createPipeline, setCreatePipeline] = useState(true);

  const importRepoMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/github/import", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onSuccess();
      onClose();
      resetForm();
    }
  });

  const resetForm = () => {
    setRepoUrl("");
    setProjectName("");
    setDescription("");
    setAutoSetup(true);
    setCreatePipeline(true);
  };

  const handleImport = () => {
    if (!repoUrl.trim() || !projectName.trim()) return;
    
    importRepoMutation.mutate({
      repoUrl,
      projectName,
      description,
      autoSetup,
      createPipeline
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Importa Repository GitHub
          </DialogTitle>
          <DialogDescription>
            Importa un repository GitHub esistente e configuralo automaticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repoUrl">URL Repository GitHub</Label>
            <Input
              id="repoUrl"
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectName">Nome Progetto</Label>
            <Input
              id="projectName"
              placeholder="Nome del progetto"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              placeholder="Descrizione del progetto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoSetup"
                checked={autoSetup}
                onCheckedChange={(checked) => setAutoSetup(checked as boolean)}
              />
              <Label htmlFor="autoSetup">Configura automaticamente ambiente di sviluppo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="createPipeline"
                checked={createPipeline}
                onCheckedChange={(checked) => setCreatePipeline(checked as boolean)}
              />
              <Label htmlFor="createPipeline">Crea pipeline CI/CD automaticamente</Label>
            </div>
          </div>
        </div>

        {importRepoMutation.error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Errore nell'importazione</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              {importRepoMutation.error.message}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!repoUrl.trim() || !projectName.trim() || importRepoMutation.isPending}
          >
            {importRepoMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Github className="w-4 h-4 mr-2" />
            )}
            Importa Progetto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}