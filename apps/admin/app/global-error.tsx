'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
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
        <html lang="en">
            <body>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'system-ui, sans-serif',
                    padding: '1rem',
                    textAlign: 'center',
                }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something went wrong</h2>
                    <p style={{ opacity: 0.7, marginBottom: '2rem', maxWidth: '28rem' }}>
                        A critical error occurred while loading the application.
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: '#111827',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 500,
                        }}
                    >
                        Try Again
                    </button>
                </div>
            </body>
        </html>
    );
}
