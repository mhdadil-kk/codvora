import React from 'react';
import { RefreshCw } from 'lucide-react';

interface BrowserPreviewProps {
    srcDoc: string;
    keyProp: number;
}

const BrowserPreview = ({ srcDoc, keyProp }: BrowserPreviewProps) => (
    <div className="flex flex-col h-full bg-white overflow-hidden">
        <div className="h-10 bg-[#f0f0f0] border-b border-[#ccc] flex items-center px-4 gap-3">
            <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#D89E24]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29]"></div>
            </div>
            <div className="flex-1 bg-white h-7 rounded flex items-center px-3 text-xs text-[#555] border border-[#ddd] shadow-sm">
                localhost:3000
            </div>
            <RefreshCw className="w-4 h-4 text-[#666]" />
        </div>
        <iframe
            key={keyProp}
            srcDoc={srcDoc}
            className="w-full flex-1 border-none bg-white"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-modals allow-popups allow-forms"
        />
    </div>
);

export default BrowserPreview;
