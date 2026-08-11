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
  { id: 'html-css', title: 'HTML & CSS Essentials', level: 'beginner' as const },
  { id: 'typescript', title: 'TypeScript Deep Dive', level: 'intermediate' as const },
  { id: 'nextjs', title: 'Next.js Full Stack', level: 'advanced' as const },
  { id: 'sql-basics', title: 'SQL & Databases', level: 'beginner' as const },
  { id: 'docker', title: 'Docker & Containers', level: 'advanced' as const },
];

// ---------------------------------------------------------------------------
// Reference resources: books + verified YouTube videos per topic
// ---------------------------------------------------------------------------

export interface LessonBook {
  title: string;
  author: string;
  url?: string;
  free?: boolean;
}

export interface LessonVideo {
  title: string;
  videoId: string;
  channel: string;
  duration?: string;
}

export interface LessonResource {
  books: LessonBook[];
  videos: LessonVideo[];
}

export const lessonResources: Record<string, LessonResource> = {
  'js-basics': {
    books: [
      { title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', url: 'https://eloquentjavascript.net/', free: true },
      { title: 'You Don\'t Know JS (YDKJS)', author: 'Kyle Simpson', url: 'https://github.com/getify/You-Dont-Know-JS', free: true },
      { title: 'JavaScript: The Definitive Guide', author: 'David Flanagan', url: 'https://www.oreilly.com/library/view/javascript-the-definitive/9781491952023/' },
    ],
    videos: [
      { title: 'Learn JavaScript - Full Course for Beginners', videoId: 'PkZNo7MFNFg', channel: 'freeCodeCamp.org', duration: '3h 26m' },
    ],
  },
  'react-fundamentals': {
    books: [
      { title: 'The Road to React', author: 'Robin Wieruch', url: 'https://www.roadtoreact.com/', free: true },
      { title: 'React Beta Documentation', author: 'React Team', url: 'https://react.dev/', free: true },
      { title: 'Learning React', author: 'Alex Banks & Eve Porcello' },
    ],
    videos: [
      { title: 'React JS Crash Course', videoId: 'w7ejDZ8SWv8', channel: 'Traversy Media', duration: '1h 48m' },
    ],
  },
  'node-api': {
    books: [
      { title: 'The Node.js Handbook', author: 'Flavio Copes', url: 'https://nodehandbook.com/', free: true },
      { title: 'Node.js Design Patterns', author: 'Mario Casciaro & Luciano Mammino' },
      { title: 'Express in Action', author: 'Evan Hahn' },
    ],
    videos: [
      { title: 'Node.js and Express.js - Full Course', videoId: 'Oe421EPjeBE', channel: 'freeCodeCamp.org', duration: '8h 16m' },
    ],
  },
  'python-data': {
    books: [
      { title: 'Python for Data Analysis', author: 'Wes McKinney', url: 'https://wesmckinney.com/book/', free: true },
      { title: 'Automate the Boring Stuff with Python', author: 'Al Sweigart', url: 'https://automatetheboringstuff.com/', free: true },
      { title: 'Pandas User Guide', author: 'Pandas Team', url: 'https://pandas.pydata.org/docs/', free: true },
    ],
    videos: [
      { title: 'Python for Data Science - Course for Beginners', videoId: 'LHBE6Q9XlzI', channel: 'freeCodeCamp.org', duration: '4h 52m' },
    ],
  },
  'git-workflow': {
    books: [
      { title: 'Pro Git', author: 'Scott Chacon & Ben Straub', url: 'https://git-scm.com/book/en/v2', free: true },
      { title: 'Git for Humans', author: 'David Demaree', url: 'https://learning.oreilly.com/library/view/git-for-humans/9781492052687/', free: true },
    ],
    videos: [
      { title: 'Git and GitHub for Beginners - Crash Course', videoId: 'RGOj5yH7evk', channel: 'freeCodeCamp.org', duration: '1h 8m' },
    ],
  },
  'html-css': {
    books: [
      { title: 'HTML & CSS: Design and Build Websites', author: 'Jon Duckett' },
      { title: 'MDN Web Docs - HTML & CSS', author: 'Mozilla', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML', free: true },
      { title: 'Interneting Is Hard', author: 'Oliver James', url: 'https://www.internetingishard.com/', free: true },
    ],
    videos: [
      { title: 'Learn HTML5 and CSS3 From Scratch - Full Course', videoId: 'mU6anWqZJcc', channel: 'freeCodeCamp.org', duration: '4h 1m' },
    ],
  },
  'typescript': {
    books: [
      { title: 'TypeScript Handbook', author: 'TypeScript Team', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', free: true },
      { title: 'TypeScript Deep Dive', author: 'Basarat Ali Syed', url: 'https://basarat.gitbook.io/typescript/', free: true },
      { title: 'Programming TypeScript', author: 'Boris Cherny' },
    ],
    videos: [
      { title: 'TypeScript Course for Beginners - Learn TypeScript from Scratch!', videoId: 'BwuLxPH8IDs', channel: 'freeCodeCamp.org', duration: '12h 21m' },
    ],
  },
  'nextjs': {
    books: [
      { title: 'Next.js Documentation', author: 'Vercel', url: 'https://nextjs.org/docs', free: true },
      { title: 'The Next.js Handbook', author: 'Flavio Copes', url: 'https://nextjs.org/learn', free: true },
    ],
    videos: [
      { title: 'Introduction to Next.js - NextJS Tutorial for Beginners', videoId: 'DZKOunP-WLQ', channel: 'Codevolution', duration: '1h 27m' },
    ],
  },
  'sql-basics': {
    books: [
      { title: 'SQL in 10 Minutes, a Day (Sams Teach Yourself)', author: 'Ben Forta' },
      { title: 'SQLBolt - Interactive SQL Tutorial', author: 'SQLBolt', url: 'https://sqlbolt.com/', free: true },
      { title: 'PostgreSQL Tutorial', author: 'PostgreSQL Tutorial Team', url: 'https://www.postgresqltutorial.com/', free: true },
    ],
    videos: [
      { title: 'SQL Tutorial - Full Database Course for Beginners', videoId: 'HXV3zeQKqGY', channel: 'freeCodeCamp.org', duration: '4h 20m' },
    ],
  },
  'docker': {
    books: [
      { title: 'Docker Deep Dive', author: 'Nigel Poulton' },
      { title: 'The Docker Handbook', author: 'freeCodeCamp', url: 'https://www.freecodecamp.org/news/the-docker-handbook/', free: true },
      { title: 'Docker Documentation', author: 'Docker Inc.', url: 'https://docs.docker.com/', free: true },
    ],
    videos: [
      { title: 'Docker Tutorial for Beginners [FULL COURSE in 3 Hours]', videoId: '3c-iBn73dDE', channel: 'TechWorld with Nana', duration: '3h 3m' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Comprehensive lesson content (markdown, rendered with ReactMarkdown)
// ---------------------------------------------------------------------------

export const lessonContent: Record<string, string> = {
  'js-basics': `## Overview

JavaScript is the programming language of the web. It powers interactivity on nearly every website you visit and is now a full-stack language that runs on servers (Node.js), mobile apps (React Native), and desktop apps (Electron). For an intern aiming to become an AI/software engineer, JavaScript is your entry point into web development — and its fundamentals transfer to TypeScript, React, Next.js, and Node.js.

> **What you'll learn:** variables, data types, operators, control flow, functions, arrays, objects, and closures — enough to write clean, working programs and start building real projects.

---

## Core Concepts

### 1. Variables — let, const, and var

Variables store values so you can reuse them. Modern JavaScript prefers \`let\` (values that change) and \`const\` (values that never change). Avoid \`var\` — it has confusing scoping rules.

\`\`\`js
let score = 0;           // can be reassigned later
score = 10;              // ✅ allowed

const appName = "Internee";  // cannot be reassigned
// appName = "Other";        // ❌ TypeError: Assignment to constant variable

var oldWay = "avoid this";   // function-scoped, avoid in modern code
\`\`\`

**Rule of thumb:** use \`const\` by default, switch to \`let\` only when you must reassign the variable.

### 2. Primitive Data Types

JavaScript has 7 primitive types — values that are not objects:

| Type | Example | Notes |
|------|---------|-------|
| \`number\` | \`42\`, \`3.14\` | All numbers are floats under the hood |
| \`string\` | \`"hello"\` | Single, double, or backtick quotes |
| \`boolean\` | \`true\` / \`false\` | Logical true/false |
| \`undefined\` | \`let x;\` | Declared but no value assigned |
| \`null\` | \`null\` | Explicitly "nothing" |
| \`symbol\` | \`Symbol('id')\` | Unique identifiers |
| \`bigint\` | \`10n\` | Very large integers |

\`\`\`js
let message = "Hello";       // string
let count = 5;               // number
let isReady = false;         // boolean
let nothing = null;          // null
let notAssigned;             // undefined
\`\`\`

### 3. Operators

JavaScript supports arithmetic, comparison, logical, and assignment operators.

\`\`\`js
// Arithmetic
let sum = 5 + 3;          // 8
let quotient = 10 / 4;    // 2.5 (always float division)

// Comparison — the strict triple equals is almost always what you want
console.log(5 == "5");    // true  (loose — converts types, avoid!)
console.log(5 === "5");   // false (strict — compares type AND value) ✅

// Logical
let isAdult = age >= 18 && hasId === true;   // AND
let canEnter = isAdult || hasInvite;          // OR
let notAllowed = !isAdult;                    // NOT
\`\`\`

### 4. Control Flow — conditionals and loops

\`\`\`js
// if / else if / else
let grade = 85;
if (grade >= 90) {
  console.log("A");
} else if (grade >= 80) {
  console.log("B");
} else {
  console.log("Keep practicing!");
}

// for loop
for (let i = 0; i < 5; i++) {
  console.log(i);          // 0 1 2 3 4
}

// while loop
let j = 0;
while (j < 3) {
  console.log(j);
  j++;
}
\`\`\`

### 5. Functions

Functions are reusable blocks of code. In modern JS you'll mostly write **arrow functions**, but classic \`function\` declarations still appear everywhere.

\`\`\`js
// Function declaration
function greet(name) {
  return "Hello, " + name + "!";
}

// Arrow function (modern, preferred for callbacks)
const add = (a, b) => a + b;

// Function with default parameter
function multiply(a, b = 1) {
  return a * b;
}

console.log(greet("Intern"));   // "Hello, Intern!"
console.log(add(2, 3));         // 5
console.log(multiply(4));       // 4 (b defaults to 1)
\`\`\`

### 6. Arrays

Arrays hold ordered collections. They have powerful built-in methods for transformation.

\`\`\`js
const fruits = ["apple", "banana", "cherry"];

fruits.push("date");            // add to end
fruits.pop();                   // remove from end
fruits[0];                      // "apple"

// Iteration
fruits.forEach(f => console.log(f));

// Transformation (functional style — very common in React)
const lengths = fruits.map(f => f.length);      // [5, 6, 6]
const long = fruits.filter(f => f.length > 5);  // ["banana", "cherry"]
const total = [1, 2, 3].reduce((sum, n) => sum + n, 0); // 6
\`\`\`

### 7. Objects

Objects group related data and behavior into named key/value pairs.

\`\`\`js
const intern = {
  name: "Sohaib",
  skills: ["JavaScript", "Python"],
  greet() {
    return \`Hi, I'm \${this.name}\`;
  },
};

console.log(intern.name);        // "Sohaib"
console.log(intern["skills"]);   // ["JavaScript", "Python"]
console.log(intern.greet());     // "Hi, I'm Sohaib"
\`\`\`

### 8. Closures — the key to advanced JavaScript

A **closure** is a function that "remembers" the variables from the scope where it was created, even after that outer scope has finished executing. It's one of the most frequently asked interview topics.

\`\`\`js
function outer(x) {
  return function inner(y) {
    return x + y;          // inner "closes over" x
  };
}

const add5 = outer(5);     // outer(5) has returned...
console.log(add5(3));      // ...but add5 still remembers x = 5 → 8

// Practical use: counter
function createCounter() {
  let count = 0;                       // private variable
  return {
    increment: () => ++count,
    getCount: () => count,
  };
}
const counter = createCounter();
counter.increment();       // 1
counter.increment();       // 2
\`\`\`

### 9. Async basics — promises and async/await

Web programming is full of slow operations (fetching data, calling APIs). JavaScript handles this asynchronously with Promises and \`async/await\`.

\`\`\`js
// A function that returns a Promise
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) resolve({ id, name: "Intern" });
      else reject(new Error("Invalid id"));
    }, 1000);
  });
}

// Consuming with async/await (clean, modern)
async function showUser() {
  try {
    const user = await fetchUser(1);
    console.log(user.name);       // "Intern"
  } catch (err) {
    console.error(err.message);
  }
}
\`\`\`

---

## Common Pitfalls

1. **Using \`==\` instead of \`===\`** — loose equality silently converts types (\`0 == false\` is \`true\`). Always use strict equality.
2. **Ignoring \`const\`/ \`let\` scope** — redeclaring a variable with \`let\` in the same scope throws an error; \`var\` hoists confusingly.
3. **Calling a function before it's defined with arrow functions** — arrow functions are not hoisted, so define them before use.
4. **Mutating arrays/objects while iterating** — prefer \`.map()\`, \`.filter()\`, \`.reduce()\` over manual loops with side effects.
5. **Forgetting \`await\`** — forgetting \`await\` returns a Promise, not the value, causing "Promise {<pending>}" bugs.

---

## Practice Exercises

1. **Temperature converter:** write a function \`celsiusToFahrenheit(c)\` and one \`fahrenheitToCelsius(f)\`. Test with known values (0°C = 32°F, 100°C = 212°F).
2. **Array toolkit:** given \`const numbers = [4, 9, 16, 25, 36]\`, use \`.map()\` to get square roots, \`.filter()\` to keep only even results, and \`.reduce()\` to sum them.
3. **Closure counter:** build \`createCounter(start)\` that returns \`{ increment, decrement, getValue }\`. Each counter must be independent.
4. **Async data fetcher:** write an \`async\` function that fetches a user profile from \`https://jsonplaceholder.typicode.com/users/1\` and logs the name, wrapped in try/catch.
5. **FizzBuzz:** print numbers 1–100, but print "Fizz" for multiples of 3, "Buzz" for multiples of 5, and "FizzBuzz" for both.

---

## Self-Assessment

1. What is the difference between \`let\`, \`const\`, and \`var\`?
2. Why should you use \`===\` instead of \`==\`?
3. What does \`.map()\` return compared to \`.forEach()\`?
4. Explain what a closure is and give one real-world use case.
5. What's the difference between a Promise's \`.then()\` chain and \`async/await\`?
`,
  'react-fundamentals': `## Overview

React is a JavaScript library for building user interfaces. Instead of manually manipulating the DOM with jQuery-style code, you describe **what** the UI should look like with components and let React figure out **how** to update it efficiently. It's the foundation of Next.js (which you'll learn later), and powers companies like Facebook, Netflix, Airbnb, and Uber.

> **What you'll learn:** components, JSX, props, state, hooks, event handling, conditional rendering, and lists — the core mental model of React.

---

## Core Concepts

### 1. Components — the building blocks

A component is a function that returns UI (JSX). Components are composable: you build small pieces and combine them.

\`\`\`tsx
// A simple function component
function Welcome({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>;
}

// Using it
function App() {
  return (
    <div>
      <Welcome name="Sohaib" />
      <Welcome name="Internee" />
    </div>
  );
}
\`\`\`

### 2. JSX — JavaScript + HTML

JSX looks like HTML but is JavaScript. You can embed any JavaScript expression inside \`{}\`. This is how dynamic content gets into your UI.

\`\`\`tsx
const user = { name: "Sohaib", role: "Intern" };

function Greeting() {
  return (
    <div className="card">
      <h2>{user.name}</h2>
      <p>{user.role.toUpperCase()}</p>
      <p>{2 + 2}</p>                 {/* expressions work */}
    </div>
  );
}
\`\`\`

**Key differences from HTML:**
- Use \`className\` instead of \`class\`
- Use \`htmlFor\` instead of \`for\`
- All tags must self-close: \`<img />\`
- JavaScript expressions go in \`{...}\`

### 3. Props — passing data to components

Props (short for properties) are how parent components pass data to children. They're read-only — a component cannot modify its own props.

\`\`\`tsx
type CardProps = {
  title: string;
  completed: boolean;
  onToggle: () => void;
};

function TaskCard({ title, completed, onToggle }: CardProps) {
  return (
    <div onClick={onToggle} className={completed ? "done" : ""}>
      {completed ? "✅" : "⬜"} {title}
    </div>
  );
}
\`\`\`

### 4. State and the \`useState\` hook

State is data that lives *inside* a component and can change over time. When state changes, React re-renders the component automatically.

\`\`\`tsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  );
}
\`\`\`

**The golden rule:** never mutate state directly. Always use the setter (\`setCount\`). Mutating \`count\` directly won't trigger a re-render.

### 5. The \`useEffect\` hook — side effects

\`useEffect\` runs code after the component renders — perfect for fetching data, subscriptions, or updating the document title.

\`\`\`tsx
import { useState, useEffect } from "react";

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(\`/api/users/\${userId}\`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setUser(data);
      });
    return () => {
      cancelled = true;   // cleanup runs on unmount / re-run
    };
  }, [userId]);           // re-run when userId changes

  if (!user) return <p>Loading...</p>;
  return <p>{user.name}</p>;
}
\`\`\`

The dependency array \`[userId]\` controls *when* the effect re-runs:
- \`[]\` → runs once on mount
- \`[a, b]\` → re-runs when a or b change
- (nothing) → re-runs after **every** render (usually a mistake)

### 6. Event handling

React events are named with camelCase and take functions, not strings.

\`\`\`tsx
function Form() {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();          // stop page reload
    console.log("Submitted:", text);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type something..."
      />
      <button type="submit">Send</button>
    </form>
  );
}
\`\`\`

### 7. Conditional rendering

You can't use \`if\` inside JSX, but you have three idiomatic options:

\`\`\`tsx
function Status({ isLoggedIn }: { isLoggedIn: boolean }) {
  // 1. Ternary
  return <p>{isLoggedIn ? "Welcome back!" : "Please sign in"}</p>;

  // 2. Logical AND (renders the right side only if left is truthy)
  // return <div>{isLoggedIn && <p>Welcome back!</p>}</div>;

  // 3. Early return
  // if (!isLoggedIn) return <LoginForm />;
  // return <Dashboard />;
}
\`\`\`

### 8. Rendering lists with \`key\`

When rendering arrays, React needs a stable \`key\` to track each item across renders.

\`\`\`tsx
const topics = ["JS", "React", "Node"];

function TopicList() {
  return (
    <ul>
      {topics.map((topic, index) => (
        <li key={topic}>{topic}</li>   // use a stable id, not index when possible
      ))}
    </ul>
  );
}
\`\`\`

### 9. The component lifecycle in one sentence

- **Mount:** state initializes → render → effects run
- **Update:** state/props change → re-render → effects re-run (if deps changed)
- **Unmount:** cleanup functions from effects run

---

## Common Pitfalls

1. **Mutating state directly** — \`count += 1\` instead of \`setCount(count + 1)\` breaks re-rendering.
2. **Missing \`key\` on list items** — causes subtle rendering bugs and warnings.
3. **Infinite loops with \`useEffect\`** — if the effect sets state that changes the dependency, it re-runs forever.
4. **Calling hooks conditionally** — hooks must be called at the top level of the component, never inside \`if\` or loops.
5. **Forgetting the cleanup function** — leaving \`setInterval\` or subscriptions running causes memory leaks.

---

## Practice Exercises

1. **Counter with limits:** build a counter that disables "+" at 10 and "-" at 0.
2. **Todo list:** maintain an array of tasks in state; render them with \`map\` and \`key\`, add new ones from an input, and let users delete them.
3. **Fetching data:** a component that fetches from \`https://jsonplaceholder.typicode.com/todos\` and shows loading / error / data states using \`useEffect\`.
4. **Theme toggle:** a button that toggles between light/dark by setting a class on the document root.
5. **Parent-child interaction:** build a \`Parent\` holding state and two \`Child\` buttons that increment/decrement via props.

---

## Self-Assessment

1. What is the difference between props and state?
2. Why must you call hooks at the top level of a component?
3. What is the purpose of \`key\` in a list?
4. When does \`useEffect\` with \`[]\` run, and when does \`useEffect\` with no dependency array run?
5. Why should you never mutate state directly?
`,
  'node-api': `## Overview

Node.js lets you run JavaScript outside the browser — on servers. It's event-driven and non-blocking, which makes it extremely efficient for I/O-heavy work like web APIs. Combined with Express, the most popular Node web framework, you can build production-grade REST APIs. This is the backend that your React/Next.js frontend will talk to.

> **What you'll learn:** Node modules, the HTTP model, Express routes, middleware, request/response handling, error handling, and REST API design.

---

## Core Concepts

### 1. What is Node.js, really?

Node.js is a runtime built on Chrome's V8 JavaScript engine. It uses a **single-threaded, event-loop** model: instead of spawning a thread per request, it handles many connections on one thread using asynchronous callbacks. Long operations (DB queries, file reads, network calls) don't block others.

\`\`\`js
// Node modules — import built-ins and your own files
const fs = require("fs");          // file system
const path = require("path");      // path utilities
const http = require("http");      // http server
\`\`\`

Modern Node supports ES modules too:

\`\`\`js
import fs from "fs";
import { createServer } from "http";
\`\`\`

### 2. A bare HTTP server

\`\`\`js
import { createServer } from "http";

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Hello from Node!" }));
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
\`\`\`

This works, but hand-rolling routing, parsing, and middleware is painful. That's why we use **Express**.

### 3. Express — the web framework

\`\`\`js
import express from "express";

const app = express();
const port = process.env.PORT || 3000;

// Built-in middleware to parse JSON bodies
app.use(express.json());

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/api/users/:id", (req, res) => {
  res.json({ id: req.params.id, name: "Intern" });
});

app.post("/api/users", (req, res) => {
  // req.body comes from express.json()
  const { name } = req.body;
  res.status(201).json({ id: Date.now(), name });
});

app.listen(port, () => console.log(\`Listening on \${port}\`));
\`\`\`

### 4. REST API design

REST uses HTTP methods + URL paths to describe operations on resources. This is the **CRUD** pattern:

| HTTP Method | Path | Purpose | Typical Status |
|-------------|------|---------|----------------|
| \`GET\` | \`/api/users\` | List users | 200 |
| \`GET\` | \`/api/users/:id\` | Read one user | 200 |
| \`POST\` | \`/api/users\` | Create a user | 201 |
| \`PUT\` / \`PATCH\` | \`/api/users/:id\` | Update a user | 200 |
| \`DELETE\` | \`/api/users/:id\` | Delete a user | 204 |

**Design principles:**
- Use nouns (not verbs) for resources: \`/api/users\`, not \`/api/getUsers\`
- Use plural nouns for collections
- Nest for relationships: \`/api/users/:id/posts\`
- Return meaningful HTTP status codes
- Be stateless — each request carries what it needs (often a JWT token)

### 5. Middleware — the Express superpower

Middleware is any function that runs between the request and your route handler. It has access to \`req\`, \`res\`, and \`next\`.

\`\`\`js
// Logger middleware
app.use((req, res, next) => {
  console.log(\`\${req.method} \${req.url} at \${new Date().toISOString()}\`);
  next();                    // pass control to the next handler
});

// Auth middleware (guards protected routes)
function requireAuth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = verifyToken(token);   // decode the JWT
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Protect a route
app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
\`\`\`

Order matters: middleware registered with \`app.use()\` runs in order for every matching request.

### 6. Error handling

A well-designed API never crashes on bad input. Express lets you define a central error handler.

\`\`\`js
// Async wrapper so thrown errors reach the error handler
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get(
  "/api/users/:id",
  asyncHandler(async (req, res) => {
    const user = await db.findUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  })
);

// Central error handler — must be last
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});
\`\`\`

### 7. Environment variables

Secrets and configuration belong in environment variables, never hardcoded.

\`\`\`js
// .env  →  DB_URL=mongodb://... JWT_SECRET=super-secret
import "dotenv/config";

const config = {
  dbUrl: process.env.DB_URL,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || "development",
};

if (!config.jwtSecret) {
  throw new Error("JWT_SECRET is required");
}
\`\`\`

### 8. Validation & status codes cheat sheet

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid/malformed input |
| 401 | Unauthorized | Missing/invalid credentials |
| 403 | Forbidden | Authenticated but not allowed |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Unexpected server failure |

---

## Common Pitfalls

1. **Blocking the event loop** — using \`fs.readFileSync\` or \`for\` loops over huge data in a request handler stalls every other request. Always use async APIs.
2. **Not validating input** — trusting \`req.body\` leads to crashes and security holes. Validate with a library like \`zod\` or \`joi\`.
3. **Exposing secrets** — logging \`process.env\` or committing \`.env\` leaks API keys.
4. **No error handler** — unhandled async rejections crash the process. Always route to a central error handler.
5. **CORS misconfiguration** — forgetting \`cors()\` blocks browsers from calling your API from a different origin.

---

## Practice Exercises

1. **CRUD for a todo resource:** build \`GET/POST/PUT/DELETE /api/todos\` with an in-memory array. Validate that \`title\` is a non-empty string.
2. **Request logger:** write middleware that logs method, path, and response time for every request.
3. **Protected route:** add a simple \`requireAuth\` middleware that checks a hardcoded token (simulating JWT) and returns 401 without it.
4. **Central error handler:** make a route that throws, and confirm the client receives a clean JSON error with status 500.
5. **Async data:** simulate a database with a \`findUser\` that returns a Promise; handle the "not found" case with a 404.

---

## Self-Assessment

1. How does the Node.js event loop allow one thread to handle thousands of connections?
2. What is the difference between \`app.use()\` and \`app.get()\`?
3. Why is POST to \`/api/users\` better than GET to \`/api/createUser\` in REST?
4. What does calling \`next()\` in middleware do, and what happens if you forget it?
5. Why should error handling live in a central middleware rather than inline?
`,
  'python-data': `## Overview

Python is the dominant language for data science and machine learning. With libraries like NumPy (numerical computing), Pandas (data tables), and Matplotlib (visualization), you can load, clean, explore, and visualize real datasets in a few lines of code. This is the exact stack behind most data-analysis and AI pipelines.

> **What you'll learn:** Python basics, NumPy arrays, Pandas DataFrames, data cleaning, aggregation, and basic visualization.

---

## Core Concepts

### 1. Python essentials in 60 seconds

\`\`\`python
# Variables and types (dynamically typed)
name = "Sohaib"
age = 22
skills = ["python", "sql", "ai"]

# Functions
def greet(person):
    return f"Hello, {person}!"

# Conditionals and loops
if age >= 18:
    print("Adult")
for skill in skills:
    print(skill)

# List comprehensions — a Python superpower
squares = [n**2 for n in range(5)]   # [0, 1, 4, 9, 16]
\`\`\`

### 2. NumPy — fast numerical arrays

NumPy arrays are like Python lists but vectorized and *much* faster for math.

\`\`\`python
import numpy as np

# Create arrays
a = np.array([1, 2, 3, 4])
zeros = np.zeros((2, 3))         # 2x3 matrix of zeros
rng = np.arange(0, 10, 2)        # [0, 2, 4, 6, 8]

# Vectorized math (no loops needed!)
b = np.array([10, 20, 30, 40])
print(a + b)          # [11 22 33 44]
print(a * 2)          # [2 4 6 8]
print(a.mean())       # 2.5
print(a.sum())        # 10
\`\`\`

### 3. Pandas — tabular data made easy

Pandas' \`DataFrame\` is a 2D labeled table — think of a spreadsheet or an SQL table in Python.

\`\`\`python
import pandas as pd

# Create a DataFrame
df = pd.DataFrame({
    "name": ["Alice", "Bob", "Carol"],
    "score": [92, 78, 85],
    "city": ["Lahore", "Karachi", "Islamabad"],
})

# Read from CSV (the #1 real-world data source)
# df = pd.read_csv("data.csv")

# Explore
print(df.head(2))        # first 2 rows
print(df.shape)          # (3, 3) — rows, columns
print(df.dtypes)         # data types of each column
print(df.info())         # summary incl. missing values
\`\`\`

### 4. Selecting data — the critical skill

\`\`\`python
# Selecting a column (Series)
scores = df["score"]                 # or df.score

# Selecting multiple columns
subset = df[["name", "score"]]

# Selecting rows by condition (filtering)
passed = df[df["score"] >= 80]       # rows where score >= 80

# Selecting by position with .iloc
first_row = df.iloc[0]               # first row
# Selecting by label with .loc
row_named = df.loc[1]                # row with index label 1

# Combine: students who passed AND live in Lahore
result = df[(df["score"] >= 80) & (df["city"] == "Lahore")]
\`\`\`

### 5. Handling missing data

Real datasets always have gaps. Pandas gives you clean tools.

\`\`\`python
# Detect missing values
df.isnull()               # boolean mask per cell
df.isnull().sum()         # count per column

# Options: drop or fill
df_dropped = df.dropna()                        # remove rows with NaNs
df_filled = df.fillna(df["score"].mean())       # fill with column mean
df["score"] = df["score"].fillna(0)             # fill a column with 0
\`\`\`

### 6. Aggregation — group by

Grouping is how you answer questions like "what's the average score per city?"

\`\`\`python
# Average score by city
by_city = df.groupby("city")["score"].mean()

# Multiple aggregations at once
summary = df.groupby("city")["score"].agg(["mean", "max", "count"])
\`\`\`

### 7. Visualization with Matplotlib

\`\`\`python
import matplotlib.pyplot as plt

# Line plot
plt.plot([1, 2, 3, 4], [1, 4, 9, 16])
plt.title("Squares")
plt.show()

# Bar chart from groupby result
by_city.plot(kind="bar")
plt.title("Average Score by City")
plt.show()

# Histogram
df["score"].hist(bins=10)
plt.show()
\`\`\`

### 8. A complete mini-analysis pipeline

\`\`\`python
import pandas as pd
import matplotlib.pyplot as plt

# 1. Load
df = pd.read_csv("students.csv")

# 2. Clean
df = df.dropna(subset=["score"])

# 3. Explore
print(df.describe())                    # count/mean/std/min/max

# 4. Aggregate
avg_by_city = df.groupby("city")["score"].mean().sort_values(ascending=False)

# 5. Visualize
avg_by_city.plot(kind="bar")
plt.show()
\`\`\`

---

## Common Pitfalls

1. **Chained indexing** — \`df[df.x > 5]["y"]\` is fragile and warns. Use \`df.loc[df.x > 5, "y"]\`.
2. **Setting values on a copy** — \`df2 = df[df.score > 80]; df2["new"] = 1\` may not affect \`df\`. Use \`.copy()\` when you intend to modify.
3. **Forgetting \`df.shape\` / \`df.info()\`** — skipping exploration leads to surprises (wrong dtypes, missing data).
4. **Using Python loops on DataFrames** — vectorized Pandas operations are 100x+ faster. Avoid \`df.iterrows()\` for math.
5. **Not handling NaN before plotting/math** — \`mean()\` silently skips NaNs, which can mislead you.

---

## Practice Exercises

1. **CSV exploration:** download a public CSV (e.g., a dataset on Kaggle or from \`data.gov\`), load it, and print \`head()\`, \`info()\`, \`describe()\`, and \`isnull().sum()\`.
2. **Filtering:** from that dataset, filter to rows meeting one numeric condition and one categorical condition; report the row count.
3. **Grouped stats:** group by a categorical column and compute mean + count for a numeric column.
4. **Cleaning:** fill missing numeric values with the column median, then confirm no NaNs remain.
5. **Visualize:** produce a bar chart and a histogram with labels and a title.

---

## Self-Assessment

1. What is the difference between \`df[df["score"] > 80]\` and \`df.loc[df["score"] > 80]\`?
2. Why are NumPy/Pandas operations faster than Python loops?
3. What does \`df.groupby("city")["score"].mean()\` return?
4. What is the difference between \`.dropna()\` and \`.fillna()\`?
5. What does \`df.describe()\` show and why check it first?
`,
  'git-workflow': `## Overview

Git is the version control system used by virtually every software team on the planet. It tracks every change to your code, lets you experiment on branches without breaking things, and powers collaboration through platforms like GitHub and GitLab. For an intern, knowing Git is non-negotiable — it's how you'll submit work and review others'.

> **What you'll learn:** the core Git workflow (clone, add, commit, push, pull), branching, merging, resolving conflicts, and pull requests.

---

## Core Concepts

### 1. Why version control?

Version control lets you:
- **Undo mistakes** — travel back to any point in history
- **Collaborate safely** — many people work on one codebase
- **Experiment freely** — branches isolate changes
- **Audit** — see who changed what and when

Think of it as a time machine for your code with a "save point" at every commit.

### 2. The core workflow — add, commit, push

The basic rhythm of Git is: **stage → commit → push**.

\`\`\`bash
# First-time setup (do once per machine)
git config --global user.name "Sohaib Khattak"
git config --global user.email "you@example.com"

# Start tracking a project
git init                    # create a repo in the current folder
git status                  # see what changed (use this constantly!)

# The three-step save
git add .                   # 1. stage all changes
git commit -m "Add login feature"   # 2. save a snapshot
git push origin main        # 3. upload to the remote (GitHub)
\`\`\`

### 3. The three areas of Git

\`\`\`text
Working Directory ──git add──▶ Staging Area ──git commit──▶ Repository (.git)
        ▲                                                    │
        └────────────── git pull / checkout ◀────────────────┘
\`\`\`

- **Working directory** — the files you're editing
- **Staging area (index)** — changes marked for the next commit
- **Repository** — the committed history

### 4. Inspecting history

\`\`\`bash
git log                  # full history
git log --oneline        # compact one-line history
git diff                 # unstaged changes
git diff --staged        # staged changes
git show <commit-hash>   # what a specific commit changed
\`\`\`

### 5. Branching — your safe space to experiment

A branch is a movable pointer to a commit. The default branch is usually \`main\` (or \`master\`).

\`\`\`bash
# Create and switch to a new branch
git checkout -b feature/login

# Work... commit...
git add .
git commit -m "Implement login page"

# Switch back to main
git checkout main

# Merge the feature into main
git merge feature/login

# Delete the merged branch
git branch -d feature/login

# See all branches
git branch
\`\`\`

**Best practice:** never commit directly to \`main\`. Always work on a feature branch, then merge via a pull request.

### 6. Remotes — connecting to GitHub

\`\`\`bash
# Clone an existing project
git clone https://github.com/user/project.git
cd project

# Link a local repo to a remote
git remote add origin https://github.com/user/project.git
git remote -v            # view remotes

# Push your branch to GitHub
git push origin feature/login

# Get the latest from the remote
git pull                 # fetch + merge
\`\`\`

### 7. Pull requests — the review process

A pull request (PR) is a formal proposal to merge one branch into another. Teams use it to review, comment, and discuss code before it lands:

1. Create a feature branch and commit your work
2. \`git push origin feature/xyz\`
3. On GitHub, click **"Compare & pull request"**
4. Write a clear description
5. Reviewers comment → you push more commits → reviewers approve
6. Merge (squash, merge, or rebase)

### 8. Resolving merge conflicts

When two branches change the same lines, Git can't auto-merge. You'll see conflict markers:

\`\`\`text
<<<<<<< HEAD
function greet() { return "Hello from main"; }
=======
function greet() { return "Hi from feature"; }
>>>>>>> feature/login
\`\`\`

Fix it by choosing/combining the code and removing the markers, then:

\`\`\`bash
git add README.md
git commit -m "Resolve merge conflict in README"
\`\`\`

### 9. Undoing things safely

\`\`\`bash
# Unstage a file (keep changes)
git reset HEAD file.txt

# Discard unstaged changes to a file
git checkout -- file.txt

# Undo the last commit but KEEP the changes
git reset --soft HEAD~1

# Move to a previous commit entirely (careful!)
git reset --hard <commit-hash>

# Look at a previous state without moving
git log --oneline
\`\`\`

---

## Common Pitfalls

1. **Committing secrets** — never commit \`.env\` files or API keys. Add them to \`.gitignore\` first.
2. **Vague commit messages** — \`git commit -m "stuff"\` is useless later. Write \`"Fix: handle empty cart on checkout"\`.
3. **Committing directly to main** — always branch for features/bugfixes.
4. **\`git add .\` without checking** — you may stage build artifacts or secrets. Run \`git status\` and \`git diff\` first.
5. **Pulling over uncommitted changes** — commit or stash (\`git stash\`) before \`git pull\` to avoid conflicts.
6. **Forgetting \`git pull\` before pushing** — your push gets rejected if the remote moved ahead. Pull first, resolve, then push.

---

## Practice Exercises

1. **Init & first commit:** \`git init\` a folder, create a file, commit it, and inspect \`git log --oneline\`.
2. **Branch & merge:** create \`feature/greeting\`, add a function, commit, return to \`main\`, and merge.
3. **Simulate a conflict:** on two branches, edit the *same line* differently, merge, and resolve the conflict by hand.
4. **Push to GitHub:** create a repo on GitHub, push your branch, and open a pull request.
5. **Undo drill:** commit a mistake, then practice \`git reset --soft HEAD~1\` to undo while keeping changes.

---

## Self-Assessment

1. What is the difference between \`git add\`, \`git commit\`, and \`git push\`?
2. What does the staging area do?
3. Why should you use feature branches instead of committing to main?
4. What is a merge conflict and how do you resolve one?
5. What commands would you run to get the latest code from the remote before starting work?
`,
  'html-css': `## Overview

HTML (HyperText Markup Language) gives web pages **structure**; CSS (Cascading Style Sheets) gives them **presentation**. Together they are the foundation of the web — every framework (React, Next.js, Vue) ultimately renders to HTML and CSS. Understanding them deeply makes you a better front-end developer, not just a framework user.

> **What you'll learn:** semantic HTML, forms, CSS selectors, the box model, Flexbox, Grid, and responsive design.

---

## Core Concepts

### 1. HTML document structure

\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Page</title>
  </head>
  <body>
    <h1>Hello, world!</h1>
    <p>This is a paragraph.</p>
  </body>
</html>
\`\`\`

The \`head\` holds metadata (title, links to CSS, viewport settings); the \`body\` holds visible content.

### 2. Semantic HTML — structure with meaning

Semantic tags describe *what* content is, improving accessibility and SEO:

\`\`\`html
<header>Site header / navigation</header>
<nav>Links</nav>
<main>
  <article>
    <h2>Article title</h2>
    <section>Subsection of the article</section>
  </article>
</main>
<aside>Sidebar</aside>
<footer>Footer info</footer>
\`\`\`

**Why it matters:** screen readers rely on landmarks, search engines rank semantic structure, and your code becomes self-documenting. Use \`<div>\`/ \`<span>\` only when no semantic tag fits.

### 3. Common elements

\`\`\`html
<!-- Headings: h1 → h6 (one h1 per page) -->
<h1>Main title</h1>

<!-- Text -->
<p>Paragraph</p>
<strong>Bold text</strong>  <em>Italic text</em>
<blockquote>Quoted block</blockquote>

<!-- Links & images -->
<a href="https://example.com" target="_blank">Open in new tab</a>
<img src="photo.jpg" alt="A description for accessibility" />

<!-- Lists -->
<ul><li>Unordered</li></ul>
<ol><li>Ordered</li></ol>

<!-- Divisions -->
<div class="card">Generic block container</div>
<span class="badge">Generic inline container</span>
\`\`\`

### 4. Forms — collecting user input

\`\`\`html
<form action="/submit" method="POST">
  <label for="name">Name</label>
  <input type="text" id="name" name="name" placeholder="Your name" required />

  <label for="email">Email</label>
  <input type="email" id="email" name="email" required />

  <label for="level">Skill level</label>
  <select id="level" name="level">
    <option value="beginner">Beginner</option>
    <option value="advanced">Advanced</option>
  </select>

  <label for="bio">Bio</label>
  <textarea id="bio" name="bio" rows="3"></textarea>

  <label>
    <input type="checkbox" name="agree" /> I agree to the terms
  </label>

  <button type="submit">Submit</button>
</form>
\`\`\`

Always pair inputs with \`<label>\` for accessibility, and use \`type="email"\`/ \`type="password"\` for correct keyboard + validation.

### 5. CSS — how styles apply

CSS rules target elements with **selectors**:

\`\`\`css
/* Element selector */
p { color: #555; }

/* Class selector (reusable) */
.card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; }

/* ID selector (unique, avoid overusing) */
#hero { background: #f3e8ff; }

/* Descendant selector */
.card h2 { font-size: 1.25rem; }

/* Pseudo-class — hover state */
button:hover { background: #9333ea; }
\`\`\`

### 6. The box model — everything is a box

Every element is a box: **content → padding → border → margin**.

\`\`\`css
.box {
  width: 200px;
  padding: 20px;      /* space inside, around content */
  border: 2px solid #333;
  margin: 16px;       /* space outside, between boxes */
}
\`\`\`

With the default \`box-sizing: content-box\`, \`width\` measures only content. Almost all projects switch to:

\`\`\`css
* { box-sizing: border-box; }
\`\`\`

...so \`width\` includes padding and border — much easier to reason about.

### 7. Flexbox — one-dimensional layout

Flexbox arranges items in a row or column, handling alignment and spacing elegantly.

\`\`\`css
.navbar {
  display: flex;
  justify-content: space-between;  /* main axis */
  align-items: center;             /* cross axis */
  gap: 12px;
}

.cards {
  display: flex;
  flex-wrap: wrap;
}
\`\`\`

\`\`\`html
<div class="navbar">
  <h1>Brand</h1>
  <nav><a>Home</a> <a>About</a> <a>Contact</a></nav>
</div>
\`\`\`

### 8. CSS Grid — two-dimensional layout

Grid handles rows *and* columns, ideal for page layouts.

\`\`\`css
.dashboard {
  display: grid;
  grid-template-columns: repeat(12, 1fr);  /* 12 equal columns */
  gap: 16px;
}

.sidebar {
  grid-column: span 3;
}

.main {
  grid-column: span 9;
}
\`\`\`

### 9. Responsive design — media queries

Make layouts adapt to any screen size with breakpoints.

\`\`\`css
.container {
  display: grid;
  grid-template-columns: 1fr;            /* 1 column on mobile */
  gap: 16px;
}

@media (min-width: 768px) {
  .container {
    grid-template-columns: repeat(2, 1fr);  /* 2 columns on tablet+ */
  }
}

@media (min-width: 1024px) {
  .container {
    grid-template-columns: repeat(3, 1fr);  /* 3 columns on desktop */
  }
}
\`\`\`

Also use flexible units: \`rem\` (relative to root font size), \`%\`, \`vw/vh\`, and \`flex/grid\` over hardcoded pixel widths.

---

## Common Pitfalls

1. **Skipping \`alt\` attributes on images** — breaks accessibility and SEO.
2. **Using \`<div>\` for everything** — replace with semantic tags where possible.
3. **Inline styles** — \`style="..."\` for everything fights CSS and can't reuse or respond to media queries. Use classes.
4. **Fixed pixel widths everywhere** — layouts break on smaller screens. Use \`max-width\`, \`%\`, \`flex\`, \`grid\`, \`rem\`.
5. **Ignoring \`box-sizing\`** — layout math gets confusing; set \`* { box-sizing: border-box }\`.
6. **No viewport meta tag** — without \`<meta name="viewport">\`, mobile browsers render a zoomed-out desktop page.

---

## Practice Exercises

1. **Semantic page:** build a blog post page using \`header\`, \`nav\`, \`main\`, \`article\`, \`aside\`, \`footer\`.
2. **Styled card:** create a product card (image, title, price, button) with the box model, hover effects, and rounded corners.
3. **Flexbox navbar:** a navbar with brand on the left and links on the right using \`justify-content: space-between\`.
4. **Responsive grid:** a gallery that's 1 column on mobile, 2 on tablet, 3 on desktop using media queries.
5. **Accessible form:** a signup form with proper \`<label>\`s, input types, \`required\`, and a submit button.

---

## Self-Assessment

1. What is the difference between semantic and non-semantic HTML? Give examples.
2. What does \`box-sizing: border-box\` do and why is it useful?
3. When would you use Flexbox versus CSS Grid?
4. What is a media query and what problem does it solve?
5. Why is the \`alt\` attribute important on images?
`,
  'typescript': `## Overview

TypeScript is a **typed superset of JavaScript** — everything valid in JS is valid in TS, but TS adds static types that catch entire categories of bugs *before* your code runs. It's the language behind Next.js, React, Angular, and most serious modern projects. This project itself is written in TypeScript.

> **What you'll learn:** type annotations, interfaces, type aliases, unions, generics, utility types, and the TypeScript config.

---

## Core Concepts

### 1. Type annotations — the basics

You declare the shape of data and TypeScript checks your work at compile time.

\`\`\`ts
let age: number = 22;
let name: string = "Sohaib";
let isAdmin: boolean = false;
let scores: number[] = [92, 88, 95];
let anything: any = "careful";     // any disables checking — avoid

// Function parameters and return types
function add(a: number, b: number): number {
  return a + b;
}

// Optional and default parameters
function greet(name: string, greeting: string = "Hello"): string {
  return \`\${greeting}, \${name}\`;
}
\`\`\`

### 2. Type inference — TS figures most of it out

You don't have to annotate everything. TypeScript infers types from values.

\`\`\`ts
let count = 5;            // inferred as number
const title = "Internee"; // inferred as "Internee" (literal type)

// This errors because count is a number:
// count = "hello";   ❌ Type 'string' is not assignable to type 'number'
\`\`\`

### 3. Interfaces — contracts for object shapes

\`\`\`ts
interface User {
  id: number;
  name: string;
  email?: string;          // optional
  readonly createdAt: string;  // cannot be reassigned
}

const intern: User = {
  id: 1,
  name: "Sohaib",
  createdAt: "2026-08-01",
};

// A function that accepts the interface
function formatUser(user: User): string {
  return \`\${user.name} (id: \${user.id})\`;
}
\`\`\`

### 4. Type aliases vs interfaces

\`\`\`ts
// Type alias — good for unions, primitives, and function types
type ID = string | number;
type Status = "pending" | "active" | "done";

// Interface — good for object contracts; can be extended
interface BaseUser { id: string; }
interface AdminUser extends BaseUser { permissions: string[]; }

// Type alias can also describe objects
type Point = { x: number; y: number };
\`\`\`

**Rule of thumb:** use \`interface\` for object shapes you'll extend; use \`type\` for unions, primitives, and function signatures.

### 5. Unions & literal types

\`\`\`ts
// A value that can be one of several types
let value: string | number = "text";
value = 42;                       // ✅

// Literal union — only these exact values allowed
type Direction = "north" | "south" | "east" | "west";
let dir: Direction = "north";
// dir = "up";                    // ❌ not assignable

// Discriminated unions with objects
type Result =
  | { status: "success"; data: string }
  | { status: "error"; message: string };

function handle(r: Result) {
  if (r.status === "success") {
    console.log(r.data);          // TS narrows the type here
  } else {
    console.log(r.message);       // and here
  }
}
\`\`\`

### 6. Generics — types as parameters

Generics let you write code that works with *any* type while keeping type safety.

\`\`\`ts
// Identity function that preserves the type
function identity<T>(value: T): T {
  return value;
}

const n = identity<number>(5);   // n: number
const s = identity("hello");     // T inferred → s: string

// Generic array helper
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

// Generic with constraint
function getLength<T extends { length: number }>(item: T): number {
  return item.length;
}
\`\`\`

### 7. Utility types — time-savers

TypeScript ships handy type transformers:

\`\`\`ts
interface Todo { id: number; title: string; done: boolean; }

type NewTodo = Omit<Todo, "id">;              // { title; done }
type TodoId = Pick<Todo, "id">;               // { id }
type EditableTodo = Partial<Todo>;            // all optional
type RequiredTodo = Required<Partial<Todo>>;  // all required again
type ReadonlyTodo = Readonly<Todo>;           // all readonly
type TodoList = Array<Todo>;                  // Todo[]
\`\`\`

### 8. The tsconfig — strict mode matters

The real power comes from strict checking:

\`\`\`json
{
  "compilerOptions": {
    "strict": true,            // enables all strict checks
    "noImplicitAny": true,     // error on implicit any
    "strictNullChecks": true,  // null/undefined are explicit
    "target": "ES2020",
    "module": "ESNext"
  }
}
\`\`\`

With \`strictNullChecks\`, you must handle \`null\`/ \`undefined\` explicitly:

\`\`\`ts
function findUser(id: number): User | undefined {
  // ... could return undefined
}

const user = findUser(1);
// user.name            ❌ 'user' is possibly 'undefined'
if (user) {
  console.log(user.name);    // ✅ narrowed
}
\`\`\`

---

## Common Pitfalls

1. **Using \`any\` everywhere** — it silently disables the type system. Prefer \`unknown\` + narrowing.
2. **Ignoring \`strict: true\`** — without strict mode you miss the null-checks that prevent most bugs.
3. **Repeating types** — extract shared shapes into interfaces/aliases instead of duplicating.
4. **Over-typing** — let inference work; annotate function params and return types where helpful, not every variable.
5. **Forgetting \`as const\`** — \`const x = ["a", "b"]\` infers \`string[]\`, not the literal tuple. Use \`as const\` when you need exact values.

---

## Practice Exercises

1. **Model a user:** define an \`interface User\` with required and optional fields; write a function that returns a formatted string.
2. **Union handling:** create a discriminated union for a form submission (success/error) and narrow it in a function.
3. **Generic wrapper:** write a generic \`wrapInArray<T>(value: T): T[]\` and use it with numbers and strings.
4. **Utility types:** given a \`Product\` interface, derive a \`ProductForm\` (omit id, make optional) using utility types.
5. **Strict null handling:** write a function that returns \`User | undefined\` and safely access a field after narrowing.

---

## Self-Assessment

1. What is the difference between \`interface\` and \`type\`?
2. What does \`strictNullChecks\` enforce?
3. What is a union type and when is it useful?
4. What problem do generics solve?
5. Why is \`any\` generally discouraged, and what should you use instead?
`,
  'nextjs': `## Overview

Next.js is a React framework for production. It gives you file-based routing, server-side rendering (SSR), static generation (SSG), API routes, and automatic code-splitting — all with zero config. This very project runs on Next.js 14 with the App Router. If you master Next.js, you can build and ship full-stack applications faster than almost any other stack.

> **What you'll learn:** the App Router, pages, layouts, server vs client components, dynamic routes, API routes, and data fetching.

---

## Core Concepts

### 1. The App Router — file-based routing

In Next.js 14+, folders define routes. A folder with \`page.tsx\` becomes a route.

\`\`\`text
app/
├── layout.tsx          # root layout — wraps every page
├── page.tsx            # →  /
├── about/
│   └── page.tsx        # →  /about
├── blog/
│   ├── page.tsx        # →  /blog
│   └── [slug]/
│       └── page.tsx    # →  /blog/hello-world (dynamic)
└── api/
    └── hello/
        └── route.ts    # →  /api/hello (API route)
\`\`\`

### 2. Pages — every route is a page

\`\`\`tsx
// app/page.tsx
export default function Home() {
  return <h1>Hello, Next.js!</h1>;
}
\`\`\`

### 3. Layouts — shared UI

Layouts wrap pages and persist across navigation (great for navbars and sidebars). They don't re-render on route change.

\`\`\`tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
\`\`\`

**Route groups** like \`(dashboard)\` group routes without adding to the URL — exactly what this project uses to separate auth pages from the dashboard.

### 4. Server vs Client components — the key mental model

Next.js 14 defaults to **Server Components** (run on the server):

\`\`\`tsx
// This is a Server Component by default
// Can use async/await for data fetching directly!
import { getUsers } from "@/lib/data";

export default async function UsersPage() {
  const users = await getUsers();
  return <ul>{users.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}
\`\`\`

Add \`'use client'\` when you need interactivity (hooks, state, event handlers):

\`\`\`tsx
"use client";
import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
\`\`\`

**Rule:** Server components for data + static UI; client components for state + interactivity. Pass data down as props.

### 5. Dynamic routes

\`\`\`tsx
// app/blog/[slug]/page.tsx
export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);
  return <article>{post.content}</article>;
}
\`\`\`

### 6. API routes — your backend in the same project

App Router API routes use \`route.ts\` files:

\`\`\`ts
// app/api/hello/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello from the API" });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ received: body }, { status: 201 });
}
\`\`\`

This project's AI endpoints (\`/api/chat\`, \`/api/lessons/generate\`, \`/api/progress/analyze\`) are exactly this pattern.

### 7. Data fetching patterns

\`\`\`tsx
// 1. Static generation (build time) — default, fastest
//    fetch with no dynamic data → rendered at build, cached forever

// 2. Revalidate (ISR) — rebuild periodically
export const revalidate = 3600;   // re-render at most every hour

// 3. Server-side (every request)
export const dynamic = "force-dynamic";

// 4. Client-side — for authenticated/dynamic data
"use client";
function Profile() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then(setData);
  }, []);
  return data ? <p>{data.name}</p> : <p>Loading...</p>;
}
\`\`\`

### 8. Linking & navigation

\`\`\`tsx
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Nav() {
  const router = useRouter();
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>   {/* client-side nav, preloads */}
      <button onClick={() => router.push("/login")}>Go to login</button>
    </nav>
  );
}
\`\`\`

### 9. Environment variables

\`\`\`ts
// Server-only (secret): no prefix
const secret = process.env.ZEN_API_KEY;

// Client-exposed: must start with NEXT_PUBLIC_
const firebaseKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
\`\`\`

---

## Common Pitfalls

1. **Using hooks in Server Components** — \`useState\`/ \`useEffect\` throw in server components. Add \`'use client'\`.
2. **Over-fetching on the client** — if data doesn't change per-user, fetch it in a Server Component instead.
3. **Fetching in a loop** — N+1 requests. Batch or fetch in the parent and pass props.
4. **Not using \`Link\` for internal nav** — raw \`<a>\` causes full page reloads.
5. **Leaking secrets** — putting a non-\`NEXT_PUBLIC_\` env var in client code. Server-only vars are never sent to the browser.
6. **Building on a network-restricted machine** — \`next/font/google\` downloads fonts at build time; Vercel handles this fine, but local builds on slow networks stall.

---

## Practice Exercises

1. **Add a route:** create \`app/contact/page.tsx\` and link to it from the home page with \`next/link\`.
2. **Dynamic route:** build \`app/posts/[id]/page.tsx\` that shows the post id from params.
3. **API route:** add \`app/api/health/route.ts\` returning \`{ status: "ok" }\` and fetch it from a client component.
4. **Layout:** wrap two pages in a shared layout with a sidebar that persists across navigation.
5. **Server component fetch:** fetch a list from \`jsonplaceholder\` in an \`async\` server component and render it (no client fetch needed).

---

## Self-Assessment

1. What is the difference between a Server Component and a Client Component, and how do you opt into each?
2. How does the App Router map folders to URLs?
3. What is a route group (e.g., \`(dashboard)\`) and why use it?
4. How do you create an API route in the App Router?
5. What's the difference between \`NEXT_PUBLIC_\` and non-prefixed env vars?
`,
  'sql-basics': `## Overview

SQL (Structured Query Language) is the standard language for working with relational databases — the backbone of most applications. Whether you're storing user accounts, orders, or analytics, SQL is how you store, retrieve, and analyze that data. Nearly every backend engineer uses it daily.

> **What you'll learn:** relational database concepts, SELECT queries, filtering, sorting, JOINs, aggregation, and modifying data.

---

## Core Concepts

### 1. Relational databases in one idea

Data is organized into **tables** (rows + columns). Tables relate to each other through **keys**:

\`\`\`text
users                    orders
┌────┬─────────┬─────┐   ┌────┬────────┬──────────┐
│ id │ name    │ age │   │ id │ user_id │ total    │
├────┼─────────┼─────┤   ├────┼─────────┼──────────┤
│ 1  │ Alice   │ 30  │   │ 1  │ 1       │ 120.00   │
│ 2  │ Bob     │ 25  │   │ 2  │ 1       │  45.00   │
│ 3  │ Carol   │ 28  │   │ 3  │ 2       │  90.00   │
└────┴─────────┴─────┘   └────┴─────────┴──────────┘
\`\`\`

- **Primary key:** uniquely identifies each row (\`users.id\`)
- **Foreign key:** references another table's primary key (\`orders.user_id\` → \`users.id\`)

### 2. SELECT — reading data

\`\`\`sql
-- All columns, all rows
SELECT * FROM users;

-- Specific columns
SELECT name, age FROM users;

-- Deduplicate
SELECT DISTINCT city FROM users;

-- Rename in the result (alias)
SELECT name AS full_name FROM users;
\`\`\`

### 3. WHERE — filtering

\`\`\`sql
-- Exact match
SELECT * FROM users WHERE age = 25;

-- Comparison operators
SELECT * FROM users WHERE age >= 18;
SELECT * FROM users WHERE age BETWEEN 20 AND 30;

-- Text matching
SELECT * FROM users WHERE name LIKE 'A%';   -- starts with 'A'
SELECT * FROM users WHERE name LIKE '%li%';  -- contains 'li'

-- Multiple conditions
SELECT * FROM users
WHERE age >= 18 AND city = 'Lahore';

SELECT * FROM users
WHERE city IN ('Lahore', 'Karachi');

-- Negation
SELECT * FROM users WHERE age <> 25;   -- not equal
\`\`\`

### 4. ORDER BY & LIMIT — sorting and pagination

\`\`\`sql
-- Sort by age descending, then name ascending
SELECT * FROM users
ORDER BY age DESC, name ASC;

-- Top 5 oldest users
SELECT * FROM users
ORDER BY age DESC
LIMIT 5;

-- Pagination: second page of 10
SELECT * FROM users
ORDER BY id
LIMIT 10 OFFSET 10;
\`\`\`

### 5. JOINs — combining tables

JOINs link rows across tables using keys. **INNER JOIN** returns only matching rows — the most common.

\`\`\`sql
-- Each order with the buyer's name
SELECT orders.id, users.name, orders.total
FROM orders
JOIN users ON orders.user_id = users.id;

-- Left join keeps all users, even those with no orders
SELECT users.name, orders.total
FROM users
LEFT JOIN orders ON orders.user_id = users.id;

-- Join with filtering + sorting
SELECT users.name, SUM(orders.total) AS lifetime_total
FROM users
JOIN orders ON orders.user_id = users.id
GROUP BY users.id, users.name
HAVING SUM(orders.total) > 100
ORDER BY lifetime_total DESC;
\`\`\`

**JOIN cheat sheet:**
- \`INNER JOIN\` — matching rows only
- \`LEFT JOIN\` — all left rows + matches from right
- \`RIGHT JOIN\` — all right rows + matches from left
- \`FULL OUTER JOIN\` — all rows from both

### 6. Aggregation — GROUP BY

\`\`\`sql
-- Counts
SELECT COUNT(*) FROM users;
SELECT city, COUNT(*) AS total FROM users GROUP BY city;

-- Averages and sums
SELECT AVG(age) FROM users;
SELECT city, AVG(age) AS avg_age FROM users GROUP BY city;

-- Filter groups with HAVING (WHERE filters rows, HAVING filters groups)
SELECT city, COUNT(*) AS total
FROM users
GROUP BY city
HAVING COUNT(*) > 1;
\`\`\`

### 7. Modifying data — INSERT, UPDATE, DELETE

\`\`\`sql
-- Insert a row
INSERT INTO users (name, age, city)
VALUES ('Dave', 33, 'Islamabad');

-- Update matching rows
UPDATE users
SET city = 'Rawalpindi'
WHERE name = 'Dave';

-- Delete matching rows (WHERE is critical!)
DELETE FROM users WHERE id = 5;

-- NEVER do this unless you mean it:
-- DELETE FROM users;   ❌ removes every row
\`\`\`

### 8. Creating tables

\`\`\`sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  age INT,
  city VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

### 9. NULL handling

\`\`\`sql
-- NULL is not equal to anything, not even itself
SELECT * FROM users WHERE city IS NULL;     -- ✅ correct
SELECT * FROM users WHERE city IS NOT NULL;

-- Coalesce: fallback for display
SELECT name, COALESCE(city, 'Unknown') AS city FROM users;
\`\`\`

---

## Common Pitfalls

1. **\`WHERE\` vs \`HAVING\`** — WHERE filters rows before grouping; HAVING filters groups after. Use HAVING with \`COUNT()\`/ \`SUM()\` etc.
2. **Forgetting \`WHERE\` on UPDATE/DELETE** — you'll modify *every* row. Always write and review the WHERE clause.
3. **\`NULL\` comparisons** — \`WHERE city = NULL\` never matches. Use \`IS NULL\`.
4. **\`SELECT *\` in production** — pulls unnecessary data and breaks when columns change. Name your columns.
5. **Implicit joins (comma)** — \`FROM users, orders\` creates a Cartesian product. Always use explicit \`JOIN ... ON\`.
6. **Grouping without aggregating** — selecting a non-grouped column in a GROUP BY query is ambiguous or an error.

---

## Practice Exercises

1. **Explore a table:** write queries that return all users over 18, users in a specific city, and the 10 newest users.
2. **JOIN report:** given \`users\` and \`orders\`, list every user with their total spending (including users with no orders).
3. **Aggregation:** find the average order total, the city with the most users, and the top 3 customers by spend.
4. **Modify data:** insert three new users, update one city, then delete one — verifying each with SELECT.
5. **Design a schema:** create \`students\` and \`enrollments\` tables with primary/foreign keys and test an INNER JOIN.

---

## Self-Assessment

1. What is the difference between a primary key and a foreign key?
2. What's the difference between \`WHERE\` and \`HAVING\`?
3. When should you use a LEFT JOIN instead of an INNER JOIN?
4. Why does \`WHERE city = NULL\` not work, and what's the correct syntax?
5. What does \`GROUP BY city\` do, and what must accompany it in the SELECT?
`,
  'docker': `## Overview

Docker packages your application and everything it needs (libraries, runtime, config) into a portable **container** that runs identically anywhere — your laptop, a teammate's machine, a cloud server. "It works on my machine" becomes a solved problem. Docker is the industry standard for shipping and running modern applications.

> **What you'll learn:** containers vs VMs, images, Dockerfiles, the core Docker commands, volumes for persistence, and Docker Compose.

---

## Core Concepts

### 1. Containers vs virtual machines

\`\`\`text
VIRTUAL MACHINE                 CONTAINER
┌──────────────┐               ┌──────────────┐
│ App          │               │ App          │
├──────────────┤               ├──────────────┤
│ Guest OS     │               │ Dependencies │
├──────────────┤               ├──────────────┤
│ Hypervisor   │               │ Docker Engine│
├──────────────┤               ├──────────────┤
│ Host OS      │               │ Host OS      │
└──────────────┘               └──────────────┘
\`\`\`

- **VM:** full guest OS per app — heavy (GBs), slow to start
- **Container:** shares the host OS kernel, isolates only the app + its files — light (MBs), starts in seconds

### 2. Images vs containers

- **Image** — a read-only *template* (like a class or a recipe). Built from a \`Dockerfile\`.
- **Container** — a *running instance* of an image (like an object or a cooked meal).

\`\`\`bash
docker build -t my-app .     # build an image from the Dockerfile
docker run my-app            # run a container from the image
\`\`\`

### 3. The Dockerfile — how to build your image

\`\`\`dockerfile
# Start from a base image (node 20 with alpine Linux = small)
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy dependency manifests FIRST (better layer caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port (documentation — the app must also listen on it)
EXPOSE 3000

# What command runs when the container starts
CMD ["npm", "start"]
\`\`\`

**Layer caching tip:** copy \`package*.json\` and run \`npm install\` *before* copying source. Then rebuilding after code changes skips the slow install step.

### 4. Core Docker commands

\`\`\`bash
# Build an image
docker build -t my-app .          # -t = tag/name, . = build context

# Run a container
docker run -p 3000:3000 my-app    # -p host:container port mapping
docker run -d --name app my-app   # -d = detached, --name = container name

# Inspect
docker ps                          # running containers
docker ps -a                       # all containers (incl. stopped)
docker images                      # local images
docker logs <container>            # container logs

# Manage
docker stop <container>
docker start <container>
docker rm <container>              # remove a container
docker rmi <image>                 # remove an image

# Execute inside a running container (debugging)
docker exec -it <container> sh
\`\`\`

### 5. Ports & environment variables

\`\`\`bash
# Map host port 4000 → container port 3000
docker run -p 4000:3000 my-app

# Pass environment variables
docker run -e DB_URL=mongodb://... -e NODE_ENV=production my-app

# Use a .env file
docker run --env-file .env my-app
\`\`\`

### 6. Volumes — persistent data

Containers are ephemeral: files written inside die with the container. **Volumes** persist data on the host.

\`\`\`bash
# Named volume (survives container removal)
docker run -v appdata:/data my-app

# Bind mount (link a host folder — great for dev hot-reload)
docker run -v $(pwd):/app my-app
\`\`\`

\`\`\`text
my-app container          host
┌────────────────┐   /data   ┌──────────┐
│ writes to /data ├─────────▶│ appdata  │  ← persisted
└────────────────┘           └──────────┘
\`\`\`

### 7. Docker Compose — multi-container apps

Most real apps need several services (app + database + cache). Compose defines them all in one YAML file.

\`\`\`yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_URL=mongodb://db:27017/mydb
    depends_on:
      - db

  db:
    image: mongo:7
    volumes:
      - dbdata:/data/db

volumes:
  dbdata:
\`\`\`

\`\`\`bash
docker compose up -d        # start everything
docker compose down         # stop and remove
docker compose logs -f      # follow all service logs
docker compose ps           # status
\`\`\`

Note the app talks to the database at \`db:27017\` (service name as hostname) — Compose sets up an internal network for you.

### 8. .dockerignore

Like \`.gitignore\` but for the build context — keeps builds fast and images small:

\`\`\`text
node_modules
.git
*.log
Dockerfile
.dockerignore
\`\`\`

---

## Common Pitfalls

1. **No \`.dockerignore\`** — \`node_modules\` and \`.git\` get copied into the image, bloating it and breaking builds.
2. **\`npm install\` after \`COPY . .\`** — kills layer caching; every code change re-runs install. Copy manifests first.
3. **Port mismatch** — mapping \`-p 4000:3000\` but the app listens on 4000 inside → connection refused.
4. **Forgetting volumes for databases** — container restarts wipe all data. Always mount a volume.
5. **Running as root in production** — add a non-root user (\`USER node\`) for security best practice.
6. **Huge images** — prefer alpine/slim base images and multi-stage builds to keep images lean.

---

## Practice Exercises

1. **Dockerize a Node app:** write a Dockerfile for a small Express server (copy manifests first, \`npm install\`, copy source, \`CMD\`), build, and run it.
2. **Port mapping:** run your image with \`-p 8080:3000\` and confirm it's reachable at localhost:8080.
3. **Persist data:** run a container with a named volume, write a file inside via \`docker exec\`, remove the container, start it again, and confirm the file persists.
4. **Compose a stack:** create \`docker-compose.yml\` with an app service and a database service connected over the internal network.
5. **Optimize:** add a \`.dockerignore\` and switch to an alpine base image; compare image size with \`docker images\`.

---

## Self-Assessment

1. What is the difference between a Docker image and a container?
2. Why do containers start faster and use less memory than VMs?
3. What does \`-p 3000:3000\` mean?
4. Why do you need volumes for databases running in Docker?
5. In Docker Compose, how do services find each other by name?
`,
};

// Backwards-compatible alias (old pages may import this name)
export const dummyLessonContent: Record<string, string> = lessonContent;
