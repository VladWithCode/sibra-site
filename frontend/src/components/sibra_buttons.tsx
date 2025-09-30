import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";

export function PrimaryLinkButton({ label, to }: { label: string; to: string }) {
    return (
        <Button
            className="bg-sbr-blue text-primary-foreground shadow-xs hover:bg-primary/90"
            size="lg"
            asChild
        >
            <Link to={to}>{label}</Link>
        </Button>
    );
}

export function SecondaryLinkButton({ label, to }: { label: string; to: string }) {
    return (
        <Button
            className="border-sbr-green text-sbr-green hover:text-gray-50 active:text-gray-50 hover:bg-sbr-green active:bg-sbr-green"
            variant="outline"
            size="lg"
            asChild
        >
            <Link to={to}>{label}</Link>
        </Button>
    );
}
