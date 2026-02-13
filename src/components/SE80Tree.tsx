import { useState, useCallback } from "react";
import {
    ChevronRight,
    ChevronDown,
    Package,
    FolderOpen,
    Folder,
    FileCode,
    FileText,
    Box,
    Layers,
    Code2,
    Database,
    Cpu,
    Play,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SE80TreeNode, SE80NodeType } from "@/lib/se80-types";

// ─── Icon mapping for SE80 node types ────────────────────────────────

function getNodeIcon(type: SE80NodeType, expanded: boolean) {
    const size = "h-3.5 w-3.5 shrink-0";

    switch (type) {
        case "package":
            return <Package className={`${size} text-amber-400`} />;

        // Folders
        case "function-groups-folder":
            return expanded ? (
                <FolderOpen className={`${size} text-blue-400`} />
            ) : (
                <Folder className={`${size} text-blue-400`} />
            );
        case "programs-folder":
            return expanded ? (
                <FolderOpen className={`${size} text-green-400`} />
            ) : (
                <Folder className={`${size} text-green-400`} />
            );
        case "classes-folder":
            return expanded ? (
                <FolderOpen className={`${size} text-purple-400`} />
            ) : (
                <Folder className={`${size} text-purple-400`} />
            );
        case "dictionary-folder":
            return expanded ? (
                <FolderOpen className={`${size} text-orange-400`} />
            ) : (
                <Folder className={`${size} text-orange-400`} />
            );
        case "uncategorized-folder":
            return expanded ? (
                <FolderOpen className={`${size} text-gray-400`} />
            ) : (
                <Folder className={`${size} text-gray-400`} />
            );

        // Function Group
        case "function-group":
            return <Box className={`${size} text-blue-400`} />;
        case "fg-main-program":
            return <Play className={`${size} text-blue-300`} />;
        case "fg-top-include":
            return <Layers className={`${size} text-sky-400`} />;
        case "fg-uxx-include":
        case "fg-fxx-include":
            return <FileCode className={`${size} text-slate-400`} />;
        case "fg-function-modules-folder":
            return expanded ? (
                <FolderOpen className={`${size} text-indigo-400`} />
            ) : (
                <Folder className={`${size} text-indigo-400`} />
            );
        case "fg-includes-folder":
            return expanded ? (
                <FolderOpen className={`${size} text-cyan-400`} />
            ) : (
                <Folder className={`${size} text-cyan-400`} />
            );
        case "function-module-include":
            return <Cpu className={`${size} text-indigo-400`} />;
        case "form-include":
            return <Code2 className={`${size} text-cyan-400`} />;

        // Program
        case "program":
            return <FileCode className={`${size} text-green-400`} />;
        case "top-include":
            return <Layers className={`${size} text-emerald-400`} />;
        case "pbo-include":
            return <Code2 className={`${size} text-teal-400`} />;
        case "pai-include":
            return <Code2 className={`${size} text-teal-300`} />;
        case "screen-include":
        case "program-include":
        case "include":
            return <FileCode className={`${size} text-gray-400`} />;

        // Class / Interface
        case "class":
            return <Box className={`${size} text-purple-400`} />;
        case "interface":
            return <Database className={`${size} text-violet-400`} />;

        // Data Dictionary
        case "table":
        case "structure":
        case "data-element":
        case "domain":
            return <Database className={`${size} text-orange-400`} />;

        // Generic
        case "file":
        default:
            return <FileText className={`${size} text-muted-foreground`} />;
    }
}

function getTypeLabel(type: SE80NodeType): string {
    switch (type) {
        case "package": return "Package";
        case "function-groups-folder": return "Function Groups";
        case "function-group": return "Function Group";
        case "fg-main-program": return "Main Program";
        case "fg-top-include": return "TOP Include";
        case "fg-uxx-include": return "UXX Include";
        case "fg-fxx-include": return "FXX Include";
        case "fg-function-modules-folder": return "Function Modules";
        case "fg-includes-folder": return "Includes";
        case "function-module-include": return "Function Module";
        case "form-include": return "Form Include";
        case "programs-folder": return "Programs / Reports";
        case "program": return "Program";
        case "top-include": return "TOP Include";
        case "pbo-include": return "PBO Include";
        case "pai-include": return "PAI Include";
        case "classes-folder": return "Classes / Interfaces";
        case "class": return "Class";
        case "interface": return "Interface";
        default: return "Object";
    }
}

