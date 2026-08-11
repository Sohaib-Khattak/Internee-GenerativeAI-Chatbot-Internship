import { ai, getModel } from '@/lib/ai/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { completedLessons, quizResults } = await req.json();

    const prompt = `You are a learning analytics assistant. Analyze the intern's progress and identify weak areas. Return a JSON object with: { weakAreas: string[], recommendations: string[] }

Completed lessons: ${JSON.stringify(completedLessons)}
Quiz results: ${JSON.stringify(quizResults)}

Analyze and identify weak areas and give learning recommendations.`;

    const result = await ai.chat.completions.create({
      model: getModel(),
      messages: [{ role: 'user', content: prompt }],
    });

    const text = result.choices?.[0]?.message?.content || '';

    const cleanedText = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Progress analysis error:', error);
    return NextResponse.json(
      { weakAreas: [], recommendations: ['Complete more lessons for analysis'] },
      { status: 500 }
    );
  }
}
