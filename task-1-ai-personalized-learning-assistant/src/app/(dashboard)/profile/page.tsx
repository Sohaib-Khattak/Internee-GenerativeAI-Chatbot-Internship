'use client';
import { useAuth } from '@/context/AuthContext';
import { getUserData, setUserData } from '@/lib/firebase/firestore';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    getUserData(user.uid).then((d) => {
      if (d?.name) setName(d.name);
    });
  }, [user]);

  async function handleSave() {
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      await setUserData(user.uid, { name: name.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { }
    setSaving(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account information</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
