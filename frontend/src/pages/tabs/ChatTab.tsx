import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles, User, Bot, Clock } from 'lucide-react';
import { Account, Memory } from '../../types';
import { api } from '../../api/client';

interface ChatTabProps {
  account: Account;
  memoryOn: boolean;
  onMemoriesRecalled: (memories: Memory[]) => void;
}

interface MessageItem {
  sender: 'user' | 'agent';
  text: string;
  latency?: number;
  memoryOn?: boolean;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  account,
  memoryOn,
  onMemoriesRecalled,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      sender: 'agent',
      text: `Hello! I'm your deal intelligence copilot for **${account.name}**. Ask me anything about previous calls, open objections, promises made to contacts, or competitor discussions.`,
      memoryOn,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await api.sendChat(account.id, userMsg, memoryOn);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: res.output,
          latency: res.latency_ms,
          memoryOn: res.memory_on,
        },
      ]);
      onMemoriesRecalled(res.recalled_memories);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: 'Error recalling memories or contacting agent service.',
          memoryOn,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-3 ${
              m.sender === 'user' ? 'justify-end' : 'justify-start'
            } animate-fade-in`}
          >
            {m.sender === 'agent' && (
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-purple-600 text-white rounded-tr-none'
                  : 'bg-slate-800/80 text-slate-100 border border-slate-700/80 rounded-tl-none whitespace-pre-wrap'
              }`}
            >
              <div className="font-sans">{m.text}</div>
              {m.latency && (
                <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{m.memoryOn ? 'Hindsight Memory Grounded' : 'Memory OFF (Stateless)'}</span>
                  <span className="flex items-center space-x-1 text-purple-300">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{m.latency}ms</span>
                  </span>
                </div>
              )}
            </div>

            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-purple-400 p-2 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Recalling memories from Hindsight bank...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/70 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${account.name}'s objections, competitors, promised quotes...`}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all disabled:opacity-50 flex items-center space-x-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
