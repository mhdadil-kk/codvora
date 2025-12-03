import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Code2 } from 'lucide-react';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="h-screen w-full bg-[#0C0C0C] text-white font-sans selection:bg-purple-500/30 overflow-hidden relative">
            {/* Background Gradients */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 sm:px-6">
                {/* Logo */}
                <div className="mb-8">
                    <img src="/logo.png" alt="Codvora" className="h-16 sm:h-20 object-contain opacity-80" />
                </div>

                {/* 404 Text */}
                <div className="text-center mb-8">
                    <h1 className="text-8xl sm:text-9xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                        404
                    </h1>
                    <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3">
                        Page Not Found
                    </h2>
                    <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full font-semibold transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)]"
                    >
                        <Home className="w-5 h-5" />
                        <span>Go Home</span>
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#1E1F20] hover:bg-[#2A2B2D] border border-[#333] rounded-full font-medium transition-colors text-gray-300 hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Go Back</span>
                    </button>
                </div>

                {/* Footer */}
                <div className="absolute bottom-8 text-center">
                    <p className="text-sm text-gray-500">
                        Lost in code? Let's get you back on track.
                    </p>
                </div>
            </div>
        </div>
    );
}
