"use client";

import * as React from "react";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="eco-surface text-muted-foreground rounded-full border-border/80"
                aria-label="Toggle theme"
            >
                <span className="h-4 w-4" />
            </Button>
        );
    }

    const isDark = (resolvedTheme ?? "dark") === "dark";

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="eco-surface text-muted-foreground hover:text-foreground rounded-full border-border/80"
            aria-label="Toggle theme"
            onClick={() => setTheme(isDark ? "light" : "dark")}
        >
            {!isDark ? (
                <Moon className="h-4 w-4" />
            ) : (
                <Sun className="h-4 w-4" />
            )}
        </Button>
    );
}
