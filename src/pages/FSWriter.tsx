import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    FileCode,
    ArrowLeft,
    Sparkles,
    Download,
    AlertCircle,
    X,
    Send,
    Settings2,
    FileText,
    Printer,
    Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { AISettingsDialog } from "@/components/AISettingsDialog";
import { TSPreview } from "@/components/TSPreview";
import { loadAIConfig } from "@/lib/ai-config";
import { generateFSWithAI } from "@/lib/ai-service";
import type { FSParameters } from "@/lib/ai-service";
import { isDocxFile, parseDocxToMarkdown } from "@/lib/docx-parser";
import type { GenerationStatus } from "@/lib/types";

// ─── SAP Module Configs ──────────────────────────────────────────────

const SAP_MODULES = [
    { value: "EWM", label: "Extended Warehouse Management" },
    { value: "MM", label: "Materials Management" },
    { value: "SD", label: "Sales & Distribution" },
    { value: "PP", label: "Production Planning" },
    { value: "FI", label: "Financial Accounting" },
    { value: "CO", label: "Controlling" },
    { value: "WM", label: "Warehouse Management (Classic)" },
    { value: "QM", label: "Quality Management" },
    { value: "PM", label: "Plant Maintenance" },
    { value: "TM", label: "Transportation Management" },
    { value: "LE", label: "Logistics Execution" },
    { value: "OTHER", label: "Other" },
];

const PROCESS_AREAS: Record<string, string[]> = {
    EWM: [
        "Inbound Process",
        "Outbound Process",
        "Inventory Management",
        "Warehouse Task Processing",
        "Handling Unit Management",
        "RF (Radio Frequency)",
        "Wave Management",
        "Yard Management",
        "Slotting",
        "Resource Management",
        "Cross-Docking",
        "Value Added Services",
        "Replenishment",
        "Physical Inventory",
        "Deconsolidation",
        "Label Printing",
        "Custom Enhancement",
        "Other",
    ],
    MM: ["Procurement", "Inventory Management", "Invoice Verification", "Material Master", "Vendor Management", "MRP", "Other"],
    SD: ["Sales Order", "Delivery", "Billing", "Pricing", "Credit Management", "Shipping", "Other"],
    PP: ["Production Order", "BOM", "Routing", "MRP", "Capacity Planning", "Shop Floor", "Other"],
    FI: ["General Ledger", "Accounts Payable", "Accounts Receivable", "Asset Accounting", "Bank Accounting", "Other"],
    CO: ["Cost Center", "Profit Center", "Internal Order", "Product Costing", "Other"],
    WM: ["Goods Receipt", "Goods Issue", "Transfer Order", "Storage Bin", "Inventory", "Other"],
    QM: ["Inspection", "Quality Notification", "Quality Certificate", "Other"],
    PM: ["Maintenance Order", "Notification", "Equipment", "Functional Location", "Other"],
    TM: ["Freight Order", "Freight Unit", "Carrier Selection", "Other"],
    LE: ["Delivery", "Shipment", "Handling Unit", "Other"],
    OTHER: ["Custom Process", "Enhancement", "Report", "Interface", "Other"],
};

const COMPLEXITY_LEVELS = [
    { value: "Low", label: "Low — Simple report, single table, basic logic" },
    { value: "Medium", label: "Medium — Multi-step process, validations, integrations" },
    { value: "High", label: "High — Complex workflow, multi-module, RF screens" },
];

const TARGET_SYSTEMS = [
    { value: "S/4HANA 2023", label: "S/4HANA 2023+" },
    { value: "S/4HANA 2021", label: "S/4HANA 2021" },
    { value: "S/4HANA 2020", label: "S/4HANA 2020" },
    { value: "ECC 6.0 EHP8", label: "ECC 6.0 EHP8" },
    { value: "ECC 6.0 EHP7", label: "ECC 6.0 EHP7" },
];

// ─── Example Prompts ─────────────────────────────────────────────────

