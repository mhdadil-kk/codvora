import React, { useState } from 'react';
import { File, Plus, Trash2, FileJson, FileCode, FileType, Coffee, Code2, Atom, Database, Hexagon } from 'lucide-react';
import { Language } from '../types';

interface FileExplorerProps {
    files: Record<string, string>;
    activeFile: string;
    onFileSelect: (fileName: string) => void;
    onFileCreate: (fileName: string) => void;
    onFileDelete: (fileName: string) => void;
}

const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'js': return <FileJson className="w-4 h-4 text-yellow-400" />;
        case 'jsx': return <Atom className="w-4 h-4 text-cyan-400" />;
        case 'ts':
        case 'tsx': return <Code2 className="w-4 h-4 text-blue-400" />;
        case 'css': return <FileType className="w-4 h-4 text-blue-300" />;
        case 'html': return <Code2 className="w-4 h-4 text-orange-500" />;
        case 'py': return <FileCode className="w-4 h-4 text-blue-500" />;
        case 'java': return <Coffee className="w-4 h-4 text-orange-600" />;
        case 'cpp': return <Code2 className="w-4 h-4 text-blue-700" />;
        default: return <File className="w-4 h-4 text-gray-400" />;
    }
};

const FileExplorer: React.FC<FileExplorerProps> = ({
    files,
    activeFile,
    onFileSelect,
    onFileCreate,
    onFileDelete
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newFileName, setNewFileName] = useState('');

    const handleCreate = () => {
        if (newFileName && !files[newFileName]) {
            onFileCreate(newFileName);
            setNewFileName('');
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1E1E1E] border-r border-[#333] w-64 shrink-0">
            <div className="flex items-center justify-between p-4 border-b border-[#333]">
                <span className="text-sm font-medium text-gray-300">Explorer</span>
                <button
                    onClick={() => setIsCreating(true)}
                    className="p-1 hover:bg-[#2A2B2D] rounded text-gray-400 hover:text-white transition-colors"
                    title="New File"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {Object.keys(files).map((fileName) => (
                    <div
                        key={fileName}
                        className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeFile === fileName
                            ? 'bg-[#2A2B2D] text-white'
                            : 'text-gray-400 hover:bg-[#2A2B2D] hover:text-gray-200'
                            }`}
                        onClick={() => onFileSelect(fileName)}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            {getFileIcon(fileName)}
                            <span className="text-sm truncate">{fileName}</span>
                        </div>
                        {Object.keys(files).length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFileDelete(fileName);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                                title="Delete File"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ))}

                {isCreating && (
                    <div className="px-3 py-2">
                        <div className="flex items-center gap-2 bg-[#131314] border border-blue-500/50 rounded px-2 py-1">
                            <File className="w-3.5 h-3.5 text-gray-400" />
                            <input
                                autoFocus
                                type="text"
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreate();
                                    if (e.key === 'Escape') setIsCreating(false);
                                }}
                                onBlur={() => setIsCreating(false)}
                                placeholder="filename.js"
                                className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-600"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileExplorer;
