import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PropertiesLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Button disabled>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm tòa nhà
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="h-full">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-5 w-24 rounded-full" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-32 mt-4" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
