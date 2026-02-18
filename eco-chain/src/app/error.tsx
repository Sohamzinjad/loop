"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[EcoChain] Unhandled error:", error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 mx-auto">
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-zinc-100 mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-sm text-zinc-500">
                        An unexpected error occurred. Please try again or contact support
                        if the problem persists.
                    </p>
                    {error.digest && (
                        <p className="text-xs text-zinc-600 mt-2 font-mono">
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>
                <Button
                    onClick={reset}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
                >
                    Try Again
                </Button>
            </div>
        </div>
    );
}
