import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Language } from '../types';
import { LANGUAGES } from '../constants.tsx';

interface LanguageSelectorProps {
    current: Language;
    onChange: (l: Language) => void;
}

const LanguageSelector = ({ current, onChange }: LanguageSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const activeLang = LANGUAGES.find(l => l.id === current);

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-[#1E1F20] hover:bg-[#2A2B2D] text-[#E3E3E3] px-3 py-2 rounded-lg transition-colors border border-[#333]"
            >
                {activeLang?.icon}
                <span className="text-sm font-medium">{activeLang?.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-[#1E1F20] border border-[#333] rounded-xl shadow-2xl z-[9999] overflow-hidden glass-panel animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                    <div className="p-1.5 space-y-0.5">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.id}
                                onClick={() => { onChange(lang.id as Language); setIsOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${current === lang.id
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'text-gray-400 hover:bg-[#2A2B2D] hover:text-white'
                                    }`}
                            >
                                <span className="shrink-0">{lang.icon}</span>
                                <span className="flex-1 text-left">{lang.label}</span>
                                {current === lang.id && <Check className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
