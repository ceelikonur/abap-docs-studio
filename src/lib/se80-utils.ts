import type { UploadedFile } from "./types";
import type { SE80TreeNode, DetectedFile, DetectedFileType } from "./se80-types";
import { parseAbapContent, type ParsedContent } from "./abap-parser";

// ─── File Name Analysis ──────────────────────────────────────────────
// Detects the ABAP object type from the file name using SAP naming conventions.

export function detectFileType(fileName: string): { type: DetectedFileType; groupKey?: string } {
    // Remove any extension
    const base = fileName.replace(/\.[^.]+$/, "").toUpperCase();

    // ─── Function Group patterns ─────────────────────────────────────

    // SAPL<FGRP> → Main program of function group
    const saplMatch = base.match(/^SAPL(.+)$/);
    if (saplMatch) {
        return { type: "fg-main", groupKey: saplMatch[1] };
    }

    // L<FGRP>TOP → TOP include
    const topMatch = base.match(/^L(.+)TOP$/);
    if (topMatch && topMatch[1].length >= 2) {
        return { type: "fg-top", groupKey: topMatch[1] };
    }

    // L<FGRP>UXX → Function module registry
    const uxxMatch = base.match(/^L(.+)UXX$/);
    if (uxxMatch && uxxMatch[1].length >= 2) {
        return { type: "fg-uxx", groupKey: uxxMatch[1] };
    }

    // L<FGRP>FXX → Form routine registry
    const fxxMatch = base.match(/^L(.+)FXX$/);
    if (fxxMatch && fxxMatch[1].length >= 2) {
        return { type: "fg-fxx", groupKey: fxxMatch[1] };
    }

    // L<FGRP>U01, U02, ... → Function module includes
    const funcIncMatch = base.match(/^L(.+)U(\d{2,3})$/);
    if (funcIncMatch && funcIncMatch[1].length >= 2) {
        return { type: "fg-func-include", groupKey: funcIncMatch[1] };
    }

    // L<FGRP>F01, F02, ... → Form includes
    const formIncMatch = base.match(/^L(.+)F(\d{2,3})$/);
    if (formIncMatch && formIncMatch[1].length >= 2) {
        return { type: "fg-form-include", groupKey: formIncMatch[1] };
    }

    // L<FGRP>I01, I02, ... → PAI includes (some conventions)
    const paiIncMatch = base.match(/^L(.+)I(\d{2,3})$/);
    if (paiIncMatch && paiIncMatch[1].length >= 2) {
        return { type: "fg-form-include", groupKey: paiIncMatch[1] };
    }

    // L<FGRP>O01, O02, ... → PBO includes (some conventions)
    const pboIncMatch = base.match(/^L(.+)O(\d{2,3})$/);
    if (pboIncMatch && pboIncMatch[1].length >= 2) {
        return { type: "fg-form-include", groupKey: pboIncMatch[1] };
    }

    // ─── Class / Interface patterns ──────────────────────────────────

    if (/^[ZY]CL_/.test(base) || /^CL_/.test(base)) {
        return { type: "class" };
    }
    if (/^[ZY]IF_/.test(base) || /^IF_/.test(base)) {
        return { type: "interface" };
    }

    // ─── Program / Report patterns ───────────────────────────────────

    // SAPM<PROG> → Module pool main program
    const sapmMatch = base.match(/^SAPM(.+)$/);
    if (sapmMatch) {
        return { type: "program", groupKey: sapmMatch[1] };
    }

    // <PROG>_TOP → Program TOP include
    const progTopMatch = base.match(/^(.+)_TOP$/);
    if (progTopMatch) {
        return { type: "program-top", groupKey: progTopMatch[1] };
    }

    // <PROG>_PBO → Program PBO include
    const progPboMatch = base.match(/^(.+)_PBO$/);
    if (progPboMatch) {
        return { type: "program-pbo", groupKey: progPboMatch[1] };
    }

    // <PROG>_PAI → Program PAI include
    const progPaiMatch = base.match(/^(.+)_PAI$/);
    if (progPaiMatch) {
        return { type: "program-pai", groupKey: progPaiMatch[1] };
    }

    // <PROG>_F01, _F02, ... → Program form includes
    const progFormMatch = base.match(/^(.+)_F(\d{2,3})$/);
    if (progFormMatch) {
        return { type: "program-form-include", groupKey: progFormMatch[1] };
    }

    // <PROG>_I01, _I02, ... → Program includes
    const progIncMatch = base.match(/^(.+)_I(\d{2,3})$/);
    if (progIncMatch) {
        return { type: "program-include", groupKey: progIncMatch[1] };
    }

    // <PROG>_O01, _O02, ... → Program PBO includes
    const progOMatch = base.match(/^(.+)_O(\d{2,3})$/);
    if (progOMatch) {
        return { type: "program-pbo", groupKey: progOMatch[1] };
    }

    // Generic Z* or Y* programs/reports
    if (/^[ZY]/.test(base)) {
        return { type: "program", groupKey: base };
    }

    // ─── Fallback: Try to detect from content later ──────────────────
    return { type: "unknown" };
}

