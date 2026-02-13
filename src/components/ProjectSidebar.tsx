import { useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Circle,
  FileCode,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SE80Tree } from "@/components/SE80Tree";
import type { UploadedFile, GenerationStatus } from "@/lib/types";
import type { SE80TreeNode } from "@/lib/se80-types";
import { buildSE80Tree } from "@/lib/se80-utils";

interface ProjectSidebarProps {
  files: UploadedFile[];
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  status: GenerationStatus;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onScopeAnalyze?: (node: SE80TreeNode) => void;
}

const STATUS_CONFIG: Record<
  GenerationStatus,
  { label: string; progress: number; color: string }
> = {
  idle: { label: "Ready", progress: 0, color: "text-muted-foreground" },
  analyzing: { label: "Analyzing…", progress: 33, color: "text-primary" },
  generating: { label: "Generating TS…", progress: 66, color: "text-primary" },
  done: {
    label: "Complete",
    progress: 100,
    color: "text-accent-foreground",
  },
};

export function ProjectSidebar({
  files,
  selectedFileId,
  onSelectFile,
  status,
  collapsed,
  onToggleCollapse,
  onScopeAnalyze,
}: ProjectSidebarProps) {
  // Build SE80 tree from files
  const tree = useMemo(() => buildSE80Tree(files), [files]);
  const statusConfig = STATUS_CONFIG[status];

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-4 px-1 border-r bg-card w-12 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 mb-4"
          onClick={onToggleCollapse}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {files.slice(0, 8).map((f) => (
          <button
            key={f.id}
            onClick={() => onSelectFile(f.id)}
            className={`p-1.5 rounded mb-1 transition-colors ${selectedFileId === f.id
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
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
    <div className="flex flex-col border-r bg-card w-64 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Object Navigator
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onToggleCollapse}
        >
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
          <span className={`text-xs font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
        <Progress value={statusConfig.progress} className="h-1" />
      </div>

      {/* SE80 Tree */}
      <ScrollArea className="flex-1">
        {files.length > 0 ? (
          <SE80Tree
            tree={tree}
            selectedFileId={selectedFileId}
            onSelectFile={onSelectFile}
            onScopeAnalyze={onScopeAnalyze}
          />
        ) : (
          <div className="px-3 py-8 text-center">
            <Package className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-xs text-muted-foreground">
              No files uploaded yet
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Upload .abap or .abp files to see the SE80-like structure
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
