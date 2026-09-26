import React from 'react';

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
        </div>
    );
}
