import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { useState } from "react";
import { Button } from "./ui/button";

export type SearchBoxProps = {
    className?: string;
    placeholder?: string;
    onSubmit: (search: string) => void;
    onChange?: (search: string) => void;
};

export function SearchBox({ className, placeholder, onSubmit, onChange }: SearchBoxProps) {
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const _onSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!search) {
            setError("Debes escribir algo para buscar");
            return;
        }
        onSubmit(search);
    };
    const _onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setError("");

        if (typeof onChange === "function") {
            onChange(e.target.value);
        }
    };

    return (
        <div className={
            cn(
                className,
                "relative bg-gray-50 w-full z-0 rounded-lg"
            )
        }>
            <Input
                value={search}
                onChange={_onChange}
                placeholder={placeholder}
                className="w-full pr-28 py-6"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                <Button
                    className="uppercase bg-sbr-blue text-white font-semibold"
                    size="lg"
                    onClick={_onSubmit}
                >Buscar</Button>
            </div>
            <div
                className="absolute -z-10 top-full inset-y-0 opacity-0 -translate-y-12 transition-[opacity,_transform] duration-300 data-[state=visible]:translate-y-2 data-[state=visible]:opacity-100"
                data-state={error ? "visible" : "hidden"}
            >
                <p className="text-sm text-destructive font-semibold">{error}</p>
            </div>
        </div>
    );
}
