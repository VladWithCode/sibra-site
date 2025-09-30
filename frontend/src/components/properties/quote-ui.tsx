import { add } from "date-fns";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { RadioGroup } from "../ui/radio-group";
import { Input } from "../ui/input";
import type { ControllerRenderProps } from "react-hook-form";

export type TDatePickerItem = {
    value: Date;
    dayName: string;
    monthName: string;
    date: number;
    available: boolean;
};
export const DATEPICKER_MAX_DAY_COUNT = 30;

export function ContactFormDatePicker({
    onChange,
}: {
    onChange?: (pickedItem: TDatePickerItem) => void;
}) {
    const [dateItems, setDateItems] = useState<TDatePickerItem[]>([]);
    // item value as string is used as id
    const [activeItem, setActiveItem] = useState<string>();
    useEffect(() => {
        const dates: TDatePickerItem[] = [];
        for (let i = 0, d = new Date(); i < DATEPICKER_MAX_DAY_COUNT; i++) {
            const value = add(d, { days: i });
            dates.push({
                value,
                dayName: value.toLocaleDateString("es-MX", { weekday: "short" }),
                monthName: value.toLocaleDateString("es-MX", { month: "short" }),
                date: value.getDate(),
                available: true,
            });
        }
        setDateItems(dates);
        setActiveItem(dates[0].value.toISOString());
    }, []);
    const handleItemClick = useCallback(
        (item: TDatePickerItem) => {
            setActiveItem(item.value.toISOString());
            if (typeof onChange === "function") onChange(item);
        },
        [setActiveItem, onChange],
    );

    return (
        <ScrollArea className="w-full mx-auto">
            <div className="flex w-max gap-4 text-gray-800">
                {dateItems.map((item) => (
                    <DatePickerItem
                        key={item.value.toISOString()}
                        item={item}
                        activeItem={activeItem}
                        handleItemClick={handleItemClick}
                    />
                ))}
            </div>
            <ScrollBar
                orientation="horizontal"
                style={{ "--border": "var(--color-sbr-blue-dark)" } as CSSProperties}
            />
        </ScrollArea>
    );
}

export function DatePickerItem({
    item,
    activeItem,
    handleItemClick,
}: {
    item: TDatePickerItem;
    activeItem?: string;
    handleItemClick: (item: TDatePickerItem) => void;
}) {
    const isActive = activeItem === item.value.toISOString();
    return (
        <Button
            type="button"
            variant="secondary"
            onClick={() => handleItemClick(item)}
            className={cn(
                "size-24 flex flex-col items-center justify-center gap-0 text-current/95 text-center font-semibold border border-muted-foreground rounded-lg",
                isActive && "border-2 border-sbr-blue-dark bg-sbr-blue-light/15 text-current",
            )}
        >
            <p className="text-xs uppercase text-current/80">{item.dayName}</p>
            <p className="text-3xl font-bold">{item.date}</p>
            <p className="text-sm uppercase text-current/80">{item.monthName}</p>
        </Button>
    );
}

export type TQuoteType = "presencial" | "whatsapp";
export type TQuoteTypeItem = {
    type: TQuoteType;
    label: string;
};

const quoteTypeItems: TQuoteTypeItem[] = [
    { type: "presencial", label: "Tour en Persona" },
    { type: "whatsapp", label: "Whatsapp" },
];

export function QuoteTypeSelector({
    onChange,
}: {
    onChange?: (pickedType: TQuoteType) => void;
}) {
    const [quoteType, setQuoteType] = useState<TQuoteType>("presencial");
    const handleQuoteTypeChange = useCallback(
        (type: TQuoteType) => {
            setQuoteType(type);
            if (typeof onChange === "function") onChange(type);
        },
        [setQuoteType, onChange],
    );

    return (
        <div className="flex justify-stretch [&>button]:not-first:rounded-l-none [&>button]:not-last:rounded-r-none">
            {quoteTypeItems.map((item) => (
                <QuoteTypeItem
                    key={item.type}
                    type={item}
                    active={quoteType === item.type}
                    handleClick={() => handleQuoteTypeChange(item.type)}
                />
            ))}
        </div>
    );
}

function QuoteTypeItem({
    type,
    active,
    handleClick,
}: {
    type: TQuoteTypeItem;
    active: boolean;
    handleClick: () => void;
}) {
    return (
        <Button
            type="button"
            variant="default"
            className="flex-1 border-2 border-gray-300 text-secondary-foreground bg-sbr-blue/0 shadow-none data-[active=true]:border-sbr-blue data-[active=true]:bg-sbr-blue/15 data-[active=true]:font-bold"
            onClick={handleClick}
            data-active={active}
        >
            {type.label}
        </Button>
    );
}
