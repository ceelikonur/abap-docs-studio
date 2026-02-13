/**
 * Types for abapGit ZIP repository structure.
 * Used to represent extracted objects from an abapGit export.
 */

/** The kind of ABAP object extracted from the ZIP */
export type AbapObjectType =
    | "FUGR"  // Function Group
    | "CLAS"  // Class
    | "PROG"  // Program / Report
    | "TABL"  // Table / Structure
    | "DTEL"  // Data Element
    | "DOMA"  // Domain
    | "TTYP"  // Table Type
    | "TRAN"  // Transaction
    | "ENHO"  // Enhancement Implementation
    | "TOBJ"  // Table Maintenance Object
    | "VIEW"  // View
    | "SHLP"  // Search Help
    | "NROB"  // Number Range Object
    | "SICF"  // ICF Service
    | "SXCI"  // BAdI Implementation
    | "ACID"  // Activation Variant ID
    | "SFPF"  // Adobe Form
    | "SFPI"  // Adobe Form Interface
    | "IWSG"  // OData Gateway Service Group
    | "IWOM"  // OData Gateway Model
    | "SPRX"  // Proxy Object
    | "SMIM"  // MIME Object
    | "IATU"  // ITS Template
    | "OTHER";

/** Represents a single field in a structure/table */
export interface AbapField {
    fieldName: string;
    position: number;
    dataElement: string;    // ROLLNAME
    dataType?: string;
    length?: string;
    decimals?: string;
    description?: string;
}

/** Parsed structure/table from .tabl.xml */
export interface AbapStructure {
    name: string;
    description: string;
    tableClass: string;   // INTTAB, TRANSP, APPEND, etc.
    fields: AbapField[];
}

/** Parsed data element from .dtel.xml */
export interface AbapDataElement {
    name: string;
    description: string;
    dataType: string;
    length: string;
    decimals: string;
    labels: {
        short: string;
        medium: string;
        long: string;
    };
}

/** Parsed function module interface from .fugr.xml */
export interface AbapFunctionParam {
    name: string;
    type: string;
    description: string;
}

export interface AbapFunctionModule {
    name: string;
    description: string;
    importing: AbapFunctionParam[];
    exporting: AbapFunctionParam[];
    changing: AbapFunctionParam[];
    tables: AbapFunctionParam[];
    exceptions: string[];
}

/** Parsed function group from .fugr.xml */
export interface AbapFunctionGroup {
    name: string;
    includes: string[];
    functions: AbapFunctionModule[];
}

/** Parsed class from .clas.xml */
export interface AbapClass {
    name: string;
    description: string;
    superclass?: string;
    interfaces: string[];
}

/** A single file extracted from the abapGit ZIP */
export interface AbapGitFile {
    /** Full path within ZIP, e.g. "src/zwm_fg_bin_block.fugr.lzwm_fg_bin_blocktop.abap" */
    path: string;
    /** Just the filename */
    name: string;
    /** The file content as text (for .abap and .xml) */
    content: string;
    /** Detected ABAP object type */
    objectType: AbapObjectType;
    /** The ABAP object name, e.g. "ZWM_FG_BIN_BLOCK" */
    objectName: string;
    /** File extension, e.g. ".fugr.xml", ".clas.abap" */
    fileType: string;
}

/** Represents a package/node in the abapGit tree */
export interface AbapGitPackage {
    /** Package name, e.g. "Z013" or root package like "SISE_EWM" */
    name: string;
    /** Objects belonging to this package */
    objects: AbapGitObject[];
    /** Sub-packages */
    subPackages: AbapGitPackage[];
}

/** A full ABAP development object with all related files */
export interface AbapGitObject {
    /** Object name, e.g. "ZWM_FG_BIN_BLOCK" */
    name: string;
    /** Object type */
    type: AbapObjectType;
    /** Description extracted from XML */
    description: string;
    /** Source code files (.abap) */
    sourceFiles: AbapGitFile[];
    /** Metadata file (.xml) */
    metadataFile?: AbapGitFile;
    /** Parsed metadata (for structures, data elements, function groups, etc.) */
    parsedMeta?: AbapStructure | AbapDataElement | AbapFunctionGroup | AbapClass;
}
