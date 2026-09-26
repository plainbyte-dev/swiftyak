'use client';

import React, { useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="text-center max-w-md">
                <h2 className="text-2xl font-medium text-onBackground mb-2">Something went wrong</h2>
                <p className="text-onBackground/70 mb-8">
                    An unexpected error occurred while loading this page. You can try again, or head back to the dashboard.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200"
                    >
                        <Icon name="ArrowPathIcon" size={16} />
                        Try Again
                    </button>

                    <a
                        href="/stats-dashboard"
                        className="inline-flex items-center justify-center gap-2 border border-border bg-background text-foreground px-6 py-3 rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                    >
                        <Icon name="HomeIcon" size={16} />
                        Back to Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}
