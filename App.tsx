import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Terminal, Play, Bot, Code2, Sparkles, Trophy,
  MessageSquare, Plus, Wand2,
  Mic, Send, Loader2, Eraser,
  GripHorizontal, BookOpen, Briefcase, BrainCircuit, Layers, Trash2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { BrowserRouter, Routes, Route, useParams, useNavigate, Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import Documentation from './Documentation';
import NotFound from './NotFound';

import { Language, ViewMode, ChatMessage, QuizQuestion } from './src/types';
import { INITIAL_CODE } from './src/constants.tsx';
import MonacoEditor from './src/components/MonacoEditor';
import BrowserPreview from './src/components/BrowserPreview';
import ConsolePanel from './src/components/ConsolePanel';
import { MarkdownText } from './src/components/ChatHelpers';
import LanguageSelector from './src/components/LanguageSelector';
import QuizPanel from './src/components/QuizPanel';
import { formatCode, isFormatSupported } from './src/utils/formatter';
import FileExplorer from './src/components/FileExplorer';

// --- Editor Wrapper Component ---

function EditorWrapper() {
  const { lang } = useParams<{ lang?: string }>();
  const navigate = useNavigate();

  // Validate language from URL
  const validLanguages = ['javascript', 'python', 'java', 'cpp', 'react', 'nodejs', 'mongodb'];
  const initialLanguage = (lang && validLanguages.includes(lang)) ? lang as Language : 'javascript';

  return <CodeEditor initialLanguage={initialLanguage} navigate={navigate} />;
}

// --- Main Code Editor Component ---

function CodeEditor({ initialLanguage, navigate }: { initialLanguage: Language, navigate: any }) {
  // State
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [mobileTab, setMobileTab] = useState<'code' | 'output' | 'chat'>('code');

  // Multi-file state
  const getDefaultFilename = (lang: Language) => {
    switch (lang) {
      case 'javascript': return 'main.js';
      case 'python': return 'main.py';
      case 'java': return 'Main.java';
      case 'cpp': return 'main.cpp';
      case 'react': return 'App.jsx';
      case 'nodejs': return 'index.js';
      case 'mongodb': return 'query.js';
      default: return 'main.txt';
    }
  };

  const [files, setFiles] = useState<Record<string, string>>({
    [getDefaultFilename(initialLanguage)]: INITIAL_CODE[initialLanguage]
  });
  const [activeFile, setActiveFile] = useState<string>(getDefaultFilename(initialLanguage));

  const [output, setOutput] = useState<string[]>([]);
  const [reactSrcDoc, setReactSrcDoc] = useState<string>('');
  const [renderKey, setRenderKey] = useState(0);

  // Update Document Title for SEO
  useEffect(() => {
    if (language) {
      const langName = language.charAt(0).toUpperCase() + language.slice(1);
      document.title = `${langName} Online Compiler - Codvora AI`;
    } else {
      document.title = "Codvora - AI-Powered Online Compiler";
    }
  }, [language]);

  // Sync language with URL parameter changes
  useEffect(() => {
    if (initialLanguage !== language) {
      setLanguage(initialLanguage);
    }
  }, [initialLanguage, language]);

  // Load initial history from localStorage
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('codelab_chat_history');
      return saved ? JSON.parse(saved) : [{ id: 'init', role: 'model', text: "Welcome to **CodeLab**. \\n\\nI am your CodeLab companion. How can I assist you in your engineering journey today?" }];
    } catch {
      return [{ id: 'init', role: 'model', text: "Welcome to **CodeLab**. \\n\\nI am your CodeLab companion. How can I assist you in your engineering journey today?" }];
    }
  });

  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const [xp, setXp] = useState(150);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizScore, setQuizScore] = useState(0);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizDifficulty, setQuizDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]); // Track user's answers
  const [hasSelectedDifficulty, setHasSelectedDifficulty] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Resizing State
  const [splitRatio, setSplitRatio] = useState(40); // Chat Width %
  const [verticalSplit, setVerticalSplit] = useState(70); // Editor Height %
  const [resizingDir, setResizingDir] = useState<'horizontal' | 'vertical' | null>(null);

  // UI State
  const containerRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorContentRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Local MongoDB Simulation State
  const mongoRef = useRef<any>({
    'production_db': {
      'products': [
        { _id: '64f1a2b3', name: "Gaming Laptop", price: 1299, tags: ["tech"] },
        { _id: '64f1a2b4', name: "Wireless Mouse", price: 49, tags: ["accessory"] }
      ],
      'users': [
        { _id: '64f1a2b5', username: "admin_user", role: "admin" }
      ]
    },
    'test': {}
  });
  const currentDbRef = useRef<string>('production_db');

  // Track active intervals for cleanup
  const activeIntervals = useRef<number[]>([]);
  const workerRef = useRef<Worker | null>(null);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Run Code: Ctrl + Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('run-button')?.click();
      }
      // Format Code: Shift + Alt + F
      if (e.shiftKey && e.altKey && e.key === 'f') {
        e.preventDefault();
        handleFormat();
      }
      // Clear Console: Ctrl + L
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        setOutput([]);
      }
      // Toggle Chat: Ctrl + B
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSplitRatio(prev => prev < 5 ? 40 : 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files, activeFile, language]);
  // Actually, best to define handleFormat inside the component or use refs. 
  // Since handleFormat depends on 'code' and 'language', we need to include them or use refs.
  // But 'handleKeyDown' is defined inside the component, so it captures the scope.
  // However, the effect has [] deps, so it captures INITIAL state.
  // We need to update the effect deps or use refs.
  // Let's use refs for code/language in the effect or just add them to deps.
  // Adding them to deps means re-attaching listener on every keystroke which is bad.
  // Better to use refs for current state in event handlers.
  // For now, I'll just add the button and not the shortcut to avoid complexity, or use a ref-based approach.
  // Let's stick to just the button for now to be safe and simple.


  // Effects
  // Save Chat History to LocalStorage
  useEffect(() => {
    localStorage.setItem('codelab_chat_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  // Batch language change with code update to prevent flicker
  useEffect(() => {
    const newCode = INITIAL_CODE[language];
    const newFilename = getDefaultFilename(language);
    setFiles({ [newFilename]: newCode });
    setActiveFile(newFilename);
    setOutput([]);
    if (language === 'react') {
      const doc = generateReactTemplate(newCode);
      setReactSrcDoc(doc);
    }
  }, [language]);

  // Resizing Logic
  const resizingState = useRef<{ startX: number, startY: number, startRatio: number, containerSize: number } | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const startResizing = useCallback((e: React.MouseEvent, dir: 'horizontal' | 'vertical') => {
    e.preventDefault();
    setResizingDir(dir);

    if (dir === 'horizontal' && containerRef.current) {
      const width = containerRef.current.getBoundingClientRect().width;
      resizingState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startRatio: splitRatio,
        containerSize: width > 0 ? width : window.innerWidth
      };
    } else if (dir === 'vertical' && editorContentRef.current) {
      const height = editorContentRef.current.getBoundingClientRect().height;
      resizingState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startRatio: verticalSplit,
        containerSize: height > 0 ? height : window.innerHeight
      };
    }
  }, [splitRatio, verticalSplit]);

  useEffect(() => {
    if (!resizingDir) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingState.current) return;

      // Cancel any pending frame to avoid stacking
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }

      animationFrameId.current = requestAnimationFrame(() => {
        if (!resizingState.current) return; // Double check inside frame

        if (resizingDir === 'horizontal') {
          const deltaX = e.clientX - resizingState.current.startX;
          const deltaRatio = (deltaX / resizingState.current.containerSize) * 100;
          let newRatio = resizingState.current.startRatio + deltaRatio;
          newRatio = Math.min(60, Math.max(20, newRatio));
          setSplitRatio(newRatio);
        } else if (resizingDir === 'vertical') {
          const deltaY = e.clientY - resizingState.current.startY;
          const deltaRatio = (deltaY / resizingState.current.containerSize) * 100;
          let newRatio = resizingState.current.startRatio + deltaRatio;
          newRatio = Math.min(85, Math.max(15, newRatio));
          setVerticalSplit(newRatio);
        }
      });
    };

    const handleMouseUp = () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      setResizingDir(null);
      resizingState.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingDir]);

  const clearChat = () => {
    setIsClearModalOpen(true);
  };

  const confirmClearChat = () => {
    const initMsg: ChatMessage[] = [{ id: 'init', role: 'model', text: "Welcome to **Codvora**. \\n\\nI am your Codvora companion. How can I assist you in your engineering journey today?" }];
    setChatHistory(initMsg);
    setIsClearModalOpen(false);
  };

  const getAI = () => {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    console.log('API Key check:', key ? 'Found (length: ' + key.length + ')' : 'Missing');
    if (!key) {
      console.error("Missing API Key. Please add VITE_GEMINI_API_KEY to your .env.local file");
      return null;
    }
    return new GoogleGenAI({ apiKey: key });
  };

  const generateReactTemplate = (codeToRender: string) => {
    let processedCode = codeToRender.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');
    if (processedCode.includes('export default')) {
      processedCode = processedCode.replace(/export\s+default\s+/g, 'window.App = ');
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.development.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.development.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>
          <style>
            body { margin: 0; font-family: 'Inter', sans-serif; background: #fff; overflow: hidden; }
            .error-overlay {
                position: fixed; top: 0; left: 0; right: 0; bottom: 0; padding: 20px;
                background: #fee2e2; color: #b91c1c; font-family: monospace;
                z-index: 9999; white-space: pre-wrap; overflow: auto;
            }
            .loader {
                height: 100vh; display: flex; flex-direction: column; 
                align-items: center; justify-content: center; color: #9ca3af;
            }
            .spinner {
                width: 24px; height: 24px; border: 2px solid #e5e7eb;
                border-top-color: #3b82f6; border-radius: 50%;
                animation: spin 1s linear infinite; margin-bottom: 8px;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div id="root"><div class="loader"><div class="spinner"></div></div></div>
          <script id="user-code" type="text/plain">${processedCode}</script>
          <script>
            function showError(title, message) {
               const errDiv = document.createElement('div');
               errDiv.className = 'error-overlay';
               errDiv.innerHTML = '<strong>' + title + ':</strong><br/>' + message;
               document.body.appendChild(errDiv);
            }
            window.onerror = function(message, source, lineno, colno, error) {
               showError('Runtime Error', message);
               return true;
            };
            const { useState, useEffect, useRef, useMemo, useCallback } = React;
            try {
              const userCode = document.getElementById('user-code').textContent;
              const compiled = Babel.transform(userCode, { presets: ['react', 'env'], filename: 'main.jsx' }).code;
              eval(compiled);
              const root = ReactDOM.createRoot(document.getElementById('root'));
              let ComponentToRender = window.App || App;
              if (ComponentToRender) {
                root.render(React.createElement(ComponentToRender));
              } else {
                 throw new Error("Main component 'App' not found.");
              }
            } catch (err) {
              showError('Build Error', err.message);
            }
          </script>
        </body>
        </html>
      `;
  };

  const runCode = async () => {
    setIsRunning(true);
    setXp(prev => prev + 5);
    setRenderKey(k => k + 1);
    setOutput([]); // Clear previous output

    if (language === 'react') {
      const doc = generateReactTemplate(files[activeFile]);
      setReactSrcDoc(doc);
      setIsRunning(false);
      return;
    }

    if (language === 'javascript') {
      // Terminate previous worker if exists
      if (workerRef.current) {
        workerRef.current.terminate();
      }

      const workerScript = `
        self.onmessage = function(e) {
          const code = e.data;
          
          const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB per message
          const MAX_MESSAGES = 100; // Max 100 log calls
          let messageCount = 0;
          
          const format = (arg) => {
            if (arg === undefined) return 'undefined';
            if (arg === null) return 'null';
            if (typeof arg === 'object') {
              try { 
                const str = JSON.stringify(arg, null, 2);
                // Truncate large objects
                if (str.length > MAX_OUTPUT_SIZE) {
                  return str.substring(0, MAX_OUTPUT_SIZE) + '\\\\n... [Output truncated - too large]';
                }
                return str;
              } 
              catch(e) { return String(arg); }
            }
            const str = String(arg);
            // Truncate large strings
            if (str.length > MAX_OUTPUT_SIZE) {
              return str.substring(0, MAX_OUTPUT_SIZE) + '\\\\n... [Output truncated - ' + str.length + ' characters total]';
            }
            return str;
          };

          const log = (level, args) => {
            messageCount++;
            if (messageCount > MAX_MESSAGES) {
              if (messageCount === MAX_MESSAGES + 1) {
                self.postMessage({ type: 'output', level, content: '⚠️ Output limit reached (100 messages). Further output suppressed.' });
              }
              return;
            }
            
            const msg = args.map(format).join(' ');
            self.postMessage({ type: 'output', level, content: msg });
          };

          const consoleProxy = {
            log: (...args) => log('log', args),
            error: (...args) => log('error', args),
            warn: (...args) => log('warn', args),
            info: (...args) => log('info', args)
          };

          try {
            const fn = new Function('console', code);
            fn(consoleProxy);
            self.postMessage({ type: 'done' });
          } catch (e) {
            self.postMessage({ type: 'error', content: e.toString() });
          }
        };
      `;

      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      workerRef.current = worker;

      // Hard timeout of 10 seconds
      const timeoutId = setTimeout(() => {
        if (workerRef.current === worker) {
          worker.terminate();
          workerRef.current = null;
          setOutput(prev => [...prev, "\\n⚠️ Error: Time Limit Exceeded (10s)"]);
          setIsRunning(false);
        }
      }, 10000);

      worker.onmessage = (e) => {
        const { type, content } = e.data;
        if (type === 'output') {
          setOutput(prev => {
            if (prev.length > 1000) return prev;
            return [...prev, content];
          });
        } else if (type === 'error') {
          setOutput(prev => [...prev, "Runtime Error: " + content]);
          setIsRunning(false);
          clearTimeout(timeoutId);
        } else if (type === 'done') {
          setIsRunning(false);
          clearTimeout(timeoutId);
        }
      };

      worker.onerror = (e) => {
        setOutput(prev => [...prev, "Worker Error: " + e.message]);
        setIsRunning(false);
        clearTimeout(timeoutId);
      };

      worker.postMessage(files[activeFile]);
      return;
    }

    const ai = getAI();
    if (!ai) { setIsRunning(false); return; }

    try {
      // Construct project context from all files
      const projectContext = Object.entries(files)
        .map(([name, content]) => `--- ${name} ---\n${content}`)
        .join('\n\n');

      let prompt = "";
      if (language === 'mongodb') {
        prompt = `Simulate MongoDB Shell. DB: 'production_db'. User Script:\n${files[activeFile]}\nReturn text output only.`;
      } else if (language === 'nodejs') {
        prompt = `Simulate Node.js console.\n\nProject Files:\n${projectContext}\n\nExecute the entry point '${activeFile}'.\nIf the file is empty, output nothing.\nIf there is code, return the stdout/stderr.\nIMPORTANT: Return ONLY the raw output text. Do NOT wrap in markdown blocks.`;
      } else {
        prompt = `Act as a ${language} compiler.\n\nProject Files:\n${projectContext}\n\nCompile and run the entry point '${activeFile}'.\nReturn ONLY the output (stdout/stderr). Do NOT wrap in markdown blocks.`;
      }

      // 15s Timeout for AI
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Time Limit Exceeded (15s)")), 15000)
      );

      const result: any = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        }),
        timeoutPromise
      ]);

      const rawText = result.text || "";
      // Remove markdown code blocks if present, but keep content
      const cleanText = rawText.replace(/^```\w*\n|```$/gm, '').trim();
      setOutput([`CMD: Executing ${language}...`, ...cleanText.split('\n')]);
    } catch (e: any) {
      setOutput([`Error: ${e.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleShellCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    const rawCmd = cmd.trim();
    setOutput(prev => [...prev, `CMD:${rawCmd}`]);

    // 1. FAST LOCAL PATH for MongoDB (Instant Response)
    if (language === 'mongodb') {
      try {
        // switch db
        if (rawCmd.startsWith('use ')) {
          const db = rawCmd.split(' ')[1];
          currentDbRef.current = db;
          setOutput(p => [...p, `switched to db ${db}`]);
          return;
        }
        // show dbs
        if (rawCmd === 'show dbs') {
          setOutput(p => [...p, Object.keys(mongoRef.current).join('\\n')]);
          return;
        }
        // show collections
        if (rawCmd === 'show collections') {
          const db = mongoRef.current[currentDbRef.current] || {};
          setOutput(p => [...p, Object.keys(db).join('\\n')]);
          return;
        }
        // db.collection.find()
        const findMatch = rawCmd.match(/db\.(\w+)\.find\(\)/);
        if (findMatch) {
          const col = findMatch[1];
          const data = mongoRef.current[currentDbRef.current]?.[col] || [];
          setOutput(p => [...p, JSON.stringify(data, null, 2)]);
          return;
        }
        // db.collection.insertOne({...})
        const insertMatch = rawCmd.match(/db\.(\w+)\.insertOne\((.+)\)/);
        if (insertMatch) {
          const col = insertMatch[1];
          // Safe eval for simulation only
          // eslint-disable-next-line no-new-func
          const obj = new Function(`return ${insertMatch[2]}`)();
          if (!obj._id) obj._id = Math.random().toString(36).substring(7);

          if (!mongoRef.current[currentDbRef.current]) mongoRef.current[currentDbRef.current] = {};
          if (!mongoRef.current[currentDbRef.current][col]) mongoRef.current[currentDbRef.current][col] = [];

          mongoRef.current[currentDbRef.current][col].push(obj);
          setOutput(p => [...p, JSON.stringify({ acknowledged: true, insertedId: obj._id }, null, 2)]);
          return;
        }
      } catch (e) {
        // If local parsing fails, ignore and let AI handle it
      }
    }

    // 2. Fallback to AI for complex queries or Node.js (Standard Latency)
    setIsRunning(true);
    const ai = getAI();
    if (!ai) { setIsRunning(false); return; }
    try {
      const prompt = language === 'mongodb'
        ? `MongoDB shell simulator. Input: "${rawCmd}". Context: 'products', 'users' collections. Return raw text output.`
        : `Node.js REPL simulator. Input: "${rawCmd}". Return raw text result.`;

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      setOutput(prev => [...prev, result.text?.replace(/```/g, '').trim() || ""]);
    } catch (e) {
      setOutput(prev => [...prev, "Connection Error"]);
    } finally {
      setIsRunning(false);
    }
  };

  const sendMessage = async (msgText?: string) => {
    const textToSend = msgText || chatInput;
    if (!textToSend.trim()) return;

    setChatHistory(p => [...p, { id: Date.now().toString(), role: 'user', text: textToSend }]);
    setChatInput('');
    setIsChatLoading(true);

    const ai = getAI();
    if (!ai) { setIsChatLoading(false); return; }

    try {
      const projectContext = Object.entries(files)
        .map(([name, content]) => `--- ${name} ---\n${content}`)
        .join('\n\n');

      const prompt = `
        Act as a Senior Software Architect and Career Mentor.
        Current Language Context: ${language}.
        User Message: "${textToSend}".
        
        Current Project Files:
        ${projectContext}
        
        Instructions:
        1. If the user asks to fix/debug code, provide the solution and explain the fix.
        2. If the user asks a concept question (e.g. "Explain closures", "Mock Interview"), IGNORE the current code and teach the concept deeply using structured Markdown.
        3. Use **Bold** for key terms and Headers (###) for sections.
        4. Always use code blocks with the correct language tag (e.g. \`\`\`javascript).
      5. Be professional, concise, and helpful.
      `;

      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      setChatHistory(p => [...p, { id: (Date.now() + 1).toString(), role: 'model', text: res.text || "No response." }]);
    } catch (e) {
      setChatHistory(p => [...p, { id: 'err', role: 'model', text: "I'm having trouble connecting. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const generateQuiz = async (level?: 'beginner' | 'intermediate' | 'advanced') => {
    setViewMode('quiz');
    setQuizQuestions([]);
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setQuizAnswers([]);

    const ai = getAI();
    if (!ai) {
      setQuizQuestions([]);
      return;
    }

    try {
      const difficultyPrompts = {
        beginner: `You are creating a quiz for ${language} beginners.Generate 5 diverse multiple - choice questions:
      - 2 fundamental concept questions(e.g., "What is a variable?", "How does a loop work?")
        - 1 basic syntax question with simple code
          - 1 best practices question for beginners
            - 1 common mistake / debugging question`,

        intermediate: `You are creating interview questions for ${language} developers with 1 - 2 years experience.Generate 5 diverse questions:
      - 1 theoretical concept(closures, scope, async patterns, OOP principles)
        - 1 code output prediction(what will this code log /return?)
      - 1 best practices / design pattern question
        - 1 debugging scenario or problem - solving
          - 1 language feature question(APIs, built -in methods, advanced syntax)`,

        advanced: `You are creating senior - level interview questions for ${language} experts.Generate 5 challenging questions:
      - 1 architectural / design question(scalability, patterns, trade - offs)
        - 1 performance optimization or memory management
          - 1 complex code analysis with edge cases
            - 1 deep language internals question
              - 1 real - world production scenario`
      };

      const chosen = level ?? quizDifficulty;
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${difficultyPrompts[chosen]}
        
        Return ONLY valid JSON in this exact format:
      [
        {
          "question": "Question text here (can include code blocks with \`\`\`${language})?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctIndex": 0
        }
      ]
        
        Make questions diverse, practical, and interview - realistic.Vary question types - not all should be code output questions.`,
        config: { responseMimeType: 'application/json' }
      });

      const parsed = JSON.parse(res.text || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        setQuizQuestions(parsed);
      } else {
        throw new Error("Invalid quiz format");
      }
    } catch (e) {
      console.error('Quiz generation error:', e);
      // Fallback: provide a sample question if AI fails
      setQuizQuestions([{
        question: "Unable to generate quiz. Please check your API key and try again.",
        options: ["Retry", "Exit", "", ""],
        correctIndex: 0
      }]);
    }
  };

  const handleFormat = async () => {
    if (!isFormatSupported(language)) return;
    const formatted = await formatCode(files[activeFile], language);
    setFiles(prev => ({ ...prev, [activeFile]: formatted }));
  };

  const renderChat = () => (
    <div className="flex-1 h-full w-full flex flex-col bg-[#131314] relative">
      {/* Header */}
      <div className="h-16 sm:h-20 border-b border-[#333] flex items-center justify-between px-3 sm:px-6 bg-[#131314] shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-80 transition-opacity" aria-label="Go to Home">
            <img src="/logo.png" alt="Codvora" className="h-10 sm:h-11 md:h-12 object-contain" />
          </button>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full bg-[#1E1F20] border border-[#333]">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] sm:text-xs text-gray-400 font-medium hidden sm:inline">Online</span>
          </div>
          <button
            onClick={clearChat}
            className="text-gray-500 hover:text-red-400 transition-colors p-1 sm:p-0"
            title="Clear Chat History"
            aria-label="Clear Chat History"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scrollbar-thin">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#888] space-y-4 opacity-50">
            <Bot className="w-12 h-12 mb-2" />
            <p>Start a conversation...</p>
          </div>
        )}

        {/* Quick Actions (Only show if history is just init msg) */}
        {chatHistory.length === 1 && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { icon: <BrainCircuit className="text-purple-400" />, label: "System Design", prompt: "Teach me System Design basics" },
              { icon: <Briefcase className="text-blue-400" />, label: "Mock Interview", prompt: "Start a mock interview for a Senior Dev role" },
              { icon: <BookOpen className="text-green-400" />, label: "Explain Concept", prompt: "Explain a complex concept in simple terms" },
              { icon: <Layers className="text-orange-400" />, label: "Code Review", prompt: "Review my code for best practices" }
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => sendMessage(action.prompt)}
                className="flex items-center gap-3 p-4 bg-[#1E1F20] hover:bg-[#2A2B2D] border border-[#333] rounded-xl transition-all text-left group"
              >
                <div className="p-2 bg-[#131314] rounded-lg group-hover:scale-110 transition-transform">{action.icon}</div>
                <span className="text-sm text-gray-300 font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        )}

        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} `}>
            {msg.role !== 'user' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-4 shadow-lg shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max - w - [90 %] ${msg.role === 'user' ? 'bg-[#2A2B2D] rounded-2xl px-5 py-3 shadow-md border border-[#333]' : ''} `}>
              <MarkdownText content={msg.text} />
            </div>
          </div>
        ))}
        {isChatLoading && (
          <div className="flex items-center gap-2 text-gray-500 ml-12 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 pt-2 bg-gradient-to-t from-[#131314] to-transparent">
        <div className="bg-[#1E1F20] rounded-full flex items-center px-2 py-2 gap-2 border border-[#333] shadow-xl focus-within:border-[#555] transition-colors">
          <button className="p-2 hover:bg-[#2A2B2D] rounded-full cursor-pointer text-gray-400 transition-colors" aria-label="Add Attachment"><Plus className="w-5 h-5" /></button>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask anything to your architect..."
            className="flex-1 bg-transparent outline-none text-[15px] text-white placeholder:text-gray-500 px-2"
          />
          <button className="p-2 hover:bg-[#2A2B2D] rounded-full cursor-pointer text-gray-400" aria-label="Voice Input"><Mic className="w-5 h-5" /></button>
          <button
            onClick={() => sendMessage()}
            className={`p-2 rounded-full transition-all duration-200 ${chatInput.trim() ? 'bg-[#E3E3E3] text-black cursor-pointer hover:scale-105' : 'bg-[#2A2B2D] text-gray-500 cursor-default'}`}
            aria-label="Send Message"
            disabled={!chatInput.trim()}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center mt-3">
          <span className="text-[11px] text-gray-600">Gemini can make mistakes, so double-check it.</span>
        </div>
      </div>
    </div>
  );

  const renderEditor = () => (
    <div className="flex-1 h-full w-full flex flex-col bg-[#1E1E1E] relative" ref={editorContainerRef}>
      {/* Toolbar - Standard Dark */}
      <div className="h-16 sm:h-20 border-b border-[#333] flex items-center justify-between px-3 sm:px-6 bg-[#131314] shrink-0">
        <LanguageSelector current={language} onChange={handleLanguageChange} />
        <div className="flex items-center gap-1 sm:gap-3">
          <button
            onClick={() => {
              setViewMode('quiz');
              setQuizQuestions([]);
              setCurrentQuizIndex(0);
              setQuizScore(0);
              setQuizAnswers([]);
              setHasSelectedDifficulty(false);
            }}
            className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg hover:bg-[#2A2B2D] transition-colors"
            aria-label="Start Quiz Mode"
          >
            <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">Quiz Mode</span>
          </button>

          {isFormatSupported(language) && (
            <button
              onClick={handleFormat}
              className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg hover:bg-[#2A2B2D] transition-colors"
              title="Format Code"
              aria-label="Format Code"
            >
              <Wand2 className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Format</span>
            </button>
          )}

          <div className="h-4 sm:h-6 w-px bg-[#333]"></div>
          <button
            id="run-button"
            onClick={runCode}
            disabled={isRunning}
            className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg hover:shadow-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Run Code"
          >
            {isRunning ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />}
            <span className="hidden sm:inline">Run</span>
          </button>
        </div>
      </div>

      {/* Content Container for Resizing */}
      <div className="flex-1 flex flex-col min-h-0 relative" ref={editorContentRef}>
        {/* Code Area (Resizable Top) */}
        <div style={{ height: `${verticalSplit}% ` }} className="relative group bg-[#1E1E1E]">
          <MonacoEditor
            code={files[activeFile] || ''}
            language={(() => {
              const ext = activeFile.split('.').pop()?.toLowerCase();
              switch (ext) {
                case 'js': return 'javascript';
                case 'jsx': return 'javascript'; // Monaco handles JSX in JS mode
                case 'ts': return 'typescript';
                case 'tsx': return 'typescript';
                case 'css': return 'css';
                case 'html': return 'html';
                case 'json': return 'json';
                case 'py': return 'python';
                case 'java': return 'java';
                case 'cpp': return 'cpp';
                default: return language; // Fallback to project language
              }
            })()}
            onChange={(newCode) => setFiles(prev => ({ ...prev, [activeFile]: newCode }))}
          />
        </div>

        {/* Vertical Resizer */}
        <div
          id="vertical-resizer"
          className="h-4 -mt-2 -mb-2 bg-transparent hover:bg-purple-600/50 cursor-row-resize flex items-center justify-center transition-colors z-[9999] relative group shrink-0"
          onMouseDown={(e) => startResizing(e, 'vertical')}
        >
          <div className="h-0.5 w-full bg-[#333] group-hover:bg-purple-500 transition-colors pointer-events-none" />
          <GripHorizontal className="absolute w-6 h-6 text-gray-500 group-hover:text-white bg-[#1E1E1E] rounded-full p-1 pointer-events-none shadow-lg border border-[#333]" />
        </div>

        {/* Output / Preview Area (Resizable Bottom) */}
        <div className={`flex-1 bg-[#1E1E1E] overflow-hidden flex flex-col min-h-0 ${resizingDir ? 'pointer-events-none select-none' : ''}`}>
          {language === 'react' ? (
            <BrowserPreview srcDoc={reactSrcDoc} keyProp={renderKey} />
          ) : ['nodejs', 'mongodb'].includes(language) ? (
            <ConsolePanel lines={output} language={language} onInput={handleShellCommand} isProcessing={isRunning} />
          ) : (
            <div className="flex-1 p-6 font-mono text-sm overflow-y-auto text-[#9CA3AF]">
              {output.length > 0 ? (
                output.map((line, i) => (
                  <div key={i} className={`mb - 1 ${line.startsWith('Error') ? 'text-red-400' : 'text-gray-300'} `}>
                    {line}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic">Run code to see output...</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderQuiz = () => (
    <QuizPanel
      questions={quizQuestions}
      currentIndex={currentQuizIndex}
      score={quizScore}
      answers={quizAnswers}
      difficulty={quizDifficulty}
      isGenerating={isGeneratingQuiz}
      hasSelectedDifficulty={hasSelectedDifficulty}
      onDifficultySelect={(diff) => { setQuizDifficulty(diff); setHasSelectedDifficulty(true); }}
      onStartQuiz={async () => {
        setIsGeneratingQuiz(true);
        await generateQuiz(quizDifficulty);
        setIsGeneratingQuiz(false);
      }}
      onAnswer={(idx) => {
        setQuizAnswers(prev => [...prev, idx]);
        if (idx === quizQuestions[currentQuizIndex].correctIndex) {
          setQuizScore(s => s + 1);
        }
        setCurrentQuizIndex(i => i + 1);
      }}
      onExit={() => setViewMode('editor')}
    />
  );

  // Handle language change with navigation
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    navigate(`/editor/${newLang}`, { replace: true });
  };

  return (
    <div ref={containerRef} className="flex flex-col h-screen w-screen bg-[#131314] overflow-hidden font-sans">
      {/* Desktop Layout (md and up) */}
      <div className="hidden md:flex md:flex-row h-full">
        {/* Chat Panel (Resizable on desktop) */}
        <div
          style={{ width: `${splitRatio}%` }}
          className="shrink-0 bg-[#131314] flex flex-col border-r border-[#333]"
        >
          {renderChat()}
        </div>

        {/* Resizer Handle */}
        <div
          id="horizontal-resizer"
          className="w-4 -ml-2 -mr-2 h-full bg-transparent hover:bg-purple-600/50 cursor-col-resize z-[9999] flex flex-col justify-center items-center group transition-colors relative shrink-0"
          onMouseDown={(e) => startResizing(e, 'horizontal')}
        >
          <div className="w-0.5 h-full bg-[#333] group-hover:bg-purple-500 transition-colors pointer-events-none" />
          <div className="absolute w-1 h-8 bg-[#444] group-hover:bg-[#888] rounded-full transition-colors pointer-events-none" />
        </div>

        {/* Right Panel (Editor/Lab) */}
        {/* Right Panel (Editor/Lab) */}
        <div className={`flex-1 min-w-0 min-h-0 overflow-hidden ${resizingDir === 'horizontal' ? 'pointer-events-none select-none' : ''}`}>
          {viewMode === 'editor' ? (
            <div className="flex h-full w-full" key={language}>
              {(language === 'react' || language === 'nodejs') && (
                <FileExplorer
                  files={files}
                  activeFile={activeFile}
                  onFileSelect={setActiveFile}
                  onFileCreate={(name) => {
                    setFiles(prev => ({ ...prev, [name]: '' }));
                    setActiveFile(name);
                  }}
                  onFileDelete={(name) => {
                    const newFiles = { ...files };
                    delete newFiles[name];
                    setFiles(newFiles);
                    if (activeFile === name) {
                      setActiveFile(Object.keys(newFiles)[0] || '');
                    }
                  }}
                />
              )}
              {renderEditor()}
            </div>
          ) : renderQuiz()}
        </div>
      </div>

      {/* Mobile Layout (below md) */}
      <div className="md:hidden flex flex-col h-full">
        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {/* Keep all tabs mounted, just hide them */}
          <div className={`absolute inset-0 ${mobileTab === 'chat' ? 'block' : 'hidden'}`}>
            {renderChat()}
          </div>
          <div className={`absolute inset-0 ${mobileTab === 'code' ? 'block' : 'hidden'}`}>
            {renderEditor()}
          </div>
          <div className={`absolute inset - 0 ${mobileTab === 'output' ? 'block' : 'hidden'} `}>
            <div className="h-full flex flex-col bg-[#1E1E1E]">
              {/* Output Header */}
              <div className="h-14 border-b border-[#333] flex items-center justify-between px-4 bg-[#131314] shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-gray-200">Output</span>
                </div>
                <button
                  onClick={() => setOutput([])}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                  title="Clear Output"
                >
                  <Eraser className="w-4 h-4" />
                </button>
              </div>
              {/* Output Content */}
              <div className="flex-1 overflow-y-auto bg-[#1E1E1E] font-mono text-sm relative">
                {language === 'react' ? (
                  <BrowserPreview srcDoc={reactSrcDoc} keyProp={renderKey} />
                ) : (
                  <div className="p-4">
                    {output.length === 0 ? (
                      <div className="text-gray-500 text-center mt-8">
                        Run your code to see output here
                      </div>
                    ) : (
                      output.map((line, i) => (
                        <div key={i} className="text-gray-300 whitespace-pre-wrap break-words">
                          {line}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="h-16 border-t border-[#333] bg-[#131314] flex items-center justify-around shrink-0 z-30">
          <button
            onClick={() => setMobileTab('code')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${mobileTab === 'code' ? 'text-blue-400' : 'text-gray-500'}`}
          >
            <Code2 className="w-5 h-5" />
            <span className="text-xs font-medium">Code</span>
          </button>
          <button
            onClick={() => setMobileTab('output')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${mobileTab === 'output' ? 'text-blue-400' : 'text-gray-500'}`}
          >
            <Terminal className="w-5 h-5" />
            <span className="text-xs font-medium">Output</span>
          </button>
          <button
            onClick={() => setMobileTab('chat')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${mobileTab === 'chat' ? 'text-blue-400' : 'text-gray-500'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-medium">Chat</span>
          </button>
        </div>
      </div>

      {/* Global Resizing Overlay to prevent iframe interference */}
      {resizingDir && (
        <div
          className="fixed inset-0 z-[9999]"
          style={{ cursor: resizingDir === 'horizontal' ? 'col-resize' : 'row-resize' }}
        />
      )}

      {/* Clear Chat Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#1E1E1E] border border-[#333] rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 opacity-100">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-2">Clear Chat History?</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Are you sure you want to clear the entire conversation? This action cannot be undone.
              </p>
            </div>
            <div className="bg-[#131314] px-6 py-4 flex items-center justify-end gap-3 border-t border-[#333]">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-[#333] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearChat}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- App Component with Router ---

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPageRoute />} />
        <Route path="/docs" element={<DocumentationRoute />} />
        <Route path="/editor" element={<Navigate to="/editor/javascript" replace />} />
        <Route path="/editor/:lang" element={<EditorWrapper />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// Route wrapper components
function LandingPageRoute() {
  const navigate = useNavigate();
  return <LandingPage onStart={() => navigate('/editor')} onViewDocs={() => navigate('/docs')} />;
}

function DocumentationRoute() {
  const navigate = useNavigate();
  return <Documentation onBack={() => navigate('/')} />;
}