const EXAMPLE_PROMPTS = [
    {
        label: "HU Transfer Program",
        prompt: "Create a Handling Unit (HU) transfer program for SAP EWM. The program should allow warehouse operators to scan a source bin, scan HU(s), and transfer them to a destination bin. It should validate bin existence, HU status, and warehouse task creation via /SCWM/ APIs. Include RF screen design for mobile devices.",
    },
    {
        label: "Bin Block/Unblock",
        prompt: "Create a bin blocking/unblocking utility for SAP EWM. Users should be able to block single or multiple bins by storage type, with reason codes. The program should check for existing stock, create warehouse tasks for relocation if needed, and log all blocking activities. Include both a GUI transaction and an RF-based interface.",
    },
    {
        label: "Label Printing Enhancement",
        prompt: "Create a box label printing enhancement for SAP EWM outbound process. When a Handling Unit is packed during the outbound process, the system should automatically trigger label printing via Adobe Forms. Labels should include HU ID (barcode), destination address, weight, item details, and a QR code for tracking. Support both single and bulk printing.",
    },
    {
        label: "Custom Inbound Report",
        prompt: "Create a custom inbound delivery monitoring report for SAP EWM. The report should display all inbound deliveries with their status, expected arrival date, supplier info, and received quantities. Include filters for date range, warehouse number, supplier, and status. Output should be an ALV grid with drill-down capability to individual delivery documents.",
    },
];

// ─── Component ───────────────────────────────────────────────────────

