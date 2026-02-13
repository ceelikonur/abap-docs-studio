import { useCallback, useState, useRef } from "react";
import { Upload, FileCode, FileText, X, Archive } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (name: string) => {
    if (/\.zip$/i.test(name)) {
      return <Archive className="h-4 w-4 text-orange-500" />;
    }
    if (/\.(xml)$/i.test(name)) {
      return <FileCode className="h-4 w-4 text-yellow-500" />;
    }
    // Treat any ABAP-like file as code (including files without standard extensions)
    if (/\.(abap|abp|txt)$/i.test(name) || isAbapFileName(name)) {
      return <FileCode className="h-4 w-4 text-primary" />;
    }
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-all cursor-pointer ${isDragging
          ? "border-primary bg-primary/5 shadow-sap"
          : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        onClick={handleZoneClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          accept=".abap,.abp,.txt,.md,.docx,.doc,.pdf,.zip,.xml"
        />
        <Upload className={`mx-auto h-10 w-10 mb-3 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
        <p className="text-sm font-medium">
          Drop your <span className="text-primary">abapGit ZIP</span>, source files & templates here
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports <strong>.zip</strong> (abapGit export), .abap, .xml, .docx, .md files
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

/** Check if a filename matches ABAP naming patterns (even without extension) */
function isAbapFileName(name: string): boolean {
  const base = name.replace(/\.[^.]+$/, "").toUpperCase();
  return (
    /^SAPL/.test(base) ||
    /^L.+(TOP|UXX|FXX|U\d{2,3}|F\d{2,3}|I\d{2,3}|O\d{2,3})$/.test(base) ||
    /^SAPM/.test(base) ||
    /^[ZY]/.test(base) ||
    /^[ZY]CL_/.test(base) ||
    /^[ZY]IF_/.test(base) ||
    /_(TOP|PBO|PAI|F\d{2,3}|I\d{2,3}|O\d{2,3})$/.test(base)
  );
}
