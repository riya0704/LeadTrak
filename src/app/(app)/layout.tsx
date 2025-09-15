'use client';

import { useContext, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { AuthContext } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-8">
        <div className="flex w-full">
            <Skeleton className="hidden md:block md:w-64 h-[95vh] rounded-lg" />
            <div className="flex-1 md:ml-4">
                <Skeleton className="h-14 w-full rounded-lg mb-4" />
                <Skeleton className="h-[80vh] w-full rounded-lg" />
            </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect is handled by the effect
  }

  return <AppLayout>{children}</AppLayout>;
}