const FSWriter = () => {
    const navigate = useNavigate();

    // FS Parameters
    const [params, setParams] = useState<FSParameters>({
        module: "EWM",
        processArea: "Custom Enhancement",
        complexity: "Medium",
        targetSystem: "S/4HANA 2023",
        author: "Consultant",
        projectName: "Custom EWM Development",
    });

    // Prompt & generation
    const [prompt, setPrompt] = useState("");
    const [status, setStatus] = useState<GenerationStatus>("idle");
    const [fsMarkdown, setFsMarkdown] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Template
    const [templateContent, setTemplateContent] = useState("");
    const [templateName, setTemplateName] = useState("");
    const templateInputRef = useRef<HTMLInputElement>(null);

    // Settings dialog
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Available process areas for selected module
    const processAreas = PROCESS_AREAS[params.module] || PROCESS_AREAS.OTHER;

    // ─── Template Upload ─────────────────────────────────────────────

    const handleTemplateUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setTemplateName(file.name);

        if (isDocxFile(file.name)) {
            try {
                const content = await parseDocxToMarkdown(file);
                setTemplateContent(content);
            } catch {
                setError("Failed to parse template DOCX file.");
            }
        } else {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setTemplateContent(ev.target?.result as string || "");
            };
            reader.readAsText(file);
        }
        e.target.value = "";
    }, []);

    // ─── Generate FS ─────────────────────────────────────────────────

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setError("Please enter a requirement description.");
            return;
        }

        const config = loadAIConfig();
        if (!config.apiKey.trim()) {
            setError("No API key configured. Please open AI Settings and enter your API key.");
            return;
        }

        setError(null);
        setFsMarkdown("");
        setStatus("analyzing");

        try {
            await new Promise((r) => setTimeout(r, 300));
            setStatus("generating");

            const result = await generateFSWithAI(
                config,
                prompt,
                params,
                templateContent || undefined
            );

            setFsMarkdown(result.markdown);
            setStatus("done");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error occurred";
            setError(message);
            setStatus("idle");
        }
    }, [prompt, params, templateContent]);

    const isGenerating = status === "analyzing" || status === "generating";

    return (
        <div className="h-screen flex flex-col">
            {/* Toolbar */}
            <header className="border-b bg-card/80 backdrop-blur-sm shrink-0 z-50">
                <div className="flex items-center justify-between h-12 px-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate("/")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <FileText className="h-3 w-3 text-white" />
                            </div>
                            <span className="font-semibold text-sm">FS Writer</span>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                Functional Spec
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {templateName && (
                            <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {templateName}
                            </span>
                        )}
                        <AISettingsDialog />
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:from-emerald-600 hover:to-teal-700"
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                        >
                            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                            {isGenerating ? "Generating..." : "Generate FS"}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Error banner */}
            {error && (
                <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-xs text-destructive flex-1">{error}</p>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => setError(null)}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 min-h-0">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    {/* ── Left: Prompt & Parameters ── */}
                    <ResizablePanel defaultSize={40} minSize={30}>
                        <div className="h-full flex flex-col overflow-auto">
                            {/* FS Parameters */}
                            <div className="p-4 border-b bg-card/50">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                        <Settings2 className="h-4 w-4 text-emerald-400" />
                                        FS Parameters
                                    </h3>
                                    {/* Template upload */}
                                    <div>
                                        <input
                                            ref={templateInputRef}
                                            type="file"
                                            accept=".docx,.md,.txt"
                                            onChange={handleTemplateUpload}
                                            className="hidden"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => templateInputRef.current?.click()}
                                        >
                                            <Upload className="h-3 w-3 mr-1" />
                                            {templateName ? "Change Template" : "Upload Template"}
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Module */}
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">SAP Module</Label>
                                        <Select
                                            value={params.module}
                                            onValueChange={(v) =>
                                                setParams((p) => ({
                                                    ...p,
                                                    module: v,
                                                    processArea: PROCESS_AREAS[v]?.[0] || "Other",
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SAP_MODULES.map((m) => (
                                                    <SelectItem key={m.value} value={m.value} className="text-xs">
                                                        {m.value} — {m.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Process Area */}
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Process Area</Label>
                                        <Select
                                            value={params.processArea}
                                            onValueChange={(v) => setParams((p) => ({ ...p, processArea: v }))}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {processAreas.map((area) => (
                                                    <SelectItem key={area} value={area} className="text-xs">
                                                        {area}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Complexity */}
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Complexity</Label>
                                        <Select
                                            value={params.complexity}
                                            onValueChange={(v) => setParams((p) => ({ ...p, complexity: v }))}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {COMPLEXITY_LEVELS.map((c) => (
                                                    <SelectItem key={c.value} value={c.value} className="text-xs">
                                                        {c.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Target System */}
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Target System</Label>
                                        <Select
                                            value={params.targetSystem}
                                            onValueChange={(v) => setParams((p) => ({ ...p, targetSystem: v }))}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TARGET_SYSTEMS.map((s) => (
                                                    <SelectItem key={s.value} value={s.value} className="text-xs">
                                                        {s.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Author */}
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Author</Label>
                                        <Input
                                            value={params.author}
                                            onChange={(e) => setParams((p) => ({ ...p, author: e.target.value }))}
                                            className="h-8 text-xs"
                                            placeholder="Your Name"
                                        />
                                    </div>

                                    {/* Project Name */}
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Project</Label>
                                        <Input
                                            value={params.projectName}
                                            onChange={(e) => setParams((p) => ({ ...p, projectName: e.target.value }))}
                                            className="h-8 text-xs"
                                            placeholder="Project Name"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Prompt area */}
                            <div className="flex-1 flex flex-col p-4">
                                <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Send className="h-4 w-4 text-emerald-400" />
                                    Requirement Description
                                </Label>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Describe what you need in plain language. The AI will generate a
                                    complete Functional Specification that developers can implement from.
                                </p>
                                <Textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="E.g. Create a transfer HU program for SAP EWM that allows warehouse operators to scan source bin, scan HU(s), and move them to a destination bin via RF screens..."
                                    className="flex-1 min-h-[200px] text-sm resize-none font-mono"
                                />

                                {/* Example prompts */}
                                <div className="mt-3">
                                    <p className="text-xs text-muted-foreground mb-2">Quick examples:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {EXAMPLE_PROMPTS.map((ex) => (
                                            <button
                                                key={ex.label}
                                                onClick={() => setPrompt(ex.prompt)}
                                                className="text-[11px] px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-colors"
                                            >
                                                {ex.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Generate button (bottom) */}
                                <Button
                                    className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:from-emerald-600 hover:to-teal-700"
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !prompt.trim()}
                                    size="lg"
                                >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    {isGenerating ? "Generating Functional Specification..." : "Generate Functional Specification"}
                                </Button>
                            </div>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* ── Right: Preview ── */}
                    <ResizablePanel defaultSize={60} minSize={30}>
                        <TSPreview
                            markdown={fsMarkdown}
                            status={status}
                            scopeLabel="Functional Specification"
                            title="Functional Specification"
                        />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
};

export default FSWriter;
