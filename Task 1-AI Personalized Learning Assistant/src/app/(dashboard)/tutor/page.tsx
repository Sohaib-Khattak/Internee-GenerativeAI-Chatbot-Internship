'use client';
import { useState, FormEvent, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserData } from '@/lib/firebase/firestore';
import ChatMessage from '@/components/ChatMessage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const categories = ['Article', 'Weather', 'Sport', 'Press', 'Food', 'Plants', 'Suggest something'];

const demoMessages: Message[] = [
  { role: 'assistant', content: 'Hi! I\'m your AI tutor. Ask me anything about your learning topics.' },
  { role: 'user', content: 'What is a closure in JavaScript?' },
  { role: 'assistant', content: 'A closure is a function that remembers its outer scope even after the outer function has returned.\n\n```js\nfunction outer(x) {\n  return function inner(y) {\n    return x + y;\n  };\n}\n\nconst add5 = outer(5);\nconsole.log(add5(3)); // 8\n```\n\nThe inner function "closes over" the `x` variable. Want to try an example?' },
  { role: 'user', content: 'Show me a React component example' },
  { role: 'assistant', content: 'Here is a simple counter component in React:\n\n```tsx\nimport { useState } from "react";\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>+</button>\n    </div>\n  );\n}\n```\n\nThis uses the `useState` hook to track and update state. Try building one yourself!' },
];

export default function TutorPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [weakAreas, setWeakAreas] = useState<string[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    getUserData(uid).then((data) => {
      if (data?.weakAreas) setWeakAreas(data.weakAreas as string[]);
    });
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    setHasStarted(true);
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: '',
          weakAreas,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sorry, something went wrong.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: msg },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">AI Chat</h2>
        <span className="px-2 py-0.5 text-xs bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 rounded-full font-medium">Tutor</span>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6">
        {!hasStarted && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/50 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">🤖</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">What can I help with?</h3>
            <p className="text-gray-400 dark:text-gray-500 mb-8">Ask me anything about your learning topics</p>

            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => sendMessage(`Tell me about ${cat.toLowerCase()}`)}
                  className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-full hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => { setMessages(demoMessages); setHasStarted(true); }}
              className="mt-6 px-5 py-2.5 text-sm bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors font-medium"
            >
              Try Demo Chat
            </button>
          </div>
        ) : (
          <div>
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}
            {loading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message Internee AI..."
          className="flex-1 border border-gray-200 dark:border-gray-600 px-5 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-brand-600 text-white px-6 py-3.5 rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors font-medium text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Send
        </button>
      </form>
    </div>
  );
}
