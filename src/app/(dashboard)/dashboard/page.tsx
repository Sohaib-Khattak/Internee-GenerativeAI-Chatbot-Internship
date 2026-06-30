'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { getUserData } from '@/lib/firebase/firestore';

interface UserData {
  name?: string;
  weakAreas?: string[];
  progress?: Record<string, unknown>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<UserData | null>(null);

  useEffect(() => {
    if (user) {
      getUserData(user.uid).then(setData);
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-gray-600">Lessons Completed</h3>
          <p className="text-3xl font-bold mt-2">
            {data?.progress ? Object.keys(data.progress).length : 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-gray-600">Weak Areas</h3>
          <p className="text-3xl font-bold mt-2">{data?.weakAreas?.length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-gray-600">Streak</h3>
          <p className="text-3xl font-bold mt-2">0 days</p>
        </div>
      </div>
    </div>
  );
}
