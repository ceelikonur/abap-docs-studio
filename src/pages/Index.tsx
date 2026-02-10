import { useNavigate } from "react-router-dom";
import { FileCode, Zap, Download, ArrowRight } from "lucide-react";
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
          <Button size="sm" onClick={() => navigate("/workspace")}>
            Start Project <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center">
        <div className="container py-20">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-primary" />
              AI-Powered Technical Specification Generator
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
              Transform <span className="text-gradient-sap">ABAP Code</span> into
              <br />Technical Specifications
            </h1>

            <p className="text-muted-foreground text-base max-w-lg mx-auto">
              Upload your ABAP source files and FS/TS templates. Our AI engine analyzes SELECT statements,
              flow logic, and data dictionary objects — then generates structured documentation automatically.
            </p>

            <div className="flex items-center justify-center gap-3">
              <Button size="lg" className="gradient-sap shadow-sap" onClick={() => navigate("/workspace")}>
                <FileCode className="h-4 w-4 mr-2" />
                Start New Project
              </Button>
              <Button size="lg" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                View Sample
              </Button>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-3 gap-4 pt-8 max-w-lg mx-auto">
              {[
                { label: "Multi-File Upload", desc: ".abap, .docx, .md" },
                { label: "AI Analysis", desc: "Powered by Gemini" },
                { label: "Export Ready", desc: "Markdown & PDF" },
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
          ABAP DocuGen — Enterprise Technical Specification Generator
        </div>
      </footer>
    </div>
  );
};

export default Index;
