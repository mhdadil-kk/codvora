import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export const CodeBlock: React.FC<{ code: string, lang: string }> = ({ code, lang }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const highlightedCode = window.Prism && window.Prism.languages[lang]
        ? window.Prism.highlight(code, window.Prism.languages[lang], lang)
        : code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    return (
        <div className="my-4 rounded-lg border border-[#444746] overflow-hidden bg-[#1E1F20] shadow-sm group/code">
            <div className="bg-[#2A2B2D] px-4 py-2 flex justify-between items-center border-b border-[#444746]">
                <span className="text-xs text-[#C4C7C5] font-mono lowercase">{lang || 'text'}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-[#C4C7C5] hover:text-white transition-colors"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[11px] font-medium">{copied ? 'Copied' : 'Copy'}</span>
                </button>
            </div>
            <div className="p-4 overflow-x-auto bg-[#1E1F20]">
                <pre
                    className={`text-sm font-mono leading-relaxed whitespace-pre language-${lang}`}
                    style={{ margin: 0, background: 'transparent', padding: 0 }}
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                />
            </div>
        </div>
    );
};

export const MarkdownText = ({ content }: { content: string }) => {
    const parseInline = (text: string) => {
        const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="bg-[#2A2B2D] text-[#E3E3E3] px-1.5 py-0.5 rounded text-[13px] font-mono border border-[#444746]">{part.slice(1, -1)}</code>;
            }
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={i} className="italic text-gray-300">{part.slice(1, -1)}</em>;
            }
            return part;
        });
    };

    const blocks = content.split(/(```[\s\S]*?```)/g);

    return (
        <div className="text-[15px] leading-7 text-[#E3E3E3] font-normal space-y-4">
            {blocks.map((block, index) => {
                if (block.startsWith('```')) {
                    const lines = block.split('\n');
                    const lang = lines[0].replace('```', '').trim();
                    const code = lines.slice(1, -1).join('\n');
                    return <CodeBlock key={index} code={code} lang={lang} />;
                }

                // Split by double newline for paragraphs
                const paragraphs = block.split(/\n\n+/);

                return (
                    <div key={index} className="space-y-4">
                        {paragraphs.map((para, pIdx) => {
                            const trimmed = para.trim();
                            if (!trimmed) return null;

                            // Header Detection
                            if (trimmed.startsWith('#')) {
                                const level = trimmed.match(/^#+/)?.[0].length || 1;
                                const text = trimmed.replace(/^#+\s*/, '');
                                const Component = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
                                const classes = level === 1 ? "text-2xl font-bold text-white mb-3"
                                    : level === 2 ? "text-xl font-bold text-white mb-2 mt-4"
                                        : "text-lg font-semibold text-white mb-2 mt-3";
                                return React.createElement(Component, { key: pIdx, className: classes }, parseInline(text));
                            }

                            // List Detection
                            const lines = trimmed.split('\n');
                            const isListBlock = lines.every(l => /^[*-] |^\d+\. /.test(l.trim()));

                            if (isListBlock || (lines.length > 1 && /^[*-] /.test(lines[0]))) {
                                return (
                                    <ul key={pIdx} className="list-disc pl-5 space-y-1 text-gray-300 marker:text-gray-500">
                                        {lines.map((line, lIdx) => {
                                            const content = line.replace(/^[*-] |^\d+\. /, '');
                                            return <li key={lIdx}>{parseInline(content)}</li>;
                                        })}
                                    </ul>
                                );
                            }

                            return <p key={pIdx}>{parseInline(trimmed)}</p>;
                        })}
                    </div>
                );
            })}
        </div>
    );
};
