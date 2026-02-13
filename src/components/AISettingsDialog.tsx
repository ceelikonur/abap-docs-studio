import { useState, useEffect } from "react";
import { Settings, Eye, EyeOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    type AIConfig,
    type AIProvider,
    DEFAULT_MODELS,
    DEFAULT_SYSTEM_PROMPT,
    PROVIDER_LABELS,
    loadAIConfig,
    saveAIConfig,
} from "@/lib/ai-config";

interface AISettingsDialogProps {
    onConfigChange?: (config: AIConfig) => void;
}

export function AISettingsDialog({ onConfigChange }: AISettingsDialogProps) {
    const [open, setOpen] = useState(false);
    const [config, setConfig] = useState<AIConfig>(loadAIConfig);
    const [showKey, setShowKey] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (open) {
            setConfig(loadAIConfig());
            setSaved(false);
        }
    }, [open]);

    const handleProviderChange = (provider: AIProvider) => {
        setConfig((prev) => ({
            ...prev,
            provider,
            model: DEFAULT_MODELS[provider],
        }));
    };

    const handleSave = () => {
        saveAIConfig(config);
        onConfigChange?.(config);
        setSaved(true);
        setTimeout(() => {
            setOpen(false);
            setSaved(false);
        }, 600);
    };

    const handleResetPrompt = () => {
        setConfig((prev) => ({ ...prev, systemPrompt: DEFAULT_SYSTEM_PROMPT }));
    };

    const isConfigured = config.apiKey.trim().length > 0;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={`relative ${!isConfigured
                            ? "border-amber-500/50 text-amber-500 hover:border-amber-400 hover:text-amber-400"
                            : ""
                        }`}
                >
                    <Settings className="h-3.5 w-3.5 mr-1.5" />
                    AI Settings
                    {!isConfigured && (
                        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        AI Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Configure your AI provider, API key, and analysis prompt.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Provider */}
                    <div className="space-y-2">
                        <Label htmlFor="ai-provider" className="text-xs font-semibold uppercase tracking-wider">
                            AI Provider
                        </Label>
                        <Select
                            value={config.provider}
                            onValueChange={(v) => handleProviderChange(v as AIProvider)}
                        >
                            <SelectTrigger id="ai-provider">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(Object.keys(PROVIDER_LABELS) as AIProvider[]).map((key) => (
                                    <SelectItem key={key} value={key}>
                                        {PROVIDER_LABELS[key]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Model */}
                    <div className="space-y-2">
                        <Label htmlFor="ai-model" className="text-xs font-semibold uppercase tracking-wider">
                            Model
                        </Label>
                        <Input
                            id="ai-model"
                            value={config.model}
                            onChange={(e) =>
                                setConfig((prev) => ({ ...prev, model: e.target.value }))
                            }
                            placeholder={DEFAULT_MODELS[config.provider]}
                            className="font-mono text-sm"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Default: {DEFAULT_MODELS[config.provider]}
                        </p>
                    </div>

                    {/* API Key */}
                    <div className="space-y-2">
                        <Label htmlFor="ai-key" className="text-xs font-semibold uppercase tracking-wider">
                            API Key
                        </Label>
                        <div className="relative">
                            <Input
                                id="ai-key"
                                type={showKey ? "text" : "password"}
                                value={config.apiKey}
                                onChange={(e) =>
                                    setConfig((prev) => ({ ...prev, apiKey: e.target.value }))
                                }
                                placeholder="Enter your API key…"
                                className="pr-10 font-mono text-sm"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setShowKey(!showKey)}
                            >
                                {showKey ? (
                                    <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                    <Eye className="h-3.5 w-3.5" />
                                )}
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Stored locally in your browser. Never sent to any server except the selected AI
                            provider.
                        </p>
                    </div>

                    {/* System Prompt */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="ai-prompt" className="text-xs font-semibold uppercase tracking-wider">
                                Analysis Prompt
                            </Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px]"
                                onClick={handleResetPrompt}
                            >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reset to Default
                            </Button>
                        </div>
                        <Textarea
                            id="ai-prompt"
                            value={config.systemPrompt}
                            onChange={(e) =>
                                setConfig((prev) => ({
                                    ...prev,
                                    systemPrompt: e.target.value,
                                }))
                            }
                            rows={12}
                            className="font-mono text-xs leading-relaxed resize-y"
                            placeholder="Enter your custom prompt for ABAP analysis…"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            This prompt is sent along with your ABAP code to the AI. Customize it to change what
                            the AI analyzes and how the output is structured.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="gradient-sap shadow-sap"
                        disabled={saved}
                    >
                        {saved ? "✓ Saved!" : "Save Settings"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
