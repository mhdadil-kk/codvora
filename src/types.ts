import { ReactNode } from 'react';

export type Language = 'javascript' | 'python' | 'java' | 'cpp' | 'react' | 'nodejs' | 'mongodb';
export type ViewMode = 'editor' | 'quiz';

export interface ChatMessage {
    id: string;
    role: 'user' | 'model' | 'system';
    text: string;
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}
