import { useState, useCallback, useMemo } from "react";
import type { UploadedFile, FileCategory, GenerationStatus } from "@/lib/types";
import { loadAIConfig } from "@/lib/ai-config";
import { analyzeWithAI } from "@/lib/ai-service";
import { isDocxFile, parseDocxToMarkdown } from "@/lib/docx-parser";
import { isZipFile, parseAbapGitZip, buildMetadataContext } from "@/lib/zip-parser";
import type { ZipParseResult } from "@/lib/zip-parser";

export function useProjectStore() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [tsMarkdown, setTsMarkdown] = useState<string>("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisScope, setAnalysisScope] = useState<string | null>(null);

  // abapGit ZIP data
  const [zipResult, setZipResult] = useState<ZipParseResult | null>(null);
  const [zipFileName, setZipFileName] = useState<string>("");

  // Project properties for template filling
  const [projectMetadata, setProjectMetadata] = useState<{
    title: string;
    id: string;
    author: string;
    description: string;
  }>({
    title: "EWM_001 Custom Process",
    id: "EWM_001",
    author: "User",
    description: "Custom EWM Development",
  });

  // Template files (docx, md, pdf)
  const templateFiles = useMemo(
    () => files.filter((f) => f.category === "Template"),
    [files]
  );

  // Source files (everything except templates)
  const sourceFiles = useMemo(
    () => files.filter((f) => f.category !== "Template"),
    [files]
  );

  // ─── Handle ZIP Upload ──────────────────────────────────────────────

  const handleZipUpload = useCallback(async (file: File) => {
    setError(null);
    setStatus("analyzing");
    setZipFileName(file.name);

    try {
      const result = await parseAbapGitZip(file);
      setZipResult(result);

      // Convert abapGit objects to UploadedFile entries for the existing UI
      const uploaded: UploadedFile[] = [];

      for (const obj of result.objects) {
        // Add source files (.abap)
        for (const sf of obj.sourceFiles) {
          uploaded.push({
            id: crypto.randomUUID(),
            file,
            name: sf.name,
            size: sf.content.length,
            category: "Main Logic" as FileCategory,
            content: sf.content,
          });
        }

        // Add metadata XML file (for viewing)
        if (obj.metadataFile) {
          uploaded.push({
            id: crypto.randomUUID(),
            file,
            name: obj.metadataFile.name,
            size: obj.metadataFile.content.length,
            category: "Data Dictionary" as FileCategory,
            content: obj.metadataFile.content,
          });
        }
      }

      setFiles((prev) => [...prev, ...uploaded]);

      // Auto-select first .abap file
      const firstAbap = uploaded.find((f) => f.name.endsWith(".abap"));
      if (firstAbap) {
        setSelectedFileId(firstAbap.id);
      }

      setStatus("idle");
    } catch (err) {
      console.error("Failed to parse ZIP:", err);
      setError(`Failed to parse ZIP file: ${file.name}. Make sure it's a valid abapGit export.`);
      setStatus("idle");
    }
  }, []);

  // ─── Handle Regular File Upload ─────────────────────────────────────

  const addFiles = useCallback((newFiles: File[]) => {
    // Check for ZIP files first
    const zipFiles = newFiles.filter((f) => isZipFile(f.name));
    const regularFiles = newFiles.filter((f) => !isZipFile(f.name));

    // Handle ZIP files
    for (const zf of zipFiles) {
      handleZipUpload(zf);
    }

    // Handle regular files
    if (regularFiles.length === 0) return;

    const uploaded: UploadedFile[] = regularFiles.map((file) => {
      const isTemplate = /\.(docx|md|pdf|doc)$/i.test(file.name);
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
    uploaded.forEach(async (uf) => {
      if (isDocxFile(uf.name)) {
        try {
          const content = await parseDocxToMarkdown(uf.file);
          setFiles((prev) =>
            prev.map((f) => (f.id === uf.id ? { ...f, content } : f))
          );
        } catch (err) {
          console.error("Failed to parse DOCX:", err);
          setError(`Failed to parse template: ${uf.name}`);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setFiles((prev) =>
            prev.map((f) => (f.id === uf.id ? { ...f, content } : f))
          );
        };
        reader.readAsText(uf.file);
      }
    });

    if (!selectedFileId && uploaded.length > 0) {
      const firstSource = uploaded.find((f) => f.category !== "Template");
      if (firstSource) {
        setSelectedFileId(firstSource.id);
      } else if (uploaded.length > 0) {
        setSelectedFileId(uploaded[0].id);
      }
    }
  }, [selectedFileId, handleZipUpload]);

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

  // ─── Generate AI Analysis ───────────────────────────────────────────

  const generateWithAI = useCallback(async (scopeFileIds?: string[], scopeLabel?: string) => {
    setError(null);
    setTsMarkdown("");
    setAnalysisScope(scopeLabel || null);

    const config = loadAIConfig();

    if (!config.apiKey.trim()) {
      setError("No API key configured. Please open AI Settings and enter your API key.");
      return;
    }

    // Determine which source files to analyze
    const isSourceFile = (f: UploadedFile) =>
      f.category !== "Template" &&
      !/\.(docx|pdf|png|jpg|jpeg|gif|zip|doc)$/i.test(f.name) &&
      f.content;

    let filesToAnalyze: UploadedFile[];

    if (scopeFileIds && scopeFileIds.length > 0) {
      const idSet = new Set(scopeFileIds);
      filesToAnalyze = files.filter((f) => idSet.has(f.id) && isSourceFile(f));
    } else {
      filesToAnalyze = files.filter(isSourceFile);
    }

    if (filesToAnalyze.length === 0) {
      setError("No source files found. Upload at least one ABAP/ABP source file.");
      return;
    }

    // Build the code payload
    const codeToAnalyze = filesToAnalyze
      .map((f) => {
        const content = f.content || "";
        return `*--- File: ${f.name} ---*\n${content}`;
      })
      .join("\n\n");

    if (!codeToAnalyze.trim() || codeToAnalyze.replace(/\*--- File:.*---\*\n/g, "").trim() === "") {
      setError("File contents not loaded yet. Please wait a moment and try again.");
      return;
    }

    // Build metadata context from parsed XML (structures, data elements, etc.)
    let metadataMarkdown = "";
    if (zipResult) {
      // If scoped, filter objects to only related ones
      if (scopeFileIds && scopeFileIds.length > 0) {
        // Find object names from the scoped files
        const scopedFileNames = filesToAnalyze.map((f) => f.name.split(".")[0].toUpperCase());
        const scopedObjects = zipResult.objects.filter(
          (obj) => scopedFileNames.includes(obj.name) ||
            obj.sourceFiles.some((sf) => scopedFileNames.some((n) => sf.name.toUpperCase().includes(n)))
        );
        metadataMarkdown = buildMetadataContext(scopedObjects);
      } else {
        metadataMarkdown = buildMetadataContext(zipResult.objects);
      }
    }

    // Get template content
    const templateContent = templateFiles
      .filter((f) => f.content)
      .map((f) => f.content!)
      .join("\n\n---\n\n");

    // Inject project metadata
    const projectContext = `
PROJECT METADATA:
- Title: ${projectMetadata.title}
- ID: ${projectMetadata.id}
- Author: ${projectMetadata.author}
- Description: ${projectMetadata.description}

INSTRUCTION: Use the above metadata to fill in the template header and overview sections.
`;

    // Combine all context into the code payload
    let fullCodePayload = codeToAnalyze;
    if (metadataMarkdown) {
      fullCodePayload = `${codeToAnalyze}\n\n---\n\n# ABAP DATA DICTIONARY REFERENCE\nThe following structures, data elements, and object definitions were extracted from the abapGit repository. Use this information for accurate documentation of data types and interfaces.\n\n${metadataMarkdown}`;
    }

    setStatus("analyzing");

    try {
      await new Promise((r) => setTimeout(r, 500));
      setStatus("generating");

      const result = await analyzeWithAI(
        config,
        fullCodePayload,
        templateContent ? projectContext + "\n\n" + templateContent : undefined
      );

      setTsMarkdown(result.markdown);
      setStatus("done");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
      setStatus("idle");
    }
  }, [files, templateFiles, projectMetadata, zipResult]);

  const selectedFile = files.find((f) => f.id === selectedFileId) || null;

  return {
    files,
    sourceFiles,
    templateFiles,
    selectedFile,
    selectedFileId,
    setSelectedFileId,
    status,
    tsMarkdown,
    sidebarCollapsed,
    setSidebarCollapsed,
    error,
    setError,
    analysisScope,
    addFiles,
    removeFile,
    updateCategory,
    generateWithAI,
    projectMetadata,
    setProjectMetadata,
    zipResult,
    zipFileName,
  };
}
