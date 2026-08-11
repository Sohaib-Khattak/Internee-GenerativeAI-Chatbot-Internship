# AI Personalized Learning Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GenAI tutor that guides interns through Internee.pk learning modules with dynamic lesson planning, AI Q&A, and progress tracking.

**Architecture:** Next.js app with App Router, Firebase Auth + Firestore for user management and progress storage, OpenAI API for intelligent tutoring, and a modular component structure for lessons, chat, and dashboard.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Firebase (Auth + Firestore + Admin SDK), OpenAI API, React Context for state management.

## Global Constraints

- TypeScript everywhere, strict mode
- Environment variables for all secrets (OpenAI key, Firebase config)
- Firebase security rules restrict reads/writes to own UID
- No hardcoded prompts — prompt templates live in `lib/prompts/`
- Mobile-responsive UI with Tailwind CSS

---

### Task 1: Scaffold Next.js Project & Configure Tooling

**Files:**
- Create: Project root via `npx create-next-app@latest`

- [ ] **Step 1: Generate Next.js project**

Run:
```powershell
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

- [ ] **Step 2: Install additional dependencies**

Run:
```powershell
npm install firebase openai ai @vercel/ai-sdk dotenv
npm install -D @types/node
```

- [ ] **Step 3: Create environment variable template**

Create `.env.local`:
```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# OpenAI
OPENAI_API_KEY=
```

- [ ] **Step 4: Create `.gitignore` entries**

Ensure `.env.local` and `.next` are in `.gitignore`.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: scaffold Next.js project with Firebase and OpenAI deps"
```

---

### Task 2: Firebase Configuration & Auth Setup

**Files:**
- Create: `src/lib/firebase/config.ts`
- Create: `src/lib/firebase/auth.ts`
- Create: `src/lib/firebase/firestore.ts`
- Create: `src/context/AuthContext.tsx`
- Create: `src/app/layout.tsx` (modify existing)

- [ ] **Step 1: Create Firebase client config**

Write `src/lib/firebase/config.ts`:
```typescript
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
```

- [ ] **Step 2: Create auth helper functions**

Write `src/lib/firebase/auth.ts`:
```typescript
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from './config';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './config';

export async function signUp(email: string, password: string, name: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', cred.user.uid), {
    name,
    email,
    createdAt: new Date().toISOString(),
    progress: {},
    weakAreas: [],
  });
  return cred.user;
}

export async function logIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logOut() {
  await signOut(auth);
}
```

- [ ] **Step 3: Create AuthContext**

Write `src/context/AuthContext.tsx`:
```typescript
'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

- [ ] **Step 4: Create Firestore helper**

Write `src/lib/firebase/firestore.ts`:
```typescript
import { db } from './config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export async function getUserData(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProgress(uid: string, data: Record<string, unknown>) {
  await updateDoc(doc(db, 'users', uid), data);
}
```

- [ ] **Step 5: Wrap layout with AuthProvider**

Modify `src/app/layout.tsx` to include `AuthProvider`:
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Internee AI Tutor',
  description: 'Personalized AI Learning Assistant for Internee.pk',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/firebase/ src/context/ src/app/layout.tsx
git commit -m "feat: add Firebase config, auth, and AuthContext"
```

---

### Task 3: Authentication Pages (Login & Signup)

**Files:**
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/components/AuthGuard.tsx`

- [ ] **Step 1: Create auth layout**

Write `src/app/(auth)/layout.tsx`:
```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create login page**

Write `src/app/(auth)/login/page.tsx`:
```typescript
'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { logIn } from '@/lib/firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await logIn(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm space-y-4">
      <h1 className="text-2xl font-bold text-center">Login</h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
        Login
      </button>
      <p className="text-sm text-center">
        Don&apos;t have an account? <Link href="/signup" className="text-blue-600">Sign up</Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 3: Create signup page**

Write `src/app/(auth)/signup/page.tsx`:
```typescript
'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/firebase/auth';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await signUp(email, password, name);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm space-y-4">
      <h1 className="text-2xl font-bold text-center">Sign Up</h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <input
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
        Sign Up
      </button>
      <p className="text-sm text-center">
        Already have an account? <Link href="/login" className="text-blue-600">Login</Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 4: Create AuthGuard component**

