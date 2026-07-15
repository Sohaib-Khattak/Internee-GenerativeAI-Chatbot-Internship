import { ai, getModel } from '@/lib/ai/client';
import { SYSTEM_PROMPT, generateLessonPrompt } from '@/lib/prompts/tutor-prompts';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { topic, skillLevel, weakAreas } = await req.json();

    const prompt = generateLessonPrompt(topic, skillLevel, weakAreas || []);

    const result = await ai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'assistant', content: 'Understood. I will generate personalized lessons.' },
        { role: 'user', content: prompt },
      ],
    });

    const content = result.choices?.[0]?.message?.content || '';

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Lesson generation error:', error);
    return NextResponse.json({ error: 'Failed to generate lesson' }, { status: 500 });
  }
}
