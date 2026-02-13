import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  FileCode,
  ArrowLeft,
  Sparkles,
  Download,
  AlertCircle,
  X,
  Upload,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUploadZone } from "@/components/FileUploadZone";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { CodeViewer } from "@/components/CodeViewer";
import { TSPreview } from "@/components/TSPreview";
import { AISettingsDialog } from "@/components/AISettingsDialog";
import { ProjectMetadataDialog } from "@/components/ProjectMetadataDialog";
import { useProjectStore } from "@/hooks/useProjectStore";
import { useToast } from "@/hooks/use-toast";
import type { SE80TreeNode } from "@/lib/se80-types";
import { getFileIdsUnderNode, getScopeLabel } from "@/lib/se80-utils";

const Workspace = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const store = useProjectStore();
  const [activeTab, setActiveTab] = useState("workspace");

  // Full project generation
  const handleGenerate = () => {
    if (store.sourceFiles.length === 0) {
      toast({
        title: "No source files uploaded",
        description:
          "Upload at least one ABAP/ABP source file to generate a spec.",
        variant: "destructive",
      });
      return;
    }
    store.generateWithAI();
    toast({
      title: "Generation started",
      description: store.templateFiles.length > 0
        ? "Analyzing code using your TS template…"
        : "Analyzing all ABAP files with default format…",
    });
    setActiveTab("workspace");
  };

  // Scoped generation (from SE80 tree node)
  const handleScopeAnalyze = (node: SE80TreeNode) => {
    const fileIds = getFileIdsUnderNode(node);
    if (fileIds.length === 0) {
      toast({
        title: "No files in scope",
        description: `"${node.label}" contains no source files to analyze.`,
        variant: "destructive",
      });
      return;
    }
    const scopeLabel = getScopeLabel(node);
    store.generateWithAI(fileIds, scopeLabel);
    toast({
      title: "Scoped generation started",
      description: `Analyzing: ${scopeLabel} (${fileIds.length} file${fileIds.length > 1 ? "s" : ""})`,
    });
    // Switch to workspace tab to see results
    setActiveTab("workspace");
  };

  const hasFiles = store.files.length > 0;
  const selectedCode = store.selectedFile?.content || "";
  const selectedFileName = store.selectedFile?.name || "";

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
              <div className="h-6 w-6 rounded gradient-sap flex items-center justify-center">
                <FileCode className="h-3 w-3 text-white" />
              </div>
              <span className="font-semibold text-sm">ABAP DocuGen</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {store.zipResult && (
              <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20 flex items-center gap-1">
                <Archive className="h-3 w-3" />
                {store.zipResult.stats.abapFiles} ABAP · {store.zipResult.stats.structures} Struct · {store.zipResult.stats.functionGroups} FG · {store.zipResult.stats.classes} Class
              </span>
            )}
            {store.templateFiles.length > 0 && (
              <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                Template loaded
              </span>
            )}
            <ProjectMetadataDialog
              metadata={store.projectMetadata}
              onSave={store.setProjectMetadata}
            />
            <AISettingsDialog />
            <Button
              size="sm"
              className="gradient-sap shadow-sap"
              onClick={handleGenerate}
              disabled={
                store.status === "analyzing" || store.status === "generating"
              }
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Generate TS
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={store.status !== "done"}
              onClick={() => {
                if (store.tsMarkdown) {
                  const blob = new Blob([store.tsMarkdown], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "technical-specification.md";
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {store.error && (
        <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive flex-1">{store.error}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => store.setError(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Scope indicator */}
      {store.analysisScope && store.status === "done" && (
        <div className="bg-primary/5 border-b border-primary/20 px-4 py-1.5 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <p className="text-xs text-primary">
            Analysis scope: <span className="font-semibold">{store.analysisScope}</span>
          </p>
        </div>
      )}

      {/* Main workspace */}
      <div className="flex-1 flex min-h-0">
        <ProjectSidebar
          files={store.files}
          selectedFileId={store.selectedFileId}
          onSelectFile={store.setSelectedFileId}
          status={store.status}
          collapsed={store.sidebarCollapsed}
          onToggleCollapse={() =>
            store.setSidebarCollapsed(!store.sidebarCollapsed)
          }
          onScopeAnalyze={handleScopeAnalyze}
        />

        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-4 mt-2 w-fit">
              <TabsTrigger value="workspace" className="text-xs">
                Workspace
              </TabsTrigger>
              <TabsTrigger value="upload" className="text-xs">
                Upload Files
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workspace" className="flex-1 min-h-0 m-0">
              {hasFiles && selectedCode ? (
                <ResizablePanelGroup
                  direction="horizontal"
                  className="h-full"
                >
                  <ResizablePanel defaultSize={50} minSize={30}>
                    <CodeViewer code={selectedCode} fileName={selectedFileName} />
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={50} minSize={30}>
                    <TSPreview
                      markdown={store.tsMarkdown}
                      status={store.status}
                      scopeLabel={store.analysisScope}
                      title="Technical Specification"
                    />
                  </ResizablePanel>
                </ResizablePanelGroup>
              ) : (
                /* Empty state — prompt to upload */
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md px-8">
                    <div className="mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-6 mb-6 w-fit">
                      <Upload className="h-12 w-12 text-primary/50" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Get Started</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      Upload your <span className="text-primary font-medium">abapGit ZIP</span> or{" "}
                      <span className="text-primary font-medium">ABAP source files</span> and a{" "}
                      <span className="text-primary font-medium">TS Template</span> to generate
                      a customer-ready Technical Specification.
                    </p>
                    <div className="space-y-3 text-left mb-6">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-card border">
                        <span className="w-6 h-6 rounded-full gradient-sap text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                        <div>
                          <p className="text-sm font-medium">Upload abapGit ZIP or Source Files</p>
                          <p className="text-xs text-muted-foreground">
                            .zip (abapGit export with code + XML metadata), .abap, or individual files
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-card border">
                        <span className="w-6 h-6 rounded-full gradient-sap text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                        <div>
                          <p className="text-sm font-medium">Upload a TS Template</p>
                          <p className="text-xs text-muted-foreground">
                            .docx or .md — the AI will fill it with your code analysis
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-card border">
                        <span className="w-6 h-6 rounded-full gradient-sap text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                        <div>
                          <p className="text-sm font-medium">Generate TS</p>
                          <p className="text-xs text-muted-foreground">
                            AI fills in your template with professional code analysis
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      className="gradient-sap shadow-sap"
                      onClick={() => setActiveTab("upload")}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="upload"
              className="flex-1 min-h-0 m-0 p-4 overflow-auto"
            >
              <div className="max-w-xl mx-auto">
                <h2 className="text-lg font-semibold mb-1">Upload Files</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Upload an <strong>abapGit ZIP</strong> to import all code + metadata at once,
                  or add individual files. Templates (.docx, .md) define the output format.
                </p>
                {store.zipResult && (
                  <div className="mb-4 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Archive className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-medium text-orange-300">{store.zipFileName}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div><strong>{store.zipResult.stats.abapFiles}</strong> ABAP files</div>
                      <div><strong>{store.zipResult.stats.xmlFiles}</strong> XML metadata</div>
                      <div><strong>{store.zipResult.stats.structures}</strong> Structures</div>
                      <div><strong>{store.zipResult.stats.dataElements}</strong> Data Elements</div>
                      <div><strong>{store.zipResult.stats.functionGroups}</strong> Function Groups</div>
                      <div><strong>{store.zipResult.stats.classes}</strong> Classes</div>
                    </div>
                  </div>
                )}
                <FileUploadZone
                  files={store.files}
                  onFilesAdded={(files) => {
                    store.addFiles(files);
                  }}
                  onRemoveFile={store.removeFile}
                  onUpdateCategory={store.updateCategory}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
