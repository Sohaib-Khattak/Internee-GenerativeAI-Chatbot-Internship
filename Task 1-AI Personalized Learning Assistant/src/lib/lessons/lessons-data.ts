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

export const dummyLessonContent: Record<string, string> = {
  'js-basics': '## JavaScript Basics\n\nJavaScript is a programming language that adds interactivity to websites.\n\n### Variables\n```js\nlet name = "Intern";\nconst age = 22;\nvar oldWay = "avoid this";\n```\n\n### Functions\n```js\nfunction greet(name) {\n  return "Hello, " + name + "!";\n}\n```\n\n### Practice\nTry creating a function that adds two numbers.',
  'react-fundamentals': '## React Fundamentals\n\nReact is a library for building user interfaces.\n\n### Components\n```tsx\nfunction Welcome({ name }) {\n  return <h1>Hello, {name}</h1>;\n}\n```\n\n### State & Hooks\n```tsx\nconst [count, setCount] = useState(0);\n```\n\n### Practice\nBuild a simple counter component.',
  'node-api': '## Node.js API Design\n\nBuild scalable APIs with Node.js and Express.\n\n### Basic Route\n```js\napp.get(\'/api/users\', (req, res) => {\n  res.json([{ id: 1, name: \'Intern\' }]);\n});\n```\n\n### Middleware\n```js\napp.use(express.json());\n```\n\n### Practice\nCreate a REST API for a todo app.',
  'python-data': '## Python for Data Science\n\nPython is the go-to language for data analysis.\n\n### Pandas Basics\n```python\nimport pandas as pd\ndf = pd.read_csv(\'data.csv\')\nprint(df.head())\n```\n\n### Visualization\n```python\nimport matplotlib.pyplot as plt\nplt.plot(data)\nplt.show()\n```\n\n### Practice\nLoad a dataset and find the mean of a column.',
  'git-workflow': '## Git & Collaboration\n\nGit helps you track changes and collaborate.\n\n### Basic Commands\n```bash\ngit add .\ngit commit -m "message"\ngit push origin main\n```\n\n### Branching\n```bash\ngit checkout -b feature/new-page\n```\n\n### Practice\nCreate a branch, make changes, and open a pull request.',
  'html-css': '## HTML & CSS Essentials\n\nBuild the structure and style of web pages.\n\n### HTML Structure\n```html\n<!DOCTYPE html>\n<html>\n  <head><title>My Page</title></head>\n  <body><h1>Hello World</h1></body>\n</html>\n```\n\n### CSS Flexbox\n```css\n.container {\n  display: flex;\n  justify-content: center;\n}\n```\n\n### Practice\nCreate a responsive card layout.',
  'typescript': '## TypeScript Deep Dive\n\nTypeScript adds static types to JavaScript.\n\n### Type Annotations\n```ts\nfunction add(a: number, b: number): number {\n  return a + b;\n}\n```\n\n### Interfaces\n```ts\ninterface User {\n  id: number;\n  name: string;\n}\n```\n\n### Practice\nDefine an interface for a Product with id, name, and price.',
  'nextjs': '## Next.js Full Stack\n\nNext.js is a React framework for production.\n\n### Pages & Routing\n```tsx\n// app/page.tsx\nexport default function Home() {\n  return <h1>Hello Next.js</h1>;\n}\n```\n\n### API Routes\n```ts\n// app/api/hello/route.ts\nexport async function GET() {\n  return Response.json({ message: \'Hello\' });\n}\n```\n\n### Practice\nCreate a blog with dynamic routes.',
  'sql-basics': '## SQL & Databases\n\nSQL is the standard language for relational databases.\n\n### Queries\n```sql\nSELECT * FROM users WHERE age > 18;\n```\n\n### Joins\n```sql\nSELECT users.name, orders.total\nFROM users\nJOIN orders ON users.id = orders.user_id;\n```\n\n### Practice\nWrite a query to find the top 5 customers by total spent.',
  'docker': '## Docker & Containers\n\nDocker packages applications into containers.\n\n### Dockerfile\n```dockerfile\nFROM node:20\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["npm", "start"]\n```\n\n### Docker Compose\n```yaml\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n```\n\n### Practice\nDockerize a Node.js app with a PostgreSQL database.',
};

