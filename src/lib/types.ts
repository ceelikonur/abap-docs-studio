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

export interface TSSection {
  id: string;
  title: string;
  content: string;
  icon: string;
}
