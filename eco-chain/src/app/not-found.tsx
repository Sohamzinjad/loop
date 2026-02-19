import Link from "next/link";
import { Leaf, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 bg-grid">
            <div className="eco-surface max-w-md w-full rounded-2xl p-7 text-center space-y-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surge-orange/10 border border-surge-orange/20 mx-auto">
                    <Leaf className="h-8 w-8 text-surge-orange" />
                </div>
                <div>
                    <h1 className="text-5xl font-bold gradient-text mb-2">404</h1>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                        Page Not Found
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>
                <Link href="/">
                    <Button className="bg-gradient-to-r from-surge-orange to-surge-orange-dark text-white transition-transform hover:scale-[1.01] hover:from-surge-orange-dark hover:to-surge-orange-dark">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Home
                    </Button>
                </Link>
            </div>
        </div>
    );
}
