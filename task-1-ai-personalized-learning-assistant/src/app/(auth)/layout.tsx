export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700">
      <div className="flex-1 flex items-center justify-center p-8">
        {children}
      </div>
      <div className="hidden lg:flex flex-1 items-center justify-center p-8">
        <div className="text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <span className="text-4xl">🤖</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">AI Learning Assistant</h2>
          <p className="text-white/70 max-w-sm">Personalized learning powered by AI. Track progress, get insights, and master new skills.</p>
        </div>
      </div>
    </div>
  );
}
