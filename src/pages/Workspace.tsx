import { useNavigate } from "react-router-dom";
import { FileCode, ArrowLeft, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUploadZone } from "@/components/FileUploadZone";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { CodeViewer } from "@/components/CodeViewer";
import { TSPreview } from "@/components/TSPreview";
import { useProjectStore } from "@/hooks/useProjectStore";
import { SAMPLE_ABAP_CODE } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

const Workspace = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const store = useProjectStore();

  const handleGenerate = () => {
    if (store.files.length === 0) {
      toast({ title: "No files uploaded", description: "Upload at least one ABAP file to generate a spec.", variant: "destructive" });
      return;
    }
    store.simulateGeneration();
    toast({ title: "Generation started", description: "Analyzing your ABAP code…" });
  };

  const codeToShow = store.selectedFile?.content || SAMPLE_ABAP_CODE;
  const fileName = store.selectedFile?.name || "sample_report.abap";

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <header className="border-b bg-card/80 backdrop-blur-sm shrink-0 z-50">
        <div className="flex items-center justify-between h-12 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/")}>
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
            <Button
              size="sm"
              className="gradient-sap shadow-sap"
              onClick={handleGenerate}
              disabled={store.status === "analyzing" || store.status === "generating"}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Generate TS
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={store.status !== "done"}
              onClick={() => toast({ title: "Export coming soon", description: "Markdown export will be available in Phase 3." })}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex-1 flex min-h-0">
        <ProjectSidebar
          files={store.files}
          selectedFileId={store.selectedFileId}
          onSelectFile={store.setSelectedFileId}
          status={store.status}
          collapsed={store.sidebarCollapsed}
          onToggleCollapse={() => store.setSidebarCollapsed(!store.sidebarCollapsed)}
        />

        <div className="flex-1 min-w-0">
          <Tabs defaultValue="workspace" className="h-full flex flex-col">
            <TabsList className="mx-4 mt-2 w-fit">
              <TabsTrigger value="workspace" className="text-xs">Workspace</TabsTrigger>
              <TabsTrigger value="upload" className="text-xs">Upload Files</TabsTrigger>
            </TabsList>

            <TabsContent value="workspace" className="flex-1 min-h-0 m-0">
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={50} minSize={30}>
                  <CodeViewer code={codeToShow} fileName={fileName} />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={30}>
                  <TSPreview sections={store.tsSections} status={store.status} />
                </ResizablePanel>
              </ResizablePanelGroup>
            </TabsContent>

            <TabsContent value="upload" className="flex-1 min-h-0 m-0 p-4 overflow-auto">
              <div className="max-w-xl mx-auto">
                <h2 className="text-lg font-semibold mb-1">Upload Files</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Add your ABAP source files and TS/FS templates to begin analysis.
                </p>
                <FileUploadZone
                  files={store.files}
                  onFilesAdded={store.addFiles}
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