// ─── Content-based refinement ────────────────────────────────────────
// After file content is available, try to refine the detection.

function refineWithContent(
    detected: DetectedFile,
    content: string | undefined
): DetectedFile {
    if (!content) return detected;

    // If already categorized by filename, no need to refine (except for unknown)
    if (detected.type !== "unknown" && detected.type !== "include") {
        return detected;
    }

    const parsed = parseAbapContent(content);

    // If file contains FUNCTION → it's a function module include
    if (parsed.functions.length > 0) {
        return { ...detected, type: "fg-func-include" };
    }

    // If file contains REPORT/PROGRAM → it's a program
    if (parsed.reportName) {
        return { ...detected, type: "program", groupKey: parsed.reportName.toUpperCase() };
    }

    // If file contains CLASS → it's a class
    if (parsed.className) {
        return { ...detected, type: "class" };
    }

    // If file contains INTERFACE → it's an interface
    if (parsed.interfaceName) {
        return { ...detected, type: "interface" };
    }

    // If file contains FORM → treat as include/form include
    if (parsed.forms.length > 0) {
        return { ...detected, type: "include" };
    }

    return detected;
}

// ─── Build SE80 Tree from uploaded files ─────────────────────────────

export function buildSE80Tree(
    files: UploadedFile[],
    packageName: string = "Project"
): SE80TreeNode {
    // Step 1: Detect all files by filename
    let detected: DetectedFile[] = files.map((f) => {
        const { type, groupKey } = detectFileType(f.name);
        return {
            fileId: f.id,
            fileName: f.name,
            baseName: f.name.replace(/\.[^.]+$/, ""),
            type,
            groupKey,
            content: f.content,
        };
    });

    // Step 2: Refine with content analysis
    detected = detected.map((d) => {
        const file = files.find((f) => f.id === d.fileId);
        return refineWithContent(d, file?.content);
    });

    // Step 3: Group function group files
    const fgFiles = detected.filter((d) =>
        ["fg-main", "fg-top", "fg-uxx", "fg-fxx", "fg-func-include", "fg-form-include"].includes(
            d.type
        )
    );
    const fgGroups = new Map<string, DetectedFile[]>();
    fgFiles.forEach((d) => {
        if (!d.groupKey) return;
        const existing = fgGroups.get(d.groupKey) || [];
        existing.push(d);
        fgGroups.set(d.groupKey, existing);
    });

    // Step 4: Group program files
    const programDetected = detected.filter((d) =>
        [
            "program",
            "program-top",
            "program-pbo",
            "program-pai",
            "program-form-include",
            "program-include",
        ].includes(d.type)
    );
    const programGroups = new Map<string, DetectedFile[]>();
    programDetected.forEach((d) => {
        const key = d.groupKey || d.baseName;
        const existing = programGroups.get(key) || [];
        existing.push(d);
        programGroups.set(key, existing);
    });

    // Step 5: Classes & Interfaces
    const classFiles = detected.filter((d) => d.type === "class");
    const interfaceFiles = detected.filter((d) => d.type === "interface");

    // Step 6: Uncategorized
    const categorizedIds = new Set<string>();
    [...fgFiles, ...programDetected, ...classFiles, ...interfaceFiles].forEach((d) =>
        categorizedIds.add(d.fileId)
    );
    const uncategorized = detected.filter((d) => !categorizedIds.has(d.fileId));

    // ─── Build tree nodes ────────────────────────────────────────────
    const children: SE80TreeNode[] = [];

    // Function Groups folder
    if (fgGroups.size > 0) {
        const fgFolderChildren: SE80TreeNode[] = [];

        fgGroups.forEach((groupFiles, groupName) => {
            const fgNode = buildFunctionGroupNode(groupName, groupFiles, files);
            fgFolderChildren.push(fgNode);
        });

        children.push({
            id: "fg-folder",
            label: "Function Groups",
            type: "function-groups-folder",
            children: fgFolderChildren,
            expanded: true,
        });
    }

    // Programs folder
    if (programGroups.size > 0) {
        const progFolderChildren: SE80TreeNode[] = [];

        programGroups.forEach((groupFiles, groupName) => {
            if (groupFiles.length === 1 && groupFiles[0].type === "program") {
                // Simple program (no includes) — show with parsed subitems
                const file = files.find((f) => f.id === groupFiles[0].fileId);
                const progNode = buildSimpleProgramNode(groupFiles[0], file);
                progFolderChildren.push(progNode);
            } else {
                // Program with includes
                progFolderChildren.push(buildProgramNode(groupName, groupFiles, files));
            }
        });

        children.push({
            id: "prog-folder",
            label: "Programs / Reports",
            type: "programs-folder",
            children: progFolderChildren,
            expanded: true,
        });
    }

    // Classes folder
    if (classFiles.length > 0 || interfaceFiles.length > 0) {
        const classChildren: SE80TreeNode[] = [];

        classFiles.forEach((d) => {
            classChildren.push({
                id: `class-${d.fileId}`,
                label: d.fileName,
                type: "class",
                children: [],
                fileId: d.fileId,
                expanded: false,
            });
        });

        interfaceFiles.forEach((d) => {
            classChildren.push({
                id: `if-${d.fileId}`,
                label: d.fileName,
                type: "interface",
                children: [],
                fileId: d.fileId,
                expanded: false,
            });
        });

        children.push({
            id: "class-folder",
            label: "Classes / Interfaces",
            type: "classes-folder",
            children: classChildren,
            expanded: true,
        });
    }

    // Uncategorized folder
    if (uncategorized.length > 0) {
        const uncatChildren: SE80TreeNode[] = uncategorized.map((d) => ({
            id: `uncat-${d.fileId}`,
            label: d.fileName,
            type: "file" as const,
            children: [],
            fileId: d.fileId,
            expanded: false,
        }));

        children.push({
            id: "uncat-folder",
            label: "Other Objects",
            type: "uncategorized-folder",
            children: uncatChildren,
            expanded: true,
        });
    }

    // Root package node
    return {
        id: "root",
        label: packageName,
        type: "package",
        children,
        expanded: true,
    };
}

