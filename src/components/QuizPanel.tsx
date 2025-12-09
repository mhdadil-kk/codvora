import React from 'react';
import { Trophy, Loader2, Flame } from 'lucide-react';
import { MarkdownText } from './ChatHelpers';
import { QuizQuestion } from '../types';

interface QuizPanelProps {
    questions: QuizQuestion[];
    currentIndex: number;
    score: number;
    answers: number[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    isGenerating: boolean;
    hasSelectedDifficulty: boolean;
    onDifficultySelect: (diff: 'beginner' | 'intermediate' | 'advanced') => void;
    onStartQuiz: () => void;
    onAnswer: (index: number) => void;
    onExit: () => void;
}

const QuizPanel = ({
    questions,
    currentIndex,
    score,
    answers,
    difficulty,
    isGenerating,
    hasSelectedDifficulty,
    onDifficultySelect,
    onStartQuiz,
    onAnswer,
    onExit
}: QuizPanelProps) => {
    return (
        <div className="flex-1 bg-[#1E1E1E] p-8 flex flex-col items-center justify-center overflow-y-auto">
            <div className="max-w-2xl w-full">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        <span>Skill Assessment</span>
                    </h2>
                    <button
                        onClick={onExit}
                        className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 hover:border-red-500 text-red-400 hover:text-red-300 rounded-lg font-semibold transition-all hover:scale-105"
                    >
                        Exit Quiz
                    </button>
                </div>

                {questions.length === 0 ? (
                    <div className="text-center bg-[#2A2B2D] p-8 rounded-2xl border border-[#333]">
                        {/* Difficulty Selection */}
                        <div className="mb-4">
                            <h3 className="text-lg text-white font-semibold mb-3">Choose difficulty</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {(['beginner', 'intermediate', 'advanced'] as const).map((id) => (
                                    <button
                                        key={id}
                                        onClick={() => onDifficultySelect(id)}
                                        className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${difficulty === id
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                            : 'bg-[#1E1E1E] text-gray-300 hover:bg-[#333]'
                                            }`}
                                    >
                                        {id.charAt(0).toUpperCase() + id.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <button
                                disabled={!hasSelectedDifficulty || isGenerating}
                                onClick={onStartQuiz}
                                className={`mt-4 w-full px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${hasSelectedDifficulty && !isGenerating
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white'
                                    : 'bg-[#1E1E1E] text-gray-500 border border-[#333] cursor-not-allowed'
                                    }`}
                            >
                                {isGenerating ? 'Preparing…' : `Start ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz`}
                            </button>
                        </div>
                        {isGenerating ? (
                            <div className="mt-2 flex items-center justify-center gap-2 text-gray-400">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                <span className="text-sm">Generating {difficulty} questions…</span>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">Select a level and press Start.</p>
                        )}
                    </div>
                ) : questions.length > 0 && currentIndex < questions.length ? (
                    <div className="bg-[#2A2B2D] p-8 rounded-2xl border border-[#333] shadow-xl max-h-[70vh] overflow-y-auto">
                        <div className="mb-6">
                            <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">Question {currentIndex + 1}/{questions.length}</span>
                            <div className="mt-3 max-h-[40vh] overflow-y-auto pr-2">
                                <MarkdownText content={questions[currentIndex].question} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            {questions[currentIndex].options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onAnswer(idx)}
                                    className="w-full text-left p-4 rounded-xl bg-[#1E1E1E] hover:bg-[#333] text-gray-300 hover:text-white transition-all border border-transparent hover:border-gray-500"
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#2A2B2D] rounded-2xl border border-[#333] overflow-hidden">
                        {/* Quiz Review Section */}
                        <div className="p-8 max-h-[80vh] overflow-y-auto">
                            {/* Header with Inline Score Card */}
                            <div className="flex items-start justify-between gap-6 mb-8">
                                <div className="flex-1">
                                    <h3 className="text-3xl font-bold text-white mb-2">Answer Review</h3>
                                    <p className="text-gray-400">Review your answers and learn from the correct solutions</p>
                                </div>

                                {/* Compact Score Card */}
                                <div className="flex-shrink-0 bg-gradient-to-br from-[#1E1F20] to-[#2A2B2D] border-2 border-[#333] rounded-xl shadow-xl p-4 min-w-[200px]">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                                            <Flame className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Quiz Complete</div>
                                            <div className="text-lg font-bold text-white">{score}/{questions.length}</div>
                                        </div>
                                    </div>
                                    <div className={`text-center px-3 py-2 rounded-lg ${(score / questions.length) >= 0.8 ? 'bg-green-500/20 text-green-400' :
                                        (score / questions.length) >= 0.6 ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-red-500/20 text-red-400'
                                        }`}>
                                        <div className="text-2xl font-bold">{Math.round((score / questions.length) * 100)}%</div>
                                        <div className="text-xs opacity-80">Score</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {questions.map((q, qIdx) => {
                                    const userAnswer = answers[qIdx];
                                    const isCorrect = userAnswer === q.correctIndex;

                                    return (
                                        <div key={qIdx} className="rounded-xl bg-[#1E1E1E] border-2 border-[#333] overflow-hidden hover:border-[#444] transition-colors">
                                            {/* Question Header */}
                                            <div className={`p-4 border-b-2 ${isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isCorrect
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-red-500 text-white'
                                                        }`}>
                                                        {isCorrect ? '✓' : '✗'}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs uppercase font-bold tracking-wider text-gray-400">Question {qIdx + 1}</div>
                                                        <div className={`text-sm font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                                            {isCorrect ? 'Correct Answer' : 'Incorrect Answer'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Question Content */}
                                            <div className="p-6">
                                                <div className="mb-6 text-base leading-relaxed">
                                                    <MarkdownText content={q.question} />
                                                </div>

                                                {/* Answer Options */}
                                                <div className="space-y-3">
                                                    {q.options.map((opt, optIdx) => {
                                                        const isUserAnswer = userAnswer === optIdx;
                                                        const isCorrectAnswer = q.correctIndex === optIdx;

                                                        return (
                                                            <div
                                                                key={optIdx}
                                                                className={`relative p-4 rounded-lg border-2 transition-all ${isCorrectAnswer
                                                                    ? 'bg-green-500/10 border-green-500 shadow-lg shadow-green-500/20'
                                                                    : isUserAnswer
                                                                        ? 'bg-red-500/10 border-red-500 shadow-lg shadow-red-500/20'
                                                                        : 'bg-[#131314] border-[#2A2B2D]'
                                                                    }`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    {/* Option Letter */}
                                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isCorrectAnswer
                                                                        ? 'bg-green-500 text-white'
                                                                        : isUserAnswer
                                                                            ? 'bg-red-500 text-white'
                                                                            : 'bg-[#2A2B2D] text-gray-400'
                                                                        }`}>
                                                                        {String.fromCharCode(65 + optIdx)}
                                                                    </div>

                                                                    {/* Option Content */}
                                                                    <div className="flex-1">
                                                                        <div className={`font-medium ${isCorrectAnswer
                                                                            ? 'text-green-200'
                                                                            : isUserAnswer
                                                                                ? 'text-red-200'
                                                                                : 'text-gray-300'
                                                                            }`}>
                                                                            {opt}
                                                                        </div>

                                                                        {/* Status Labels */}
                                                                        {isCorrectAnswer && (
                                                                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/20 text-green-400 text-xs font-bold">
                                                                                <span>✓</span>
                                                                                <span>CORRECT ANSWER</span>
                                                                            </div>
                                                                        )}
                                                                        {isUserAnswer && !isCorrectAnswer && (
                                                                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/20 text-red-400 text-xs font-bold">
                                                                                <span>✗</span>
                                                                                <span>YOUR ANSWER</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizPanel;
