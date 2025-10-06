'use client';

import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface CommandInputProps {
  onSubmit: (command: string) => void;
}

export default function CommandInput({ onSubmit }: CommandInputProps) {
  const [command, setCommand] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      onSubmit(command);
      setCommand('');
    }
  };

  const exampleCommands = [
    'Launch a decentralized ride-sharing service with token rewards',
    'Create an autonomous marketing firm for my product',
    'Build a DAO-governed NFT marketplace with artist royalties',
    'Develop a DeFi lending platform with dynamic interest rates',
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`chrome-surface rounded-2xl p-1 transition-all duration-300 ${
            isFocused ? 'neon-border' : ''
          }`}
        >
          <div className="flex items-center gap-3 p-4">
            <Sparkles className="w-6 h-6 text-[var(--neon-blue)]" />
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Issue a strategic directive to Dominus Core..."
              className="flex-1 bg-transparent text-white text-lg outline-none placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={!command.trim()}
              className="chrome-button rounded-xl px-6 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              <span className="font-semibold">Execute</span>
            </button>
          </div>
        </div>
      </form>

      {/* Example Commands */}
      <div className="mt-6 space-y-2">
        <p className="text-sm text-gray-400 mb-3">Example Directives:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {exampleCommands.map((example, index) => (
            <button
              key={index}
              onClick={() => setCommand(example)}
              className="glass-effect rounded-lg p-3 text-left text-sm text-gray-300 hover:text-[var(--neon-blue)] hover:border-[var(--neon-blue)] transition-all duration-300 border border-transparent"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}