// ─── Tree Node Component ─────────────────────────────────────────────

interface SE80TreeNodeProps {
    node: SE80TreeNode;
    depth: number;
    selectedFileId: string | null;
    onSelectFile: (fileId: string) => void;
    onToggleExpand: (nodeId: string) => void;
    onScopeAnalyze?: (node: SE80TreeNode) => void;
}

function SE80TreeNodeItem({
    node,
    depth,
    selectedFileId,
    onSelectFile,
    onToggleExpand,
    onScopeAnalyze,
}: SE80TreeNodeProps) {
    const hasChildren = node.children.length > 0;
    const isSelected = node.fileId != null && node.fileId === selectedFileId;
    const isContainer = hasChildren || !node.fileId;
    const canAnalyze =
        node.type === "function-group" ||
        node.type === "program" ||
        node.type === "class" ||
        node.type === "package" ||
        node.type === "function-groups-folder" ||
        node.type === "programs-folder" ||
        node.type === "classes-folder";

    const handleClick = () => {
        if (node.fileId) {
            onSelectFile(node.fileId);
        }
        if (hasChildren) {
            onToggleExpand(node.id);
        }
    };

    return (
        <div>
            <div
                className={`group flex items-center gap-1 py-[3px] pr-2 rounded-sm cursor-pointer text-xs transition-colors ${isSelected
                        ? "bg-primary/15 text-primary"
                        : "text-foreground/80 hover:bg-muted/60 hover:text-foreground"
                    }`}
                style={{ paddingLeft: `${depth * 14 + 4}px` }}
                onClick={handleClick}
            >
                {/* Expand/collapse chevron */}
                <span className="w-3.5 shrink-0 flex items-center justify-center">
                    {hasChildren ? (
                        node.expanded ? (
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        )
                    ) : null}
                </span>

                {/* Icon */}
                {getNodeIcon(node.type, node.expanded)}

                {/* Label */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span
                            className={`truncate select-none ${isContainer && !node.fileId ? "font-medium" : ""
                                }`}
                        >
                            {node.label}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                        <p className="font-medium">{node.label}</p>
                        <p className="text-muted-foreground">{getTypeLabel(node.type)}</p>
                    </TooltipContent>
                </Tooltip>

                {/* Scope analyze button (visible on hover for group nodes) */}
                {canAnalyze && onScopeAnalyze && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            onScopeAnalyze(node);
                        }}
                        title={`Analyze ${node.label}`}
                    >
                        <Sparkles className="h-3 w-3 text-primary" />
                    </Button>
                )}
            </div>

            {/* Children */}
            {hasChildren && node.expanded && (
                <div>
                    {node.children.map((child) => (
                        <SE80TreeNodeItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            selectedFileId={selectedFileId}
                            onSelectFile={onSelectFile}
                            onToggleExpand={onToggleExpand}
                            onScopeAnalyze={onScopeAnalyze}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main SE80 Tree Component ────────────────────────────────────────

interface SE80TreeProps {
    tree: SE80TreeNode;
    selectedFileId: string | null;
    onSelectFile: (fileId: string) => void;
    onScopeAnalyze?: (node: SE80TreeNode) => void;
}

export function SE80Tree({
    tree,
    selectedFileId,
    onSelectFile,
    onScopeAnalyze,
}: SE80TreeProps) {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
        // Collect all initially expanded nodes
        const expanded = new Set<string>();
        const walk = (node: SE80TreeNode) => {
            if (node.expanded) expanded.add(node.id);
            node.children.forEach(walk);
        };
        walk(tree);
        return expanded;
    });

    const handleToggleExpand = useCallback((nodeId: string) => {
        setExpandedNodes((prev) => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    }, []);

    // Patch expansion state into tree
    const patchExpanded = useCallback(
        (node: SE80TreeNode): SE80TreeNode => ({
            ...node,
            expanded: expandedNodes.has(node.id),
            children: node.children.map(patchExpanded),
        }),
        [expandedNodes]
    );

    const patchedTree = patchExpanded(tree);

    return (
        <div className="py-1">
            <SE80TreeNodeItem
                node={patchedTree}
                depth={0}
                selectedFileId={selectedFileId}
                onSelectFile={onSelectFile}
                onToggleExpand={handleToggleExpand}
                onScopeAnalyze={onScopeAnalyze}
            />
        </div>
    );
}
