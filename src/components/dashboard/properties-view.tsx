"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LayoutGrid, Map as MapIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/dashboard/property-card";
// import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Dynamically import Map to prevent SSR "window is not defined" error
const PropertiesMap = dynamic(() => import("./properties-map"), {
    loading: () => <div className="h-[600px] w-full flex items-center justify-center bg-muted/20 border rounded-lg"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>,
    ssr: false,
});

interface PropertiesViewProps {
    properties: any[];
}

export function PropertiesView({ properties }: PropertiesViewProps) {
    const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-2 bg-muted/20 p-1 rounded-lg border">
                <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid view"
                    className="h-8 w-8 p-0"
                >
                    <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("map")}
                    aria-label="Map view"
                    className="h-8 w-8 p-0"
                >
                    <MapIcon className="h-4 w-4" />
                </Button>
            </div>

            {viewMode === "grid" ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in-50 duration-500">
                    {properties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                    ))}
                </div>
            ) : (
                <div className="animate-in fade-in-50 duration-500">
                    <PropertiesMap properties={properties} />
                </div>
            )}
        </div>
    );
}