Write `src/components/AuthGuard.tsx`:
```typescript
'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return <div className="flex justify-center p-8">Loading...</div>;
  if (!user) return null;

  return <>{children}</>;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(auth\)/ src/components/AuthGuard.tsx
git commit -m "feat: add login and signup pages with auth guard"
```

---

### Task 4: OpenAI Integration & Prompt Templates

**Files:**
- Create: `src/lib/openai/client.ts`
- Create: `src/lib/prompts/tutor-prompts.ts`
- Create: `src/app/api/chat/route.ts`

- [ ] **Step 1: Create OpenAI client**

Write `src/lib/openai/client.ts`:
```typescript
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

- [ ] **Step 2: Create prompt templates**

Write `src/lib/prompts/tutor-prompts.ts`:
```typescript
export const SYSTEM_PROMPT = `You are an AI tutor for Internee.pk interns. Your role:
- Provide clear, concise explanations
- Adapt explanations to the intern's skill level
- Ask follow-up questions to reinforce learning
- Identify knowledge gaps and suggest improvements
- Be encouraging and supportive

Keep responses educational and structured.`;

export function generateLessonPrompt(
  topic: string,
  skillLevel: 'beginner' | 'intermediate' | 'advanced',
  weakAreas: string[]
): string {
  return `Topic: ${topic}
Skill Level: ${skillLevel}
Weak Areas: ${weakAreas.join(', ') || 'None identified yet'}

Create a personalized lesson plan covering:
1. Core concepts with simple analogies
2. Practical examples
3. Common pitfalls to avoid
4. Practice exercises
5. Self-assessment questions

Tailor the depth and complexity to the ${skillLevel} level.
Focus extra attention on weak areas: ${weakAreas.join(', ') || 'general fundamentals'}.`;
}

export function generateAnswerPrompt(
  question: string,
  context: string,
  weakAreas: string[]
): string {
  return `The intern asks: "${question}"

Relevant context: ${context}

The intern struggles with: ${weakAreas.join(', ') || 'N/A'}

Provide a thorough answer that:
1. Directly answers the question
2. Uses simple language
3. Includes an example
4. Checks understanding with a follow-up question
5. Addresses any related weak areas`;
}
```

- [ ] **Step 3: Create chat API route**

Write `src/app/api/chat/route.ts`:
```typescript
import { openai } from '@/lib/openai/client';
import { SYSTEM_PROMPT, generateAnswerPrompt } from '@/lib/prompts/tutor-prompts';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, context, weakAreas, history } = await req.json();

    const userPrompt = generateAnswerPrompt(message, context || '', weakAreas || []);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(history || []),
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content ?? 'Sorry, I could not generate a response.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/openai/ src/lib/prompts/ src/app/api/chat/
git commit -m "feat: add OpenAI integration with prompt templates and chat API"
```

---

### Task 5: Dashboard Layout & Navigation

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/Header.tsx`

- [ ] **Step 1: Create dashboard layout**

Write `src/app/(dashboard)/layout.tsx`:
```typescript
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
```

- [ ] **Step 2: Create Sidebar**

Write `src/components/Sidebar.tsx`:
```typescript
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/lessons', label: 'Lessons', icon: '📚' },
  { href: '/tutor', label: 'AI Tutor', icon: '🤖' },
  { href: '/progress', label: 'Progress', icon: '📈' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-6">Internee AI</h2>
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              pathname === item.href
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Create Header**

Write `src/components/Header.tsx`:
```typescript
'use client';
import { useAuth } from '@/context/AuthContext';
import { logOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logOut();
    router.push('/login');
  }

  return (
    <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
      <h1 className="text-lg font-semibold">Welcome, {user?.email?.split('@')[0] || 'Intern'}</h1>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-600 hover:text-red-600 transition-colors"
      >
        Logout
      </button>
    </header>
  );
}
```

- [ ] **Step 4: Create dashboard main page**

Write `src/app/(dashboard)/dashboard/page.tsx`:
```typescript
'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { getUserData } from '@/lib/firebase/firestore';

