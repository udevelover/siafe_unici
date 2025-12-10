'use client';

import React, { useEffect } from 'react';
import { Sidebar } from '@/app/components/sidebar';
import { Inter } from 'next/font/google';
import { AuthProvider, useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

function ProtectedContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading} = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) return null;

  return <>{children}</>;
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedContent>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 ml-0 md:ml-64 bg-gray-50 p-4 overflow-y-auto overflow-hidden">
            {children}
          </main>
        </div>
      </ProtectedContent>
    </AuthProvider>
  );
}
