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
