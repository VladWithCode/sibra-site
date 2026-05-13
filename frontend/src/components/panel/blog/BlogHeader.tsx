import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export function BlogHeader() {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
                <span className="text-primary text-xs font-semibold tracking-widest uppercase">
                    Blog
                </span>
                <h1 className="text-2xl font-extrabold tracking-tight">Posts</h1>
                <p className="text-muted-foreground text-sm">
                    Gestiona los artículos del blog.
                </p>
            </div>
            <Button asChild size="sm">
                <Link to="/panel/blog/nuevo">
                    <Plus className="size-4" />
                    Nuevo post
                </Link>
            </Button>
        </div>
    );
}
