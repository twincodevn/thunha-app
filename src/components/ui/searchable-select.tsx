"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
    value: string;
    label: string;
    sublabel?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    className?: string;
    disabled?: boolean;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Chọn...",
    searchPlaceholder = "Tìm kiếm...",
    emptyMessage = "Không tìm thấy kết quả",
    className,
    disabled = false,
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(search.toLowerCase()) ||
        (option.sublabel && option.sublabel.toLowerCase().includes(search.toLowerCase()))
    );

    const selectedOption = options.find((opt) => opt.value === value);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setOpen(false);
        setSearch("");
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
        setSearch("");
    };

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            {/* Trigger area - Changed from button to div to avoid nested buttons */}
            <div
                role="combobox"
                aria-expanded={open}
                aria-controls="options-list"
                tabIndex={0}
                onClick={() => !disabled && setOpen(!open)}
                onKeyDown={(e) => {
                    if (!disabled && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        setOpen(!open);
                    }
                }}
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    disabled && "cursor-not-allowed opacity-50",
                    open && "ring-2 ring-ring ring-offset-2"
                )}
            >
                <span className={cn(!selectedOption && "text-muted-foreground", "truncate")}>
                    {selectedOption ? (
                        <span className="flex items-center gap-2">
                            <span>{selectedOption.label}</span>
                            {selectedOption.sublabel && (
                                <span className="text-xs text-muted-foreground">
                                    ({selectedOption.sublabel})
                                </span>
                            )}
                        </span>
                    ) : (
                        placeholder
                    )}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="rounded-full p-0.5 hover:bg-muted z-10"
                            tabIndex={0}
                        >
                            <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                    )}
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
                </div>
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
                    {/* Search input */}
                    <div className="flex items-center border-b px-3 py-2">
                        <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                            onClick={(e) => e.stopPropagation()}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSearch("");
                                    inputRef.current?.focus();
                                }}
                                className="ml-2 rounded-full p-0.5 hover:bg-muted"
                            >
                                <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                        )}
                    </div>

                    {/* Options list */}
                    <div className="max-h-60 overflow-y-auto p-1" id="options-list">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                {emptyMessage}
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelect(option.value);
                                    }}
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                                        value === option.value && "bg-accent"
                                    )}
                                >
                                    <div className="flex flex-col items-start text-left">
                                        <span>{option.label}</span>
                                        {option.sublabel && (
                                            <span className="text-xs text-muted-foreground">
                                                {option.sublabel}
                                            </span>
                                        )}
                                    </div>
                                    {value === option.value && (
                                        <Check className="h-4 w-4 text-primary shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
