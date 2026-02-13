// ─── SE80 Object Navigator Types ─────────────────────────────────────

export type SE80NodeType =
    | "package"
    // Folder containers
    | "function-groups-folder"
    | "programs-folder"
    | "classes-folder"
    | "dictionary-folder"
    | "uncategorized-folder"
    // Function Group internals
    | "function-group"
    | "fg-main-program"
    | "fg-top-include"
    | "fg-uxx-include"
    | "fg-fxx-include"
    | "fg-function-modules-folder"
    | "fg-includes-folder"
    | "function-module-include"
    | "form-include"
    // Program / Report internals
    | "program"
    | "program-include"
    | "top-include"
    | "pbo-include"
    | "pai-include"
    | "screen-include"
    // Classes
    | "class"
    | "interface"
    // Data Dictionary
    | "table"
    | "structure"
    | "data-element"
    | "domain"
    // Generic
    | "include"
    | "file";

export interface SE80TreeNode {
    id: string;
    label: string;
    type: SE80NodeType;
    children: SE80TreeNode[];
    fileId?: string; // links to UploadedFile.id if this node represents a file
    expanded: boolean;
}

// ─── Detected file classification ────────────────────────────────────

export type DetectedFileType =
    | "fg-main"
    | "fg-top"
    | "fg-uxx"
    | "fg-fxx"
    | "fg-func-include"
    | "fg-form-include"
    | "program"
    | "program-top"
    | "program-pbo"
    | "program-pai"
    | "program-form-include"
    | "program-include"
    | "class"
    | "interface"
    | "dictionary"
    | "include"
    | "unknown";

export interface DetectedFile {
    fileId: string;
    fileName: string;
    baseName: string; // filename without extension
    type: DetectedFileType;
    groupKey?: string; // function group name or program name this belongs to
    content?: string;  // file content for content-based analysis
}