// ─── Build a Function Group node ─────────────────────────────────────

function buildFunctionGroupNode(
    groupName: string,
    detectedFiles: DetectedFile[],
    allFiles: UploadedFile[]
): SE80TreeNode {
    const children: SE80TreeNode[] = [];

    // Main program (SAPL*)
    const mainProg = detectedFiles.find((f) => f.type === "fg-main");
    if (mainProg) {
        children.push({
            id: `fg-main-${mainProg.fileId}`,
            label: mainProg.fileName,
            type: "fg-main-program",
            children: [],
            fileId: mainProg.fileId,
            expanded: false,
        });
    }

    // TOP include
    const topInc = detectedFiles.find((f) => f.type === "fg-top");
    if (topInc) {
        children.push({
            id: `fg-top-${topInc.fileId}`,
            label: topInc.fileName,
            type: "fg-top-include",
            children: [],
            fileId: topInc.fileId,
            expanded: false,
        });
    }

    // UXX
    const uxx = detectedFiles.find((f) => f.type === "fg-uxx");
    if (uxx) {
        children.push({
            id: `fg-uxx-${uxx.fileId}`,
            label: uxx.fileName,
            type: "fg-uxx-include",
            children: [],
            fileId: uxx.fileId,
            expanded: false,
        });
    }

    // FXX
    const fxx = detectedFiles.find((f) => f.type === "fg-fxx");
    if (fxx) {
        children.push({
            id: `fg-fxx-${fxx.fileId}`,
            label: fxx.fileName,
            type: "fg-fxx-include",
            children: [],
            fileId: fxx.fileId,
            expanded: false,
        });
    }

    // Function Module Includes (U01, U02, ...) — parse content to show function names
    const funcIncludes = detectedFiles.filter((f) => f.type === "fg-func-include");
    if (funcIncludes.length > 0) {
        const fmChildren: SE80TreeNode[] = [];

        funcIncludes.forEach((fi) => {
            const uploadedFile = allFiles.find((f) => f.id === fi.fileId);
            const parsed = uploadedFile?.content
                ? parseAbapContent(uploadedFile.content)
                : null;

            if (parsed && parsed.functions.length > 0) {
                // Show each FUNCTION from the file as a child node
                parsed.functions.forEach((func, idx) => {
                    fmChildren.push({
                        id: `fg-fm-${fi.fileId}-fn-${idx}`,
                        label: func.name,
                        type: "function-module-include",
                        children: [],
                        fileId: fi.fileId,
                        expanded: false,
                    });
                });
            } else {
                // Fallback: show the file name
                fmChildren.push({
                    id: `fg-fm-${fi.fileId}`,
                    label: fi.fileName,
                    type: "function-module-include",
                    children: [],
                    fileId: fi.fileId,
                    expanded: false,
                });
            }
        });

        children.push({
            id: `fg-fmods-${groupName}`,
            label: "Function Modules",
            type: "fg-function-modules-folder",
            expanded: true,
            children: fmChildren,
        });
    }

    // Form Includes (F01, F02, ...) — parse content to show form names
    const formIncludes = detectedFiles.filter((f) => f.type === "fg-form-include");
    if (formIncludes.length > 0) {
        const incChildren: SE80TreeNode[] = [];

        formIncludes.forEach((fi) => {
            const uploadedFile = allFiles.find((f) => f.id === fi.fileId);
            const parsed = uploadedFile?.content
                ? parseAbapContent(uploadedFile.content)
                : null;

            // Always show the file node
            const fileChildNodes: SE80TreeNode[] = [];

            if (parsed && parsed.forms.length > 0) {
                parsed.forms.forEach((form, idx) => {
                    fileChildNodes.push({
                        id: `fg-fi-${fi.fileId}-form-${idx}`,
                        label: `FORM ${form.name}`,
                        type: "form-include",
                        children: [],
                        fileId: fi.fileId,
                        expanded: false,
                    });
                });
            }

            if (parsed && parsed.modules.length > 0) {
                parsed.modules.forEach((mod, idx) => {
                    fileChildNodes.push({
                        id: `fg-fi-${fi.fileId}-mod-${idx}`,
                        label: `MODULE ${mod.name} ${mod.type}`,
                        type: "form-include",
                        children: [],
                        fileId: fi.fileId,
                        expanded: false,
                    });
                });
            }

            incChildren.push({
                id: `fg-fi-${fi.fileId}`,
                label: fi.fileName,
                type: "form-include",
                children: fileChildNodes,
                fileId: fi.fileId,
                expanded: fileChildNodes.length > 0,
            });
        });

        children.push({
            id: `fg-incs-${groupName}`,
            label: "Includes",
            type: "fg-includes-folder",
            expanded: true,
            children: incChildren,
        });
    }

    return {
        id: `fg-${groupName}`,
        label: groupName,
        type: "function-group",
        children,
        expanded: true,
    };
}

