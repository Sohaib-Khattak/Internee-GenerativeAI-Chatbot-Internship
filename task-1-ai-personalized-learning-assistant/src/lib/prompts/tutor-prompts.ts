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
