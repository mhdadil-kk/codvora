import React, { useEffect, useRef } from 'react';
import { Language } from '../types';

declare global {
    interface Window {
        Prism: any;
        monaco: any;
        require: any;
    }
}

interface MonacoEditorProps {
    code: string;
    language: Language;
    onChange: (v: string) => void;
}

const MonacoEditor = React.memo(({
    code,
    language,
    onChange
}: MonacoEditorProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);
    const debounceRef = useRef<any>(null);
    const isTypingRef = useRef(false);
    const lastCodeRef = useRef(code);
    const onChangeRef = useRef(onChange);

    // Keep onChangeRef updated
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (!containerRef.current || !window.require) return;

        const loadMonaco = () => {
            window.require(['vs/editor/editor.main'], () => {
                if (editorRef.current) return; // Already initialized

                const monacoLang = language === 'react' ? 'javascript' :
                    language === 'nodejs' ? 'javascript' :
                        language === 'mongodb' ? 'javascript' :
                            language;

                // Optimize compiler options for performance
                if (window.monaco) {
                    const jsDefaults = window.monaco.languages.typescript.javascriptDefaults;
                    jsDefaults.setDiagnosticsOptions({
                        noSemanticValidation: true,
                        noSyntaxValidation: false,
                    });

                    if (monacoLang === 'javascript') {
                        jsDefaults.setCompilerOptions({
                            jsx: window.monaco.languages.typescript.JsxEmit.React,
                            allowNonTsExtensions: true,
                            target: window.monaco.languages.typescript.ScriptTarget.ESNext,
                            checkJs: false,
                        });
                    }
                }

                editorRef.current = window.monaco.editor.create(containerRef.current, {
                    value: code,
                    language: monacoLang,
                    theme: 'vs-dark',
                    automaticLayout: false, // We handle layout manually for better control
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                    lineNumbers: 'on',
                    roundedSelection: false,
                    padding: { top: 16, bottom: 16 },
                    renderLineHighlight: 'all',
                    scrollbar: {
                        vertical: 'visible',
                        horizontal: 'visible',
                        verticalScrollbarSize: 12,
                        horizontalScrollbarSize: 12,
                    }
                });

                // Immediate change handler for smooth typing
                editorRef.current.onDidChangeModelContent(() => {
                    const newVal = editorRef.current.getValue();
                    isTypingRef.current = true;
                    if (onChangeRef.current) {
                        onChangeRef.current(newVal);
                    }

                    // Clear typing flag after user stops typing
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    debounceRef.current = setTimeout(() => {
                        isTypingRef.current = false;
                    }, 300);
                });

                // CRITICAL FIX: Force layout updates to handle container resizing during route transitions
                // We poll for a short duration to ensure the editor snaps to the correct size once the container is stable.
                const forceLayout = () => {
                    if (editorRef.current) {
                        editorRef.current.layout();
                    }
                };

                // Immediate layout
                forceLayout();

                // Staggered layout updates to catch transition end
                setTimeout(forceLayout, 50);
                setTimeout(forceLayout, 100);
                setTimeout(forceLayout, 300);
                setTimeout(forceLayout, 500);
            });
        };

        if (typeof window.require === 'function') {
            loadMonaco();
        } else {
            const interval = setInterval(() => {
                if (typeof window.require === 'function') {
                    clearInterval(interval);
                    loadMonaco();
                }
            }, 100);
            return () => clearInterval(interval);
        }

        return () => {
            if (editorRef.current) {
                editorRef.current.dispose();
                editorRef.current = null;
            }
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []); // Empty dependency array - we want this to run ONCE per mount (key prop handles re-mounts)

    // Robust Resize Observer
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            if (editorRef.current) {
                editorRef.current.layout();
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []); // Run once to attach observer

    // Update language only (don't interfere with typing)
    useEffect(() => {
        if (editorRef.current && window.monaco) {
            const monacoLang = language === 'react' ? 'javascript' :
                language === 'nodejs' ? 'javascript' :
                    language === 'mongodb' ? 'javascript' :
                        language;

            const model = editorRef.current.getModel();
            if (model) {
                window.monaco.editor.setModelLanguage(model, monacoLang);
            }
            // Force layout update as container size might have changed (e.g. FileExplorer toggled)
            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.layout();
                }
            }, 100);
        }
    }, [language]); // Only run when language changes

    // Handle external code updates (e.g., from language switching or file switching)
    useEffect(() => {
        if (editorRef.current) {
            const currentValue = editorRef.current.getValue();
            if (code !== currentValue) {
                const position = editorRef.current.getPosition();
                editorRef.current.setValue(code);
                if (position) {
                    editorRef.current.setPosition(position);
                }
            }
        }
    }, [code]);

    return <div ref={containerRef} className="w-full h-full bg-[#1E1E1E] overflow-hidden" />;
});

export default MonacoEditor;
