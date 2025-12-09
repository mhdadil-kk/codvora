import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';

interface ConsolePanelProps {
    lines: string[];
    language: Language;
    onInput: (cmd: string) => void;
    isProcessing: boolean;
}

const ConsolePanel = ({
    lines,
    language,
    onInput,
    isProcessing
}: ConsolePanelProps) => {
    const [inputVal, setInputVal] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Determine the prompt path display
    const promptPath = language === 'mongodb' ? '>' : 'C:\\Users\\Dev\\project>';

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lines]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isProcessing) {
            onInput(inputVal);
            setInputVal('');
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0C0C0C] font-[Consolas,Monaco,monospace] text-[#CCCCCC] text-sm leading-6 border-t border-[#333] cursor-text p-4">
            <div className="flex-1 overflow-y-auto scrollbar-hide" onClick={() => document.getElementById('shell-input')?.focus()}>
                <div className="mb-4 text-gray-400 select-none">
                    {language === 'mongodb' ? 'MongoDB Shell version v5.0.3' : 'Microsoft Windows [Version 10.0.19045]'}
                    <br />(c) {new Date().getFullYear()} Corporation. All rights reserved.
                </div>

                {lines.map((line, i) => (
                    <div key={i} className="break-all whitespace-pre-wrap">
                        {line.startsWith('CMD:') ? (
                            <span className="text-[#E3E3E3]">
                                <span className="text-gray-500 mr-2 select-none">{promptPath}</span>
                                {line.replace('CMD:', '')}
                            </span>
                        ) : (
                            <span className="text-gray-300">{line}</span>
                        )}
                    </div>
                ))}

                <div className="flex items-center mt-2">
                    <span className="text-gray-500 mr-2 select-none shrink-0">{promptPath}</span>
                    <input
                        id="shell-input"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isProcessing}
                        autoFocus
                        className="flex-1 bg-transparent border-none outline-none p-0 text-[#E3E3E3] font-[inherit]"
                        autoComplete="off"
                        spellCheck="false"
                    />
                </div>
                <div ref={scrollRef} />
            </div>
        </div>
    );
};

export default ConsolePanel;
