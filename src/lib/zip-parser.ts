/**
 * ZIP parser for abapGit exports.
 * Extracts files, detects object types, and organizes into a tree structure.
 */

import JSZip from "jszip";
import type {
    AbapGitFile,
    AbapGitObject,
    AbapObjectType,
} from "./abapgit-types";
import {
    parseTableXml,
    parseDataElementXml,
    parseFunctionGroupXml,
    parseClassXml,
    structureToMarkdown,
    dataElementToMarkdown,
    functionGroupToMarkdown,
    classToMarkdown,
} from "./abapgit-xml-parser";

// ─── Helpers ──────────────────────────────────────────────────────────

/** Map of abapGit file extension patterns to object types */
const OBJECT_TYPE_MAP: Array<[RegExp, AbapObjectType]> = [
    [/\.fugr\./i, "FUGR"],
    [/\.clas\./i, "CLAS"],
    [/\.prog\./i, "PROG"],
    [/\.tabl\./i, "TABL"],
    [/\.dtel\./i, "DTEL"],
    [/\.doma\./i, "DOMA"],
    [/\.ttyp\./i, "TTYP"],
    [/\.tran\./i, "TRAN"],
    [/\.enho\./i, "ENHO"],
    [/\.tobj\./i, "TOBJ"],
    [/\.view\./i, "VIEW"],
    [/\.shlp\./i, "SHLP"],
    [/\.nrob\./i, "NROB"],
    [/\.sicf\./i, "SICF"],
    [/\.sxci\./i, "SXCI"],
    [/\.acid\./i, "ACID"],
    [/\.sfpf\./i, "SFPF"],
    [/\.sfpi\./i, "SFPI"],
    [/\.iwsg\./i, "IWSG"],
    [/\.iwom\./i, "IWOM"],
    [/\.sprx\./i, "SPRX"],
    [/\.smim\./i, "SMIM"],
    [/\.iatu\./i, "IATU"],
];

function detectObjectType(filename: string): AbapObjectType {
    for (const [regex, type] of OBJECT_TYPE_MAP) {
        if (regex.test(filename)) return type;
    }
    return "OTHER";
}

/**
 * Extract ABAP object name from a filename.
 * e.g. "zwm_fg_bin_block.fugr.lzwm_fg_bin_blocktop.abap" → "ZWM_FG_BIN_BLOCK"
 * e.g. "zewm_s_tu_status_rap.tabl.xml" → "ZEWM_S_TU_STATUS_RAP"
 */
function extractObjectName(filename: string): string {
    // The object name is the first segment before the type extension
    // e.g. "zwm_fg_bin_block.fugr.xml" → "zwm_fg_bin_block"
    const dotParts = filename.split(".");
    if (dotParts.length >= 2) {
        return dotParts[0].toUpperCase();
    }
    return filename.toUpperCase();
}

/**
 * Get the file type extension.
 * e.g. "zwm_fg_bin_block.fugr.xml" → ".fugr.xml"
 */
function getFileType(filename: string): string {
    const firstDot = filename.indexOf(".");
    if (firstDot >= 0) {
        return filename.substring(firstDot);
    }
    return "";
}

// ─── Main Parser ──────────────────────────────────────────────────────

export interface ZipParseResult {
    /** All extracted files (excluding __MACOSX, .html, .js) */
    files: AbapGitFile[];
    /** Objects grouped by name */
    objects: AbapGitObject[];
    /** Summary statistics */
    stats: {
        totalFiles: number;
        abapFiles: number;
        xmlFiles: number;
        structures: number;
        dataElements: number;
        functionGroups: number;
        classes: number;
        programs: number;
    };
}

/**
 * Check if a file is a ZIP archive.
 */
export function isZipFile(name: string): boolean {
    return /\.zip$/i.test(name);
}

/**
 * Parse an abapGit ZIP file and extract all relevant files.
 */
