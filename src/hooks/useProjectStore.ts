import { useState, useCallback } from "react";
import type { UploadedFile, FileCategory, GenerationStatus, TSSection } from "@/lib/types";
import { SAMPLE_TS_SECTIONS } from "@/lib/constants";

export function useProjectStore() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [tsSections, setTsSections] = useState<TSSection[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const addFiles = useCallback((newFiles: File[]) => {
    const uploaded: UploadedFile[] = newFiles.map((file) => {
      const isTemplate = /\.(docx|md|pdf)$/i.test(file.name);
      return {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        category: isTemplate ? "Template" as FileCategory : "Main Logic" as FileCategory,
      };
    });

    setFiles((prev) => [...prev, ...uploaded]);

    // Read file contents
    uploaded.forEach((uf) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFiles((prev) =>
          prev.map((f) => (f.id === uf.id ? { ...f, content } : f))
        );
      };
      reader.readAsText(uf.file);
    });

    if (!selectedFileId && uploaded.length > 0) {
      setSelectedFileId(uploaded[0].id);
    }
  }, [selectedFileId]);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedFileId === id) {
      setSelectedFileId(null);
    }
  }, [selectedFileId]);

  const updateCategory = useCallback((id: string, category: FileCategory) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, category } : f))
    );
  }, []);

  const simulateGeneration = useCallback(() => {
    setStatus("analyzing");
    setTimeout(() => {
      setStatus("generating");
      setTimeout(() => {
        setTsSections(SAMPLE_TS_SECTIONS);
        setStatus("done");
      }, 2000);
    }, 1500);
  }, []);

  const selectedFile = files.find((f) => f.id === selectedFileId) || null;

  return {
    files,
    selectedFile,
    selectedFileId,
    setSelectedFileId,
    status,
    tsSections,
    sidebarCollapsed,
    setSidebarCollapsed,
    addFiles,
    removeFile,
    updateCategory,
    simulateGeneration,
  };
}
