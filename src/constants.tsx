import React from 'react';
import { FileJson, Atom, Hexagon, Database, FileCode, Coffee, Code2 } from 'lucide-react';
import { Language } from './types';

export const LANGUAGES = [
    { id: 'javascript', label: 'JavaScript', icon: <FileJson className="w-4 h-4 text-yellow-400" />, ext: 'js', prismLang: 'javascript' },
    { id: 'react', label: 'React', icon: <Atom className="w-4 h-4 text-cyan-400" />, ext: 'jsx', prismLang: 'jsx' },
    { id: 'nodejs', label: 'Node.js', icon: <Hexagon className="w-4 h-4 text-green-500" />, ext: 'js', prismLang: 'javascript' },
    { id: 'mongodb', label: 'MongoDB', icon: <Database className="w-4 h-4 text-green-400" />, ext: 'js', prismLang: 'javascript' },
    { id: 'python', label: 'Python', icon: <FileCode className="w-4 h-4 text-blue-400" />, ext: 'py', prismLang: 'python' },
    { id: 'java', label: 'Java', icon: <Coffee className="w-4 h-4 text-orange-400" />, ext: 'java', prismLang: 'java' },
    { id: 'cpp', label: 'C++', icon: <Code2 className="w-4 h-4 text-blue-600" />, ext: 'cpp', prismLang: 'cpp' },
];

export const INITIAL_CODE: Record<Language, string> = {
    javascript: `// JavaScript Playground
console.log("Hello World");`,

    python: `# Python 3.10 Environment
def process_data(data):
    return [x * 2 for x in data]

numbers = [1, 2, 3, 4, 5]
print(f"Original: {numbers}")
print(f"Processed: {process_data(numbers)}")`,

    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Java Runtime Environment Active");
        
        int[] numbers = {10, 20, 30};
        for(int n : numbers) {
            System.out.println("Processing: " + n);
        }
    }
}`,

    cpp: `#include <iostream>
#include <vector>

int main() {
    std::cout << "C++ Compiler Initialized" << std::endl;
    std::vector<int> v = {1, 2, 3};
    
    for(int i : v) {
        std::cout << "Vector Element: " << i << std::endl;
    }
    return 0;
}`,

    react: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'sans-serif',
      textAlign: 'center',
      background: '#f0f4f8',
      borderRadius: '12px',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ color: '#1a202c' }}>React Preview ⚛️</h1>
      <p>Edit code and click "Preview"!</p>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button onClick={() => setCount(c => c - 1)}>-</button>
        <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{count}</span>
        <button onClick={() => setCount(c => c + 1)}>+</button>
      </div>
    </div>
  );
}`,

    nodejs: `const os = require('os');

console.log("Starting Node.js process...");
console.log("Platform: " + os.platform());
console.log("Node Version: v18.16.0");

// Try typing: console.log(process.memoryUsage())
`,

    mongodb: `use production_db;

db.products.insertOne({ 
    name: "Gaming Laptop", 
    price: 1299,
    tags: ["tech", "gaming"]
});

print("Data inserted. Type commands below to query.");
// Try typing: db.products.find()`,
};
