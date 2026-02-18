import Link from "next/link";
import { Leaf, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mx-auto">
                    <Leaf className="h-8 w-8 text-emerald-400" />
                </div>
                <div>
                    <h1 className="text-5xl font-bold gradient-text mb-2">404</h1>
                    <h2 className="text-xl font-bold text-zinc-100 mb-2">
                        Page Not Found
                    </h2>
                    <p className="text-sm text-zinc-500">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>
                <Link href="/">
                    <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Home
                    </Button>
                </Link>
            </div>
        </div>
    );
}
