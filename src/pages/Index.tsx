import { useNavigate } from "react-router-dom";
import { FileCode, Zap, ArrowRight, FileText, Code, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md gradient-sap flex items-center justify-center">
              <FileCode className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">ABAP DocuGen</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/workspace")}>
              <Code className="h-3.5 w-3.5 mr-1.5" />
              TS Generator
            </Button>
            <Button size="sm" onClick={() => navigate("/fs-writer")}>
              <PenTool className="h-3.5 w-3.5 mr-1.5" />
              FS Writer
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center">
        <div className="container py-16">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-primary" />
              AI-Powered SAP Documentation Platform
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
              From <span className="text-gradient-sap">Code to Spec</span>,
              <br />From <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Idea to FS</span>
            </h1>

            <p className="text-muted-foreground text-base max-w-lg mx-auto">
              One platform for both <strong>Functional</strong> and <strong>Technical Consultants</strong>.
              Generate professional specifications with AI — from ABAP code analysis or plain-text requirements.
            </p>

            {/* Two mode cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 max-w-2xl mx-auto">
              {/* TS Generator Card */}
              <div
                className="group relative rounded-xl border bg-card p-6 text-left cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                onClick={() => navigate("/workspace")}
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg gradient-sap flex items-center justify-center shadow-md">
                      <Code className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">TS Generator</h3>
                      <p className="text-[10px] text-muted-foreground">For Technical Consultants</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Upload ABAP source files or abapGit ZIP — AI analyzes code and generates
                    a complete <strong>Technical Specification</strong> document.
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-muted-foreground mb-4">
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-primary" /> Upload .abap, .zip (abapGit)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-primary" /> SE80-like file tree
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-primary" /> Scoped analysis by package/FG
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-primary" /> Custom template support
                    </li>
                  </ul>
                  <Button size="sm" className="gradient-sap shadow-sap w-full">
                    Open TS Generator <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>

              {/* FS Writer Card */}
              <div
                className="group relative rounded-xl border bg-card p-6 text-left cursor-pointer transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5"
                onClick={() => navigate("/fs-writer")}
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                      <PenTool className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">FS Writer</h3>
                      <p className="text-[10px] text-muted-foreground">For Functional Consultants</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Describe your requirement in plain language — AI generates a professional
                    <strong> Functional Specification</strong> for developers to implement.
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-muted-foreground mb-4">
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" /> Text-to-FS generation
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" /> SAP module-aware (EWM, MM, SD…)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" /> Process area selection
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" /> Export to .docx / .md
                    </li>
                  </ul>
                  <Button size="sm" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
                    Open FS Writer <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-4 gap-4 pt-6 max-w-lg mx-auto">
              {[
                { label: "Multi-Format", desc: ".abap, .zip, .docx" },
                { label: "AI Powered", desc: "Gemini · OpenAI · Claude" },
                { label: "SAP Focused", desc: "EWM · MM · SD · PP" },
                { label: "Export Ready", desc: "Markdown · DOCX" },
              ].map((f) => (
                <div key={f.label} className="text-center">
                  <p className="text-xs font-semibold">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container text-center text-xs text-muted-foreground">
          ABAP DocuGen — Enterprise SAP Documentation Platform
        </div>
      </footer>
    </div>
  );
};

export default Index;
