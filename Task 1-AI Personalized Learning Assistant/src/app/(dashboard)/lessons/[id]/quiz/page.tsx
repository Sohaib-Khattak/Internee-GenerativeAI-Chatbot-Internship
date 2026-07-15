'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { quizData, getTopicName } from '@/lib/quiz-data';
import { saveQuizResult, getQuizScore } from '@/lib/storage';
import { defaultTopics } from '@/lib/lessons/lessons-data';

type Phase = 'start' | 'quiz' | 'result';

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('start');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const questions = quizData[id] || [];
  const topicName = getTopicName(id);
  const topic = defaultTopics.find((t) => t.id === id);
  const existingScore = getQuizScore(id);

  useEffect(() => {
    if (questions.length === 0) {
      router.push(`/lessons/${id}`);
    }
  }, [id, questions, router]);

  function startQuiz() {
    setPhase('quiz');
    setCurrent(0);
    setAnswers([]);
    setSelected(null);
  }

  function handleAnswer(idx: number) {
    setSelected(idx);
  }

  function nextQuestion() {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);

    if (current + 1 >= questions.length) {
      const score = newAnswers.filter((a, i) => a === questions[i].correct).length;
      saveQuizResult(id, score, questions.length);
      setPhase('result');
    } else {
      setCurrent(current + 1);
    }
  }

  if (questions.length === 0) return null;

  const q = questions[current];
  const isLast = current + 1 >= questions.length;

  if (phase === 'start') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
          <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📝</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{topicName} Quiz</h2>
          {topic && (
            <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium mb-4 ${
              topic.level === 'beginner' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
              topic.level === 'intermediate' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
              'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}>
              {topic.level}
            </span>
          )}
          <p className="text-gray-500 dark:text-gray-400 mb-2">Test your knowledge with {questions.length} multiple choice questions.</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">You need 70% to pass. Weak areas will be tracked.</p>
          {existingScore && (
            <p className="text-sm text-brand-600 dark:text-brand-400 mb-4">Previous attempt: {existingScore.score}/{existingScore.total}</p>
          )}
          <button
            onClick={startQuiz}
            className="px-8 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-semibold"
          >
            {existingScore ? 'Retake Quiz' : 'Start Quiz'}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    const score = answers.filter((a, i) => a === questions[i].correct).length;
    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    const passed = pct >= 70;
    const weakAreas = !passed ? [topicName] : [];

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
          <div className={`w-20 h-20 ${passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <span className="text-4xl">{passed ? '🎉' : '😅'}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {passed ? 'Congratulations!' : 'Keep Learning!'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{topicName} Quiz</p>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-5xl font-bold text-gray-800 dark:text-white">{pct}%</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-1">
            {score} / {total} correct
          </p>
          <div className="w-full max-w-xs mx-auto h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
            <div
              className={`h-full rounded-full transition-all duration-500 ${passed ? 'bg-green-500' : 'bg-red-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {!passed && (
            <p className="text-sm text-red-500 dark:text-red-400 mb-2">Score below 70% — &ldquo;{topicName}&rdquo; added to weak areas.</p>
          )}
          {passed && (
            <p className="text-sm text-green-600 dark:text-green-400 mb-2">Great job! You&rsquo;ve mastered this topic.</p>
          )}
          <div className="flex gap-3 justify-center mt-4">
            <button
              onClick={() => router.push(`/lessons/${id}`)}
              className="px-6 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl hover:border-brand-300 dark:hover:border-brand-600 transition-colors font-medium text-sm"
            >
              Back to Lesson
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{topicName} Quiz</h2>
        <span className="text-sm text-gray-400 dark:text-gray-500">{current + 1} / {questions.length}</span>
      </div>

      <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-300"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">Question {current + 1} of {questions.length}</p>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">{q.question}</h3>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                selected === i
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <span className="inline-block w-6 h-6 rounded-full border text-xs leading-6 text-center mr-3 font-medium"
                style={{
                  borderColor: selected === i ? '#9333ea' : '#d1d5db',
                  backgroundColor: selected === i ? '#9333ea' : 'transparent',
                  color: selected === i ? 'white' : '#6b7280',
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={nextQuestion}
        disabled={selected === null}
        className="w-full py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors font-semibold"
      >
        {isLast ? 'Submit Quiz' : 'Next Question'}
      </button>
    </div>
  );
}
