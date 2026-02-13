export type FileCategory =
  | "Main Logic"
  | "Data Dictionary"
  | "Include"
  | "Function Module"
  | "Class"
  | "Template";

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  category: FileCategory;
  content?: string;
}

export type GenerationStatus = "idle" | "analyzing" | "generating" | "done";

// Legacy section format (kept for backwards compat)
export interface TSSection {
  id: string;
  title: string;
  content: string;
  icon: string;
}

// New: markdown-based TS output
export interface TSResult {
  markdown: string;       // Full markdown content
  sections?: TSSection[]; // Optional structured sections
}
