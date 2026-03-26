import React, { useMemo, useRef, useState } from 'react';

import { copilotAPI } from '../../services/api';

const ChatBubble = ({ role, children }) => {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`
          max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
          ${isUser ? 'bg-indigo-500/20 border border-indigo-300/30 text-white' : 'bg-white/10 border border-white/20 text-white'}
        `}
      >
        {children}
      </div>
    </div>
  );
};

const CopilotChat = () => {
  const initialMessages = useMemo(
    () => [
      {
        id: 'm1',
        role: 'assistant',
        content:
          'Hi! I can help with a few Optima actions right now:\n' +
          '- `pending edits` (attendance approval queue)\n' +
          '- Approve/reject an attendance edit (record id)\n' +
          '- Biometric log preview/sync (device_ip + optional date)',
      },
    ],
    []
  );

  const [messages, setMessages] = useState(initialMessages);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [pendingEdits, setPendingEdits] = useState([]);

  const [biometricIp, setBiometricIp] = useState('');
  const [biometricDate, setBiometricDate] = useState('');

  const chatEndRef = useRef(null);

  const appendMessage = (role, content) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        role,
        content,
      },
    ]);
  };

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const runCopilot = async ({ message, tool }) => {
    setLoading(true);
    try {
      const payload = {
        message,
      };
      if (tool) payload.tool = tool;

      const resp = await copilotAPI.chat(payload);
      const data = resp?.data || {};

      if (typeof data.reply === 'string') {
        appendMessage('assistant', data.reply);
      } else {
        appendMessage('assistant', 'Received an unexpected response from the server.');
      }

      if (data.intent === 'pending_edits' && Array.isArray(data.records)) {
        setPendingEdits(data.records);
      }

      return data;
    } catch (e) {
      const backendReply = e?.response?.data?.reply;
      const backendDetail = e?.response?.data?.detail;
      appendMessage('assistant', `Copilot request failed: ${backendReply || backendDetail || e.message}`);
      return null;
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    appendMessage('user', text);
    setInput('');
    await runCopilot({ message: text });
  };

  const handleToolPendingEdits = async () => {
    appendMessage('user', 'pending edits');
    await runCopilot({
      message: 'pending edits',
      tool: { name: 'pending_edits', arguments: {} },
    });
  };

  const handleApprove = async (recordId, action) => {
    appendMessage('user', `${action} record ${recordId}`);
    await runCopilot({
      message: `${action} record ${recordId}`,
      tool: {
        name: 'approve_edit',
        arguments: {
          record_id: recordId,
          action,
          new_data: {},
        },
      },
    });
    // Refresh queue after change
    await handleToolPendingEdits();
  };

  const handleFetchBiometric = async () => {
    appendMessage('user', 'fetch biometric logs');
    await runCopilot({
      message: 'fetch biometric logs',
      tool: {
        name: 'fetch_biometric_logs',
        arguments: {
          device_ip: biometricIp.trim() || null,
          fetch_date: biometricDate.trim() || null,
        },
      },
    });
  };

  const handleSyncBiometric = async () => {
    appendMessage('user', 'sync biometric logs');
    await runCopilot({
      message: 'sync biometric logs',
      tool: {
        name: 'sync_biometric_logs',
        arguments: {
          device_ip: biometricIp.trim() || null,
          sync_date: biometricDate.trim() || null,
        },
      },
    });
  };

  const onInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleSend();
    }
  };

  const collapsed = (
    <div className="fixed bottom-6 right-6 left-auto translate-x-0 z-[2000] w-[min(92vw,320px)]">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(true)}
        onKeyDown={(e) => (e.key === 'Enter' ? setExpanded(true) : null)}
        className="w-full rounded-full bg-gradient-to-r from-[#06b6d4] via-[#8b5cf6] to-[#4f46e5] backdrop-blur-md shadow-2xl border border-white/10 px-3 py-2 flex items-center gap-3 cursor-pointer"
        aria-label="Open Copilot chat"
      >
        <div className="h-10 w-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold">🤖</span>
        </div>

        <div className="flex-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Optima Copilot..."
            onFocus={() => setExpanded(true)}
            className="w-full bg-transparent outline-none text-white placeholder:text-white/70 text-sm font-medium"
          />
        </div>

        <button
          type="button"
          onClick={async (e) => {
            e.stopPropagation();
            setExpanded(true);
            if (input.trim()) {
              await handleSend();
            }
          }}
          disabled={loading}
          className="h-10 w-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center disabled:opacity-50 flex-shrink-0"
          aria-label="Send message"
        >
          <span className="text-white text-lg">➤</span>
        </button>
      </div>
    </div>
  );

  if (!expanded) return collapsed;

  return (
    <div className="fixed bottom-6 right-6 left-auto translate-x-0 z-[2001] w-[min(92vw,420px)] h-[70vh] max-h-[640px]">
      <div className="bg-[#0B1120]/95 backdrop-blur-md border border-white/15 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col">
        {/* Header (like the screenshot) */}
        <div className="bg-gradient-to-r from-[#06b6d4] via-[#8b5cf6] to-[#4f46e5] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">🤖</span>
            </div>
            <div className="min-w-0">
              <div className="text-white font-bold text-lg leading-tight truncate">Optima Copilot</div>
              <div className="text-white/80 text-xs font-semibold">Online</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="h-9 w-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
            aria-label="Close Copilot"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((m) => (
            <ChatBubble key={m.id} role={m.role}>
              {m.content}
            </ChatBubble>
          ))}

          {loading && (
            <div className="flex justify-start mb-3">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-white/10 border border-white/20 text-white">
                Thinking...
              </div>
            </div>
          )}

          {pendingEdits.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Pending edits queue
              </div>
              <div className="space-y-3">
                {pendingEdits.slice(0, 10).map((r) => (
                    <div key={r.id} className="bg-white/10 border border-white/20 rounded-2xl p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">
                          Record #{r.id} - {r.employee_name}
                        </div>
                        <div className="text-xs text-slate-400">
                          Date: {r.date} | Status: {r.current_status}
                        </div>
                        {r.edit_reason && (
                          <div className="text-xs text-slate-300 mt-1 truncate">
                            Reason: {r.edit_reason}
                          </div>
                        )}
                        <div className="text-xs text-slate-500 mt-2">
                          Current: {r.current_check_in_time} - {r.current_check_out_time}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApprove(r.id, 'approve')}
                          disabled={loading}
                          className="px-3 py-2 text-xs rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-100 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(r.id, 'reject')}
                          disabled={loading}
                          className="px-3 py-2 text-xs rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-100 hover:bg-rose-500/25 transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingEdits.length > 10 && (
                  <div className="text-xs text-slate-400">
                    Showing first 10 items. Refine your query in-chat if needed.
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4 bg-slate-900/20">
          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Ask anything about attendance/biometric approvals..."
                rows={3}
                className="flex-1 px-3 py-2 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <button
                type="button"
                disabled={loading || !input.trim()}
                onClick={handleSend}
                className="px-4 py-3 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </div>

            <div className="text-[11px] text-slate-400">
              Safety note: only a limited set of actions can be executed via your backend permissions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopilotChat;

