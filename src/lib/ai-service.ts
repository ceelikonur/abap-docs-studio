import type { AIConfig } from "./ai-config";
import { TEMPLATE_SYSTEM_PROMPT, FS_SYSTEM_PROMPT } from "./ai-config";

// ─── Result type ─────────────────────────────────────────────────────

export interface AIAnalysisResult {
    markdown: string;
}

// ─── FS Parameters ───────────────────────────────────────────────────

export interface FSParameters {
    module: string;        // e.g. "EWM", "MM", "SD", "PP"
    processArea: string;   // e.g. "Inbound", "Outbound", "Inventory"
    complexity: string;    // "Low", "Medium", "High"
    targetSystem: string;  // e.g. "S/4HANA", "ECC 6.0"
    author: string;
    projectName: string;
}

// ─── TS Generation (code-based) ──────────────────────────────────────

export async function analyzeWithAI(
    config: AIConfig,
    abapCode: string,
    templateContent?: string
): Promise<AIAnalysisResult> {
    let systemPrompt: string;
    let userMessage: string;

    if (templateContent && templateContent.trim()) {
        systemPrompt = TEMPLATE_SYSTEM_PROMPT;
        userMessage = `## TECHNICAL SPECIFICATION TEMPLATE\n\n${templateContent}\n\n---\n\n## ABAP SOURCE CODE TO ANALYZE\n\n${abapCode}`;
    } else {
        systemPrompt = config.systemPrompt;
        userMessage = abapCode;
    }

    let markdown: string;

    switch (config.provider) {
        case "gemini":
            markdown = await callGemini(config, systemPrompt, userMessage);
            break;
        case "openai":
            markdown = await callOpenAI(config, systemPrompt, userMessage);
            break;
        case "anthropic":
            markdown = await callAnthropic(config, systemPrompt, userMessage);
            break;
        default:
            throw new Error(`Unknown AI provider: ${config.provider}`);
    }

    markdown = cleanMarkdown(markdown);
    return { markdown };
}

// ─── FS Generation (prompt-based) ────────────────────────────────────

export async function generateFSWithAI(
    config: AIConfig,
    prompt: string,
    params: FSParameters,
    templateContent?: string
): Promise<AIAnalysisResult> {
    let systemPrompt: string;

    if (templateContent && templateContent.trim()) {
        systemPrompt = FS_SYSTEM_PROMPT + `\n\nIMPORTANT: A template has been provided. Follow its structure exactly while filling it with the generated FS content.`;
    } else {
        systemPrompt = FS_SYSTEM_PROMPT;
    }

    const userMessage = `## PROJECT PARAMETERS
- **SAP Module:** ${params.module}
- **Process Area:** ${params.processArea}
- **Complexity:** ${params.complexity}
- **Target System:** ${params.targetSystem}
- **Author:** ${params.author}
- **Project:** ${params.projectName}
- **Date:** ${new Date().toISOString().split("T")[0]}

## REQUIREMENT DESCRIPTION

${prompt}

${templateContent ? `\n---\n\n## FS TEMPLATE TO FOLLOW\n\n${templateContent}` : ""}`;

    let markdown: string;

    switch (config.provider) {
        case "gemini":
            markdown = await callGemini(config, systemPrompt, userMessage);
            break;
        case "openai":
            markdown = await callOpenAI(config, systemPrompt, userMessage);
            break;
        case "anthropic":
            markdown = await callAnthropic(config, systemPrompt, userMessage);
            break;
        default:
            throw new Error(`Unknown AI provider: ${config.provider}`);
    }

    markdown = cleanMarkdown(markdown);
    return { markdown };
}

// ─── Clean up AI response ────────────────────────────────────────────

function cleanMarkdown(text: string): string {
    let result = text.trim();

    if (/^```(?:markdown|md)?\s*\n/i.test(result)) {
        result = result.replace(/^```(?:markdown|md)?\s*\n/i, "");
        result = result.replace(/\n```\s*$/, "");
    }

    return result.trim();
}

// ─── Gemini ──────────────────────────────────────────────────────────

async function callGemini(
    config: AIConfig,
    systemPrompt: string,
    userMessage: string
): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;

    const body = {
        system_instruction: {
            parts: [{ text: systemPrompt }],
        },
        contents: [
            {
                role: "user",
                parts: [{ text: userMessage }],
            },
        ],
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 16384,
        },
    };

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
            `Gemini API error (${res.status}): ${err?.error?.message || res.statusText}`
        );
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned an empty response.");
    return text;
}

// ─── OpenAI ──────────────────────────────────────────────────────────

async function callOpenAI(
    config: AIConfig,
    systemPrompt: string,
    userMessage: string
): Promise<string> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
            model: config.model,
            temperature: 0.3,
            max_tokens: 16384,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
            ],
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
            `OpenAI API error (${res.status}): ${err?.error?.message || res.statusText}`
        );
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("OpenAI returned an empty response.");
    return text;
}

// ─── Anthropic ───────────────────────────────────────────────────────

async function callAnthropic(
    config: AIConfig,
    systemPrompt: string,
    userMessage: string
): Promise<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": config.apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
            model: config.model,
            max_tokens: 16384,
            temperature: 0.3,
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
            `Anthropic API error (${res.status}): ${err?.error?.message || res.statusText}`
        );
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (!text) throw new Error("Anthropic returned an empty response.");
    return text;
}
