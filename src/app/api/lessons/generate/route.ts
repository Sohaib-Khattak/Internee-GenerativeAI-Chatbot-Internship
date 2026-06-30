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
