import { FileCode, FileText, ChevronLeft, ChevronRight, Loader2, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { UploadedFile, GenerationStatus } from "@/lib/types";
import { FILE_CATEGORIES } from "@/lib/constants";

interface ProjectSidebarProps {
  files: UploadedFile[];
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  status: GenerationStatus;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const STATUS_CONFIG: Record<GenerationStatus, { label: string; progress: number; color: string }> = {
  idle: { label: "Ready", progress: 0, color: "text-muted-foreground" },
  analyzing: { label: "Analyzing…", progress: 33, color: "text-primary" },
  generating: { label: "Generating TS…", progress: 66, color: "text-primary" },
  done: { label: "Complete", progress: 100, color: "text-accent-foreground" },
};

export function ProjectSidebar({
  files,
  selectedFileId,
  onSelectFile,
  status,
  collapsed,
  onToggleCollapse,
}: ProjectSidebarProps) {
  const grouped = FILE_CATEGORIES.reduce((acc, cat) => {
    const catFiles = files.filter((f) => f.category === cat);
    if (catFiles.length > 0) acc[cat] = catFiles;
    return acc;
  }, {} as Record<string, UploadedFile[]>);

  const statusConfig = STATUS_CONFIG[status];

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-4 px-1 border-r bg-card w-12 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 mb-4" onClick={onToggleCollapse}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {files.slice(0, 8).map((f) => (
          <button
            key={f.id}
            onClick={() => onSelectFile(f.id)}
            className={`p-1.5 rounded mb-1 transition-colors ${
              selectedFileId === f.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            title={f.name}
          >
            <FileCode className="h-4 w-4" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col border-r bg-card w-60 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project Files</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleCollapse}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Status */}
      <div className="px-3 py-2 border-b">
        <div className="flex items-center gap-2 mb-1.5">
          {status === "analyzing" || status === "generating" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : status === "done" ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className={`text-xs font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
        </div>
        <Progress value={statusConfig.progress} className="h-1" />
      </div>

      {/* File list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {Object.entries(grouped).map(([category, catFiles]) => (
            <div key={category}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">
                {category}
              </p>
              {catFiles.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onSelectFile(f.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors ${
                    selectedFileId === f.id
                      ? "bg-primary/15 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {/\.abap$/i.test(f.name) ? (
                    <FileCode className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
            </div>
          ))}
          {files.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No files uploaded yet</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
