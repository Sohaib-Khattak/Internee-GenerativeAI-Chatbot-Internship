'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { defaultTopics, lessonContent, lessonResources } from '@/lib/lessons/lessons-data';
import { useAuth } from '@/context/AuthContext';
import { addCompletedLesson, isLessonCompleted, getQuizScore, buildProgressData } from '@/lib/storage';
import ReactMarkdown from 'react-markdown';

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [justCompleted, setJustCompleted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    setCompleted(isLessonCompleted(id));
  }, [id]);

  const topic = defaultTopics.find((t) => t.id === id);
  const content = topic ? (lessonContent[id] || 'Content not available.') : '';
  const resource = topic ? lessonResources[id] : undefined;
  const topicIndex = topic ? defaultTopics.findIndex((t) => t.id === id) : -1;
  const prevTopic = topicIndex > 0 ? defaultTopics[topicIndex - 1] : null;
  const nextTopic = topicIndex >= 0 && topicIndex < defaultTopics.length - 1 ? defaultTopics[topicIndex + 1] : null;

  // Reset AI-generated content when switching lessons
  useEffect(() => {
    setAiContent(null);
    setAiError(null);
  }, [id]);

  const handleMarkComplete = () => {
    addCompletedLesson(id, topic!.title);
    setCompleted(true);
    setJustCompleted(true);
    setTimeout(() => router.push('/dashboard'), 1200);
  };

  const handleNavigate = (topicId: string) => {
    router.push(`/lessons/${topicId}`);
  };

  const handleGenerateAI = useCallback(async () => {
    if (!topic || generating) return;
    setGenerating(true);
    setAiError(null);

    try {
      const { weakAreas } = buildProgressData();
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
      if (!res.ok) throw new Error(data.error || 'Failed to generate lesson');

      setAiContent(data.content);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sorry, something went wrong.';
      setAiError(msg);
    } finally {
      setGenerating(false);
    }
  }, [topic, generating]);

  if (!topic) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Lesson not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{topic.title}</h2>
            {completed && (
              <span className="px-2.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium flex items-center gap-1">
                &#10003; Completed
              </span>
            )}
          </div>
          <span className={`inline-block mt-1 px-3 py-1 text-xs rounded-full font-medium ${
            topic.level === 'beginner' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
            topic.level === 'intermediate' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
            'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            {topic.level}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      {/* AI-generated lesson content (replaces static when generated) */}
      {aiContent && (
        <div className="bg-gradient-to-br from-brand-50 to-accent-50 dark:from-brand-900/20 dark:to-accent-900/20 p-6 rounded-xl border border-brand-200 dark:border-brand-800 shadow-sm prose prose-sm dark:prose-invert max-w-none">
          <div className="flex items-center justify-between mb-4 not-prose">
            <h3 className="text-lg font-bold text-brand-700 dark:text-brand-300 flex items-center gap-2">
              <span>🤖</span> AI-Generated Lesson
            </h3>
            <button
              onClick={() => setAiContent(null)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              ✕ Hide
            </button>
          </div>
          <ReactMarkdown>{aiContent}</ReactMarkdown>
        </div>
      )}

      {aiError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl text-sm text-red-600 dark:text-red-400">
          <strong>Could not generate lesson:</strong> {aiError}
        </div>
      )}

      {justCompleted ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-xl text-center">
          <p className="text-green-700 dark:text-green-300 font-semibold text-lg">&#10003; Course Completed!</p>
          <p className="text-green-600 dark:text-green-400 text-sm mt-1">Redirecting to dashboard...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleGenerateAI}
            disabled={generating}
            className="w-full py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-xl hover:from-brand-700 hover:to-accent-700 disabled:opacity-50 transition-all font-semibold text-sm flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Generating AI lesson...
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Generate AI Lesson</span>
              </>
            )}
          </button>
          {!completed && (
            <button
              onClick={handleMarkComplete}
              className="w-full py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
            >
              <span>&#10003;</span>
              <span>Mark as Completed</span>
            </button>
          )}
          {completed && (
            <button
              onClick={() => router.push(`/lessons/${id}/quiz`)}
              className="w-full py-3 bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 border-2 border-brand-600 dark:border-brand-500 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
            >
              <span>📝</span>
              <span>Take Quiz</span>
            </button>
          )}
        </div>
      )}

      {/* References: books + YouTube videos */}
      {resource && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4 text-lg flex items-center gap-2">
            <span>📚</span> References &amp; Learning Resources
          </h3>

          {/* Books */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Recommended Books</h4>
            <ul className="space-y-2">
              {resource.books.map((book) => (
                <li key={book.title} className="flex items-start justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {book.url ? (
                        <a
                          href={book.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                        >
                          {book.title}
                          {book.free && <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full font-medium">Free</span>}
                        </a>
                      ) : (
                        <>
                          {book.title}
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full font-medium">Book</span>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">by {book.author}</p>
                  </div>
                  {book.url && (
                    <a
                      href={book.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs text-brand-600 dark:text-brand-400 hover:underline mt-1"
                    >
                      Read ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* YouTube videos */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Video Tutorials</h4>
            <div className="space-y-4">
              {resource.videos.map((video) => (
                <div key={video.videoId} className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube-nocookie.com/embed/${video.videoId}`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{video.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{video.channel}{video.duration ? ` · ${video.duration}` : ''}</p>
                    </div>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      ▶ Watch
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        {prevTopic ? (
          <button
            onClick={() => handleNavigate(prevTopic.id)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:border-brand-300 hover:text-brand-700 dark:hover:border-brand-600 dark:hover:text-brand-300 transition-colors"
          >
            <span>&larr;</span>
            <span>{prevTopic.title}</span>
          </button>
        ) : <div />}
        {nextTopic ? (
          <button
            onClick={() => handleNavigate(nextTopic.id)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:border-brand-300 hover:text-brand-700 dark:hover:border-brand-600 dark:hover:text-brand-300 transition-colors"
          >
            <span>{nextTopic.title}</span>
            <span>&rarr;</span>
          </button>
        ) : <div />}
      </div>
    </div>
  );
}
