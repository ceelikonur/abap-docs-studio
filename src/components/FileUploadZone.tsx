import { useCallback, useState } from "react";
import { Upload, FileCode, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UploadedFile, FileCategory } from "@/lib/types";
import { FILE_CATEGORIES } from "@/lib/constants";

interface FileUploadZoneProps {
  files: UploadedFile[];
  onFilesAdded: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  onUpdateCategory: (id: string, category: FileCategory) => void;
}

export function FileUploadZone({ files, onFilesAdded, onRemoveFile, onUpdateCategory }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length) onFilesAdded(droppedFiles);
    },
    [onFilesAdded]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length) onFilesAdded(selected);
      e.target.value = "";
    },
    [onFilesAdded]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (name: string) => {
    if (/\.abap$/i.test(name)) return <FileCode className="h-4 w-4 text-primary" />;
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5 shadow-sap"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept=".abap,.txt,.docx,.md,.pdf"
          onChange={handleFileInput}
          className="hidden"
        />
        <Upload className={`mx-auto h-10 w-10 mb-3 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
        <p className="text-sm font-medium">
          Drop <span className="text-primary">.abap</span> files & templates here
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports .abap, .docx, .md, .pdf — or click to browse
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-md border bg-card p-3 group"
            >
              {getFileIcon(f.name)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(f.size)}</p>
              </div>
              <Select
                value={f.category}
                onValueChange={(v) => onUpdateCategory(f.id, v as FileCategory)}
              >
                <SelectTrigger className="w-[130px] h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                onClick={() => onRemoveFile(f.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