export async function parseAbapGitZip(file: File): Promise<ZipParseResult> {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const files: AbapGitFile[] = [];
    const objectMap = new Map<string, AbapGitObject>();

    // Iterate through all files in the ZIP
    const entries = Object.entries(zip.files);

    for (const [path, entry] of entries) {
        // Skip directories, __MACOSX, .html, .js, .xdp files
        if (entry.dir) continue;
        if (path.includes("__MACOSX")) continue;

        const filename = path.split("/").pop() || "";
        const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();

        // Only process .abap and .xml files
        if (ext !== ".abap" && ext !== ".xml") continue;

        // Skip abapGit config files
        if (filename === ".abapgit.xml") continue;

        // Read content as text
        let content = "";
        try {
            content = await entry.async("text");
        } catch {
            continue; // Skip binary / unreadable files
        }

        const objectType = detectObjectType(filename);
        const objectName = extractObjectName(filename);
        const fileType = getFileType(filename);

        const abapFile: AbapGitFile = {
            path,
            name: filename,
            content,
            objectType,
            objectName,
            fileType,
        };

        files.push(abapFile);

        // Group into objects
        if (!objectMap.has(objectName)) {
            objectMap.set(objectName, {
                name: objectName,
                type: objectType,
                description: "",
                sourceFiles: [],
            });
        }

        const obj = objectMap.get(objectName)!;

        if (ext === ".abap") {
            obj.sourceFiles.push(abapFile);
        } else if (ext === ".xml") {
            // Set as metadata file if it's the main XML (e.g. .fugr.xml, .tabl.xml)
            if (fileType.endsWith(".xml") && !fileType.includes(".iatu.")) {
                obj.metadataFile = abapFile;
                // Parse metadata based on object type
                try {
                    switch (objectType) {
                        case "TABL": {
                            const parsed = parseTableXml(content);
                            if (parsed) {
                                obj.parsedMeta = parsed;
                                obj.description = parsed.description;
                            }
                            break;
                        }
                        case "DTEL": {
                            const parsed = parseDataElementXml(content);
                            if (parsed) {
                                obj.parsedMeta = parsed;
                                obj.description = parsed.description;
                            }
                            break;
                        }
                        case "FUGR": {
                            const parsed = parseFunctionGroupXml(content);
                            if (parsed) {
                                obj.parsedMeta = parsed;
                                obj.description = parsed.functions.length > 0
                                    ? `Function Group with ${parsed.functions.length} FM(s)`
                                    : "Function Group";
                            }
                            break;
                        }
                        case "CLAS": {
                            const parsed = parseClassXml(content);
                            if (parsed) {
                                obj.parsedMeta = parsed;
                                obj.description = parsed.description;
                            }
                            break;
                        }
                    }
                } catch {
                    // Skip parse errors
                }
            }
        }
    }

    const objects = Array.from(objectMap.values());

    // Compute stats
    const stats = {
        totalFiles: files.length,
        abapFiles: files.filter((f) => f.name.endsWith(".abap")).length,
        xmlFiles: files.filter((f) => f.name.endsWith(".xml")).length,
        structures: objects.filter((o) => o.type === "TABL").length,
        dataElements: objects.filter((o) => o.type === "DTEL").length,
        functionGroups: objects.filter((o) => o.type === "FUGR").length,
        classes: objects.filter((o) => o.type === "CLAS").length,
        programs: objects.filter((o) => o.type === "PROG").length,
    };

    return { files, objects, stats };
}

/**
 * Build a summarized markdown of metadata for AI context.
 * Includes structure definitions, data elements, and function module interfaces.
 */
export function buildMetadataContext(objects: AbapGitObject[]): string {
    const sections: string[] = [];

    // Structures
    const structures = objects.filter((o) => o.type === "TABL" && o.parsedMeta);
    if (structures.length > 0) {
        sections.push("## Data Dictionary — Structures & Tables\n");
        for (const obj of structures) {
            sections.push(structureToMarkdown(obj.parsedMeta as any));
            sections.push("");
        }
    }

    // Data elements
    const dataElements = objects.filter((o) => o.type === "DTEL" && o.parsedMeta);
    if (dataElements.length > 0) {
        sections.push("## Data Dictionary — Data Elements\n");
        for (const obj of dataElements) {
            sections.push(dataElementToMarkdown(obj.parsedMeta as any));
            sections.push("");
        }
    }

    // Function groups
    const functionGroups = objects.filter((o) => o.type === "FUGR" && o.parsedMeta);
    if (functionGroups.length > 0) {
        sections.push("## Function Groups\n");
        for (const obj of functionGroups) {
            sections.push(functionGroupToMarkdown(obj.parsedMeta as any));
            sections.push("");
        }
    }

    // Classes
    const classes = objects.filter((o) => o.type === "CLAS" && o.parsedMeta);
    if (classes.length > 0) {
        sections.push("## Classes\n");
        for (const obj of classes) {
            sections.push(classToMarkdown(obj.parsedMeta as any));
            sections.push("");
        }
    }

    return sections.join("\n");
}

/**
 * Get unique object type labels for display.
 */
export const OBJECT_TYPE_LABELS: Record<AbapObjectType, string> = {
    FUGR: "Function Group",
    CLAS: "Class",
    PROG: "Program",
    TABL: "Structure / Table",
    DTEL: "Data Element",
    DOMA: "Domain",
    TTYP: "Table Type",
    TRAN: "Transaction",
    ENHO: "Enhancement",
    TOBJ: "Table Maint. Object",
    VIEW: "View",
    SHLP: "Search Help",
    NROB: "Number Range",
    SICF: "ICF Service",
    SXCI: "BAdI Implementation",
    ACID: "Activation ID",
    SFPF: "Adobe Form",
    SFPI: "Adobe Form Interface",
    IWSG: "OData Service",
    IWOM: "OData Model",
    SPRX: "Proxy",
    SMIM: "MIME Object",
    IATU: "ITS Template",
    OTHER: "Other",
};
