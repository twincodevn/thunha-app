"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createIncident } from "@/app/actions/incident-actions";
import { Loader2, Camera, X } from "lucide-react";
import { useRouter } from "next/navigation";

const incidentSchema = z.object({
    title: z.string().min(5, "Tiêu đề phải ít nhất 5 ký tự"),
    description: z.string().min(10, "Mô tả phải ít nhất 10 ký tự"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    propertyId: z.string().min(1, "Vui lòng chọn tòa nhà"),
    roomTenantId: z.string().optional(),
});

type IncidentFormValues = z.infer<typeof incidentSchema>;

interface Props {
    properties: { id: string; name: string }[];
    roomTenants?: { id: string; roomNumber: string; tenantName: string; propertyId: string }[];
    defaultPropertyId?: string;
    defaultRoomTenantId?: string;
    onSuccess?: () => void;
}

export function IncidentReportForm({ properties, roomTenants, defaultPropertyId, defaultRoomTenantId, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const router = useRouter();

    const form = useForm<IncidentFormValues>({
        resolver: zodResolver(incidentSchema),
        defaultValues: {
            title: "",
            description: "",
            priority: "MEDIUM",
            propertyId: defaultPropertyId || "",
            roomTenantId: defaultRoomTenantId || "",
        },
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setImages([...images, ...newFiles]);

            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPreviews([...previews, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);

        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
    };

    async function onSubmit(values: IncidentFormValues) {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("title", values.title);
            formData.append("description", values.description);
            formData.append("priority", values.priority);
            formData.append("propertyId", values.propertyId);
            if (values.roomTenantId && values.roomTenantId !== "unassigned") {
                formData.append("roomTenantId", values.roomTenantId);
            }

            images.forEach((image) => {
                formData.append("images", image);
            });

            const result = await createIncident(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Báo cáo sự cố đã được gửi thành công");
                form.reset();
                setImages([]);
                setPreviews([]);
                if (onSuccess) onSuccess();
                router.refresh();
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi gửi báo cáo");
        } finally {
            setLoading(false);
        }
    }

    const selectedPropertyId = form.watch("propertyId");

    // Reset roomTenantId when property changes
    useEffect(() => {
        form.setValue("roomTenantId", "unassigned");
    }, [selectedPropertyId, form]);

    const filteredRoomTenants = roomTenants?.filter(rt => rt.propertyId === selectedPropertyId) || [];

    console.log("IncidentForm Render:", { selectedPropertyId, filteredRoomTenantsCount: filteredRoomTenants.length, filteredRoomTenants });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="propertyId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tòa nhà</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn tòa nhà" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {properties.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {filteredRoomTenants.length > 0 && (
                    <FormField
                        control={form.control}
                        name="roomTenantId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phòng / Khách thuê (Tùy chọn)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedPropertyId}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn phòng/khách thuê" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="unassigned">Không liên kết cụ thể</SelectItem>
                                        {filteredRoomTenants.map((rt) => {
                                            if (!rt.id) {
                                                console.error("Invalid RT:", rt);
                                                return null;
                                            }
                                            return (
                                                <SelectItem key={rt.id} value={rt.id}>
                                                    Phòng {rt.roomNumber} - {rt.tenantName}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tiêu đề sự cố</FormLabel>
                            <FormControl>
                                <Input placeholder="Ví dụ: Máy lạnh chảy nước, Hỏng vòi sen..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mô tả chi tiết</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Mô tả chi tiết tình trạng sự cố..."
                                    className="min-h-[100px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mức độ ưu tiên</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn mức độ ưu tiên" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="LOW">Thấp (Chưa gấp)</SelectItem>
                                    <SelectItem value="MEDIUM">Trung bình</SelectItem>
                                    <SelectItem value="HIGH">Cao (Cần xử lý sớm)</SelectItem>
                                    <SelectItem value="URGENT">Khẩn cấp (Xử lý ngay)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-2">
                    <FormLabel>Hình ảnh minh họa</FormLabel>
                    <div className="flex flex-wrap gap-2">
                        {previews.map((preview, index) => (
                            <div key={index} className="relative w-24 h-24 rounded-md overflow-hidden border">
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                            <Camera className="h-8 w-8 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground mt-1">Thêm ảnh</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </label>
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang gửi báo cáo...
                        </>
                    ) : (
                        "Gửi báo cáo sự cố"
                    )}
                </Button>
            </form>
        </Form>
    );
}
