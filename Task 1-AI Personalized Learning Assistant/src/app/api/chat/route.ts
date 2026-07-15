import { ai, getModel } from '@/lib/ai/client';
import { SYSTEM_PROMPT, generateAnswerPrompt } from '@/lib/prompts/tutor-prompts';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, context, weakAreas, history } = await req.json();

    const userPrompt = generateAnswerPrompt(message, context || '', weakAreas || []);

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'assistant' as const, content: 'Understood. I will act as an AI tutor.' },
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.content,
      })),
      { role: 'user' as const, content: userPrompt },
    ];

    const result = await ai.chat.completions.create({
      model: getModel(),
      messages,
    });

    const reply = result.choices?.[0]?.message?.content || '';

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error('AI API error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to generate response';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
