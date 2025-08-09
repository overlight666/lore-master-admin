'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function AuthDebug() {
  const { user, loading, login, logout } = useAuth();
  const [testEmail, setTestEmail] = useState('admin@test.com');
  const [testPassword, setTestPassword] = useState('password123');

  const handleTestLogin = async () => {
    try {
      await login(testEmail, testPassword);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Auth Debug Page</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-xl font-semibold mb-2">Current Auth State</h2>
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user ? user.email : 'None'}</p>
        <p><strong>UID:</strong> {user?.uid || 'None'}</p>
        <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
      </div>

      {!user ? (
        <div className="bg-blue-50 p-4 rounded mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Login</h2>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button
              onClick={handleTestLogin}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Login
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 p-4 rounded mb-6">
          <h2 className="text-xl font-semibold mb-2">Logged In</h2>
          <p>Welcome, {user.email}!</p>
          <button
            onClick={logout}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      )}

      <div className="bg-yellow-50 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Navigation Test</h2>
        <div className="space-x-4">
          <a href="/dashboard" className="text-blue-600 underline">Go to Dashboard</a>
          <a href="/login" className="text-blue-600 underline">Go to Login</a>
        </div>
      </div>
    </div>
  );
}
