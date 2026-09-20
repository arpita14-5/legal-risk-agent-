import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  FileText,
  BookOpen,
  CornerDownRight,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { sendChatMessage, fetchChatHistory } from '../api/contracts.js';
import type { ChatMessage, ContractEvidence } from '../types/index.js';

interface ContractChatDrawerProps {
  contractId: string;
  onNavigateToEvidence?: (evidence: ContractEvidence) => void;
}

const SAMPLE_PROMPTS = [
  'Does this contract have an automatic renewal clause?',
  'What are my termination rights?',
  'Are there any unlimited liability provisions?',
  'Who owns the intellectual property?',
  'What happens if payment is late?',
  'Summarize the obligations of the customer.'
];

export const ContractChatDrawer: React.FC<ContractChatDrawerProps> = ({
  contractId,
  onNavigateToEvidence
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await fetchChatHistory(contractId);
        setMessages(history);
      } catch (err) {
        console.warn('Could not load chat history:', err);
      }
    }
    loadHistory();
  }, [contractId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!queryText) setInput('');
    setIsLoading(true);

    try {
      const assistantMessage = await sendChatMessage(contractId, textToSend);
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'AI analysis could not be completed. Please verify document indexing or retry.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-serif font-bold text-white">Grounded Contract RAG Chat</h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Strict Evidence Mode
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-semibold text-slate-200">Ask any question about this contract</h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Answers are grounded strictly in retrieved contract clauses and verified against hallucinations.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center max-w-sm mx-auto pt-2">
              {SAMPLE_PROMPTS.slice(0, 4).map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-amber-500/30 transition-all text-left"
                >
                  &ldquo;{p}&rdquo;
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium'
                    : 'bg-slate-950 border border-slate-800 text-slate-200'
                }`}
              >
                {/* Assistant Verification Header */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800/80 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-mono">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Grounded & Verified
                    </span>
                    {msg.confidence && (
                      <span className="font-mono">{(msg.confidence * 100).toFixed(0)}% Conf.</span>
                    )}
                  </div>
                )}

                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Evidence & Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold block">
                      Cited Evidence & Authorities:
                    </span>
                    {msg.citations.map((cite, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between text-slate-300 font-medium">
                          <span className="flex items-center gap-1 text-amber-300">
                            {cite.type === 'contract' ? (
                              <FileText className="w-3 h-3" />
                            ) : (
                              <BookOpen className="w-3 h-3 text-sky-400" />
                            )}
                            {cite.type === 'contract'
                              ? `Contract ${cite.section ? `• ${cite.section}` : ''} (p. ${cite.page || 1})`
                              : cite.title || 'Legal Reference'}
                          </span>
                          {cite.type === 'contract' && onNavigateToEvidence && (
                            <button
                              onClick={() =>
                                onNavigateToEvidence({
                                  page: cite.page || 1,
                                  section: cite.section || 'Clause',
                                  text: cite.text
                                })
                              }
                              className="text-[10px] text-amber-400 hover:text-white flex items-center gap-0.5 underline font-sans"
                            >
                              View Clause <CornerDownRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] font-serif text-slate-400 italic line-clamp-2">
                          &ldquo;{cite.text}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {msg.warnings && msg.warnings.length > 0 && (
                  <div className="mt-2 text-[10px] text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{msg.warnings[0]}</span>
                  </div>
                )}
              </div>
              <span className="text-[9px] font-mono text-slate-400 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
            <span>Retrieving clauses and verifying evidence...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this contract..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};