// ─── Build a simple program node (single file, parse content) ────────

function buildSimpleProgramNode(
    detected: DetectedFile,
    file: UploadedFile | undefined
): SE80TreeNode {
    const children: SE80TreeNode[] = [];
    const parsed = file?.content ? parseAbapContent(file.content) : null;

    if (parsed) {
        // Show forms
        parsed.forms.forEach((form, idx) => {
            children.push({
                id: `prog-${detected.fileId}-form-${idx}`,
                label: `FORM ${form.name}`,
                type: "include",
                children: [],
                fileId: detected.fileId,
                expanded: false,
            });
        });

        // Show modules
        parsed.modules.forEach((mod, idx) => {
            children.push({
                id: `prog-${detected.fileId}-mod-${idx}`,
                label: `MODULE ${mod.name} ${mod.type}`,
                type: "screen-include",
                children: [],
                fileId: detected.fileId,
                expanded: false,
            });
        });
    }

    return {
        id: `prog-${detected.fileId}`,
        label: parsed?.reportName || detected.fileName,
        type: "program",
        children,
        fileId: detected.fileId,
        expanded: children.length > 0,
    };
}

// ─── Build a Program node with includes ──────────────────────────────

function buildProgramNode(
    progName: string,
    detectedFiles: DetectedFile[],
    allFiles: UploadedFile[]
): SE80TreeNode {
    const children: SE80TreeNode[] = [];

    // Main program
    const mainProg = detectedFiles.find((f) => f.type === "program");
    if (mainProg) {
        children.push({
            id: `prog-main-${mainProg.fileId}`,
            label: mainProg.fileName,
            type: "program",
            children: [],
            fileId: mainProg.fileId,
            expanded: false,
        });
    }

    // TOP include
    const topInc = detectedFiles.find((f) => f.type === "program-top");
    if (topInc) {
        children.push({
            id: `prog-top-${topInc.fileId}`,
            label: topInc.fileName,
            type: "top-include",
            children: [],
            fileId: topInc.fileId,
            expanded: false,
        });
    }

    // PBO include — parse for MODULEs
    const pboInc = detectedFiles.find((f) => f.type === "program-pbo");
    if (pboInc) {
        const file = allFiles.find((f) => f.id === pboInc.fileId);
        const parsed = file?.content ? parseAbapContent(file.content) : null;
        const moduleChildren: SE80TreeNode[] = [];

        if (parsed) {
            parsed.modules.forEach((mod, idx) => {
                moduleChildren.push({
                    id: `prog-pbo-${pboInc.fileId}-mod-${idx}`,
                    label: `MODULE ${mod.name} ${mod.type}`,
                    type: "screen-include",
                    children: [],
                    fileId: pboInc.fileId,
                    expanded: false,
                });
            });
        }

        children.push({
            id: `prog-pbo-${pboInc.fileId}`,
            label: pboInc.fileName,
            type: "pbo-include",
            children: moduleChildren,
            fileId: pboInc.fileId,
            expanded: moduleChildren.length > 0,
        });
    }

    // PAI include — parse for MODULEs
    const paiInc = detectedFiles.find((f) => f.type === "program-pai");
    if (paiInc) {
        const file = allFiles.find((f) => f.id === paiInc.fileId);
        const parsed = file?.content ? parseAbapContent(file.content) : null;
        const moduleChildren: SE80TreeNode[] = [];

        if (parsed) {
            parsed.modules.forEach((mod, idx) => {
                moduleChildren.push({
                    id: `prog-pai-${paiInc.fileId}-mod-${idx}`,
                    label: `MODULE ${mod.name} ${mod.type}`,
                    type: "screen-include",
                    children: [],
                    fileId: paiInc.fileId,
                    expanded: false,
                });
            });
        }

        children.push({
            id: `prog-pai-${paiInc.fileId}`,
            label: paiInc.fileName,
            type: "pai-include",
            children: moduleChildren,
            fileId: paiInc.fileId,
            expanded: moduleChildren.length > 0,
        });
    }

    // Form/Screen includes — parse for FORMs
    const formIncs = detectedFiles.filter((f) =>
        ["program-form-include", "program-include"].includes(f.type)
    );
    formIncs.forEach((fi) => {
        const file = allFiles.find((f) => f.id === fi.fileId);
        const parsed = file?.content ? parseAbapContent(file.content) : null;
        const formChildren: SE80TreeNode[] = [];

        if (parsed) {
            parsed.forms.forEach((form, idx) => {
                formChildren.push({
                    id: `prog-inc-${fi.fileId}-form-${idx}`,
                    label: `FORM ${form.name}`,
                    type: "include",
                    children: [],
                    fileId: fi.fileId,
                    expanded: false,
                });
            });
        }

        children.push({
            id: `prog-inc-${fi.fileId}`,
            label: fi.fileName,
            type: "include",
            children: formChildren,
            fileId: fi.fileId,
            expanded: formChildren.length > 0,
        });
    });

    return {
        id: `progrp-${progName}`,
        label: progName,
        type: "program",
        children,
        expanded: true,
    };
}

// ─── Get all file IDs under a tree node ──────────────────────────────

export function getFileIdsUnderNode(node: SE80TreeNode): string[] {
    const ids: string[] = [];
    if (node.fileId) {
        ids.push(node.fileId);
    }
    node.children.forEach((child) => {
        ids.push(...getFileIdsUnderNode(child));
    });
    // Deduplicate (same file ID may appear multiple times for parsed items)
    return [...new Set(ids)];
}

// ─── Get a readable scope label ──────────────────────────────────────

export function getScopeLabel(node: SE80TreeNode): string {
    switch (node.type) {
        case "package":
            return `Package: ${node.label}`;
        case "function-group":
            return `Function Group: ${node.label}`;
        case "program":
            return node.children.length > 0 ? `Program: ${node.label}` : node.label;
        case "class":
            return `Class: ${node.label}`;
        case "interface":
            return `Interface: ${node.label}`;
        case "function-groups-folder":
            return "All Function Groups";
        case "programs-folder":
            return "All Programs";
        case "classes-folder":
            return "All Classes";
        default:
            return node.label;
    }
}
