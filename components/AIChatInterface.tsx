'use client';

import { useState, useRef, useEffect } from 'react';
import { apiClient, AIResponse } from '@/lib/api-client';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Send, Bot, User, Sparkles, Settings, Download, Copy } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: number;
}

interface AIChatInterfaceProps {
  projectId?: string;
  agentId?: string;
  className?: string;
}

export default function AIChatInterface({ projectId, agentId, className = '' }: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [temperature, setTemperature] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { on, emit } = useWebSocket();

  // Load saved chat history
  useEffect(() => {
    const savedMessages = localStorage.getItem(`chat-${projectId || 'global'}`);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  }, [projectId]);

  // Save chat history
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat-${projectId || 'global'}`, JSON.stringify(messages));
    }
  }, [messages, projectId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket event handlers
  useEffect(() => {
    const handleAIResponse = (data: any) => {
      if (data.type === 'ai:response') {
        const newMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
          model: data.model,
          tokens: data.tokens,
        };
        setMessages(prev => [...prev, newMessage]);
        setIsLoading(false);
      }
    };

    on('ai:response', handleAIResponse);
    return () => {
      // Cleanup
    };
  }, [on]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send via WebSocket for real-time updates
      emit('ai:chat', {
        message: input.trim(),
        model: selectedModel,
        temperature,
        projectId,
        agentId,
      });

      // Fallback to REST API
      const response = await apiClient.chatWithAI([
        ...messages.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: input.trim() }
      ], selectedModel);

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        model: response.model,
        tokens: response.tokens,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(`chat-${projectId || 'global'}`);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const exportChat = () => {
    const chatData = {
      messages,
      projectId,
      agentId,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col h-[600px] chrome-surface rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
            <p className="text-sm text-gray-400">{selectedModel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={exportChat}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={clearChat}
            className="px-3 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-700 bg-gray-800/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Temperature: {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Start a conversation with the AI assistant</p>
            <p className="text-sm mt-2">Ask me about projects, agents, or anything else!</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role !== 'user' && (
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                {message.role === 'assistant' ? (
                  <Bot className="w-5 h-5 text-blue-400" />
                ) : (
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                )}
              </div>
            )}
            
            <div className={`max-w-[70%] ${message.role === 'user' ? 'order-1' : ''}`}>
              <div
                className={`rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.role === 'system'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-gray-700 text-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                <span>{message.timestamp.toLocaleTimeString()}</span>
                {message.model && <span>• {message.model}</span>}
                {message.tokens && <span>• {message.tokens} tokens</span>}
                {message.role === 'assistant' && (
                  <button
                    onClick={() => copyMessage(message.content)}
                    className="ml-auto hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 order-2">
                <User className="w-5 h-5 text-gray-300" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div className="bg-gray-700 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}