interface UserData {
  name?: string;
  weakAreas?: string[];
  progress?: Record<string, unknown>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<UserData | null>(null);

  useEffect(() => {
    if (user) {
      getUserData(user.uid).then(setData);
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-gray-600">Lessons Completed</h3>
          <p className="text-3xl font-bold mt-2">
            {data?.progress ? Object.keys(data.progress).length : 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-gray-600">Weak Areas</h3>
          <p className="text-3xl font-bold mt-2">{data?.weakAreas?.length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-gray-600">Streak</h3>
          <p className="text-3xl font-bold mt-2">0 days</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/ src/components/Sidebar.tsx src/components/Header.tsx
git commit -m "feat: add dashboard layout with sidebar and header"
```

---

### Task 6: Lesson Module — Dynamic Lesson Planning

**Files:**
- Create: `src/app/(dashboard)/lessons/page.tsx`
- Create: `src/app/(dashboard)/lessons/[id]/page.tsx`
- Create: `src/lib/lessons/lessons-data.ts`
- Create: `src/app/api/lessons/generate/route.ts`

- [ ] **Step 1: Create lesson data definitions**

Write `src/lib/lessons/lessons-data.ts`:
```typescript
export interface Lesson {
  id: string;
  title: string;
  description: string;
  topic: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  content: string;
  exercises: string[];
  quiz: { question: string; options: string[]; correct: number }[];
}

export const defaultTopics = [
  { id: 'js-basics', title: 'JavaScript Basics', level: 'beginner' as const },
  { id: 'react-fundamentals', title: 'React Fundamentals', level: 'intermediate' as const },
  { id: 'node-api', title: 'Node.js API Design', level: 'advanced' as const },
  { id: 'python-data', title: 'Python for Data Science', level: 'intermediate' as const },
  { id: 'git-workflow', title: 'Git & Collaboration', level: 'beginner' as const },
];
```

- [ ] **Step 2: Create lesson generation API**

Write `src/app/api/lessons/generate/route.ts`:
```typescript
import { openai } from '@/lib/openai/client';
import { SYSTEM_PROMPT, generateLessonPrompt } from '@/lib/prompts/tutor-prompts';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { topic, skillLevel, weakAreas } = await req.json();

    const prompt = generateLessonPrompt(topic, skillLevel, weakAreas || []);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const content = completion.choices[0]?.message?.content ?? 'Could not generate lesson.';

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Lesson generation error:', error);
    return NextResponse.json({ error: 'Failed to generate lesson' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create lessons listing page**

Write `src/app/(dashboard)/lessons/page.tsx`:
```typescript
'use client';
import { defaultTopics } from '@/lib/lessons/lessons-data';
import Link from 'next/link';

export default function LessonsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Learning Modules</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {defaultTopics.map((topic) => (
          <Link
            key={topic.id}
            href={`/lessons/${topic.id}`}
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-lg">{topic.title}</h3>
            <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
              topic.level === 'beginner' ? 'bg-green-100 text-green-700' :
              topic.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {topic.level}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create lesson detail page with AI-generated content**

Write `src/app/(dashboard)/lessons/[id]/page.tsx`:
```typescript
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { defaultTopics } from '@/lib/lessons/lessons-data';
import { useAuth } from '@/context/AuthContext';
import { getUserData, updateUserProgress } from '@/lib/firebase/firestore';
import ReactMarkdown from 'react-markdown';

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const topic = defaultTopics.find((t) => t.id === id);

  useEffect(() => {
    if (!topic || !user) return;

    async function generate() {
      setLoading(true);
      const userData = await getUserData(user.uid);
      const weakAreas = (userData?.weakAreas as string[]) || [];

      const res = await fetch('/api/lessons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.title,
          skillLevel: topic.level,
          weakAreas,
        }),
      });

      const data = await res.json();
      setContent(data.content);
      setLoading(false);
    }

    generate();
  }, [id, user, topic]);

  if (!topic) {
    return <div className="p-8 text-center text-gray-500">Lesson not found</div>;
  }

  async function markComplete() {
    if (!user) return;
    await updateUserProgress(user.uid, {
      [`progress.${id}`]: {
        completedAt: new Date().toISOString(),
        title: topic.title,
      },
    });
    router.push('/dashboard');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{topic.title}</h2>
          <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
            topic.level === 'beginner' ? 'bg-green-100 text-green-700' :
            topic.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {topic.level}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm border prose prose-sm max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}

      {!loading && (
        <button
          onClick={markComplete}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Mark as Complete
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Install react-markdown**

Run:
```powershell
npm install react-markdown
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(dashboard\)/lessons/ src/lib/lessons/ src/app/api/lessons/
git commit -m "feat: add dynamic AI-generated lesson planning"
```

---

### Task 7: AI Tutor Chat Interface

**Files:**
- Create: `src/app/(dashboard)/tutor/page.tsx`
- Create: `src/components/ChatMessage.tsx`

- [ ] **Step 1: Create ChatMessage component**

Write `src/components/ChatMessage.tsx`:
```typescript
interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] p-4 rounded-lg ${
          role === 'user'
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white border rounded-bl-none'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create tutor page**

Write `src/app/(dashboard)/tutor/page.tsx`:
```typescript
'use client';
import { useState, FormEvent, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserData } from '@/lib/firebase/firestore';
import ChatMessage from '@/components/ChatMessage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function TutorPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your AI tutor. Ask me anything about your learning topics, or tell me what you'd like to study today!" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [weakAreas, setWeakAreas] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      getUserData(user.uid).then((data) => {
        if (data?.weakAreas) setWeakAreas(data.weakAreas as string[]);
      });
    }
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: '',
          weakAreas,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <h2 className="text-2xl font-bold mb-4">AI Tutor</h2>

      <div className="flex-1 overflow-y-auto bg-gray-100 p-4 rounded-lg">
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white border p-4 rounded-lg rounded-bl-none">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your AI tutor anything..."
          className="flex-1 border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/tutor/ src/components/ChatMessage.tsx
git commit -m "feat: add AI tutor chat interface"
```

---

### Task 8: Progress Tracking & Weak Area Analysis

**Files:**
- Create: `src/app/(dashboard)/progress/page.tsx`
- Create: `src/app/api/progress/analyze/route.ts`
- Modify: `src/app/(dashboard)/lessons/[id]/page.tsx` (add weak area tracking)

- [ ] **Step 1: Create progress analysis API**

Write `src/app/api/progress/analyze/route.ts`:
```typescript
import { openai } from '@/lib/openai/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { completedLessons, quizResults } = await req.json();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a learning analytics assistant. Analyze the intern\'s progress and identify weak areas. Return a JSON object with: { weakAreas: string[], recommendations: string[] }',
        },
        {
          role: 'user',
          content: `Completed lessons: ${JSON.stringify(completedLessons)}
Quiz results: ${JSON.stringify(quizResults)}

Analyze and identify weak areas and give learning recommendations.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Progress analysis error:', error);
    return NextResponse.json(
      { weakAreas: [], recommendations: ['Complete more lessons for analysis'] },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Modify lesson page to track quiz results as weak areas**

Modify `src/app/(dashboard)/lessons/[id]/page.tsx` — add after the `markComplete` function, a simple quiz tracking mechanic. Add this state and UI within the lesson page:
```typescript
// Add these states at top of component
const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
```

Add a quiz section before the "Mark as Complete" button:
```typescript
// Place these inside the return, after the content rendering and before markComplete button
{!loading && content && (
  <div className="bg-white p-6 rounded-lg shadow-sm border mt-6">
    <h3 className="font-semibold text-lg mb-4">Quick Check</h3>
    <p className="text-sm text-gray-600 mb-4">
      Did you understand this lesson? Rate your understanding:
    </p>
    <div className="flex gap-2">
      {['Needs Review', 'Somewhat Clear', 'Clear', 'Mastered'].map((label, i) => (
        <button
          key={label}
          onClick={async () => {
            if (!user) return;
            const level = i + 1;
            // Track weak areas — if rating is 1 or 2, add to weak areas
            if (level <= 2) {
              const userData = await getUserData(user.uid);
              const currentWeak = (userData?.weakAreas as string[]) || [];
              if (!currentWeak.includes(topic.title)) {
                await updateUserProgress(user.uid, {
                  weakAreas: [...currentWeak, topic.title],
                });
              }
            }
            setQuizAnswers({ 0: level });
          }}
          className={`px-4 py-2 rounded text-sm border transition-colors ${
            quizAnswers[0] === i + 1
              ? 'bg-blue-100 border-blue-500 text-blue-700'
              : 'hover:bg-gray-100'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 3: Create progress page**

Write `src/app/(dashboard)/progress/page.tsx`:
```typescript
'use client';
import { useAuth } from '@/context/AuthContext';
import { getUserData, updateUserProgress } from '@/lib/firebase/firestore';
import { useEffect, useState } from 'react';

interface ProgressData {
  progress?: Record<string, { completedAt: string; title: string }>;
  weakAreas?: string[];
}

export default function ProgressPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ProgressData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (user) {
      getUserData(user.uid).then((d) => setData(d as ProgressData));
    }
  }, [user]);

  async function runAnalysis() {
    if (!user || !data?.progress) return;
    setAnalyzing(true);

    try {
      const res = await fetch('/api/progress/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedLessons: data.progress,
          quizResults: [],
        }),
      });

      const result = await res.json();
      if (result.weakAreas) {
        await updateUserProgress(user.uid, { weakAreas: result.weakAreas });
        setData((prev) =>
          prev ? { ...prev, weakAreas: result.weakAreas } : prev
        );
      }
    } catch (e) {
      console.error('Analysis failed:', e);
    } finally {
      setAnalyzing(false);
    }
  }

  const completedCount = data?.progress ? Object.keys(data.progress).length : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold">Your Progress</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-gray-600">Completed</h3>
          <p className="text-3xl font-bold mt-2">{completedCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-gray-600">Weak Areas</h3>
          <p className="text-3xl font-bold mt-2">{data?.weakAreas?.length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-gray-600">Analysis</h3>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {/* Weak Areas */}
      {data?.weakAreas && data.weakAreas.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-3">Areas to Improve</h3>
          <div className="flex flex-wrap gap-2">
            {data.weakAreas.map((area) => (
              <span
                key={area}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Completed Lessons */}
      {data?.progress && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-3">Completed Lessons</h3>
          {Object.entries(data.progress).length === 0 ? (
            <p className="text-gray-500 text-sm">No lessons completed yet.</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(data.progress).map(([id, lesson]) => (
                <li key={id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span>{lesson.title}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(lesson.completedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/progress/ src/app/api/progress/
git commit -m "feat: add progress tracking and weak area analysis"
```

---

### Task 9: Root Page Redirect & Polish

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update root page**

Write `src/app/page.tsx`:
```typescript
'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.push(user ? '/dashboard' : '/login');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add root redirect based on auth state"
```

---

### Task 10: Firebase Security Rules

**Files:**
- Create: `firestore.rules`
- Create: `firebase.json`

- [ ] **Step 1: Create security rules**

Write `firestore.rules`:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Write `firebase.json`:
```json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add firestore.rules firebase.json
git commit -m "chore: add Firestore security rules"
```

---

### Task 11: Test & Verify

- [ ] **Step 1: Build the project**

Run:
```powershell
npm run build
```

Expected: Successful build with no errors.

- [ ] **Step 2: Start dev server and verify**

Run:
```powershell
npm run dev
```

- [ ] **Step 3: Verify all routes**

Check:
- `/` redirects to `/login` when unauthenticated
- `/login` and `/signup` render and submit
- After login, `/dashboard` shows stats
- `/lessons` lists modules
- `/lessons/js-basics` generates AI lesson
- `/tutor` allows chat
- `/progress` shows data

- [ ] **Step 4: Final commit if any fixes**

```bash
git add -A
git commit -m "fix: address build issues"
```
