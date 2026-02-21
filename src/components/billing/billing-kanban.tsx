"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/billing";
import { updateBillStatus } from "@/app/(dashboard)/dashboard/billing/actions";
import { toast } from "sonner";
import { FileText, MessageCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Define strict typing for columns
type ColumnType = "DRAFT" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";

interface KanbanProps {
    initialBills: any[];
}

const COLUMNS: { id: ColumnType; title: string; color: string; border: string }[] = [
    { id: "DRAFT", title: "Nháp", color: "bg-gray-100 dark:bg-gray-800/50", border: "border-gray-200" },
    { id: "PENDING", title: "Chờ thanh toán", color: "bg-blue-50 dark:bg-blue-900/10", border: "border-blue-200" },
    { id: "OVERDUE", title: "Quá hạn", color: "bg-red-50 dark:bg-red-900/10", border: "border-red-200" },
    { id: "PAID", title: "Đã thanh toán", color: "bg-green-50 dark:bg-green-900/10", border: "border-green-200" },
];

export function BillingKanban({ initialBills }: KanbanProps) {
    const router = useRouter();
    const [bills, setBills] = useState(initialBills);

    // Sync if props change (e.g., month/year filtered)
    useEffect(() => {
        setBills(initialBills);
    }, [initialBills]);

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        // Dropped outside a valid droppable area
        if (!destination) return;

        // Dropped in the same column at the same position
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const newStatus = destination.droppableId as ColumnType;
        const previousStatus = source.droppableId as ColumnType;

        // Optimistic UI Update
        const updatedBills = Array.from(bills);
        const draggedBillIndex = updatedBills.findIndex(b => b.id === draggableId);

        if (draggedBillIndex === -1) return;

        const [draggedBill] = updatedBills.splice(draggedBillIndex, 1);
        draggedBill.status = newStatus;

        // Find correct insertion index in the new array
        // In a real app we'd sort by date or order, but for Kanban append/insert based on destination.index
        updatedBills.splice(destination.index, 0, draggedBill);
        setBills(updatedBills);

        // Server Mutation
        try {
            await updateBillStatus(draggableId, newStatus);
            toast.success(`Đã chuyển hóa đơn sang ${COLUMNS.find(c => c.id === newStatus)?.title}`);
            router.refresh();
        } catch (error) {
            toast.error("Lỗi khi cập nhật trạng thái");
            // Revert changes on error
            draggedBill.status = previousStatus;
            setBills(initialBills);
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[500px]">
                {COLUMNS.map((col) => {
                    const columnBills = bills.filter((b) => b.status === col.id);
                    const totalAmount = columnBills.reduce((sum, b) => sum + Number(b.total), 0);

                    return (
                        <div key={col.id} className="min-w-[300px] w-[300px] flex-shrink-0 flex flex-col gap-2">
                            {/* Column Header */}
                            <div className={`p-3 rounded-t-lg border-b-2 flex justify-between items-center ${col.color} ${col.border}`}>
                                <h3 className="font-semibold text-sm">{col.title}</h3>
                                <Badge variant="secondary" className="font-mono">{columnBills.length}</Badge>
                            </div>
                            <div className={`px-3 py-2 bg-muted/30 text-xs text-muted-foreground flex justify-between`}>
                                <span>Tổng:</span>
                                <span className="font-bold">{formatCurrency(totalAmount)}</span>
                            </div>

                            {/* Droppable Area */}
                            <Droppable droppableId={col.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`flex-1 min-h-[150px] p-2 rounded-b-lg border border-t-0 space-y-3 transition-colors ${snapshot.isDraggingOver ? "bg-muted/50" : "bg-transparent"
                                            } ${col.border}`}
                                    >
                                        {columnBills.map((bill, index) => (
                                            <Draggable key={bill.id} draggableId={bill.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <Card
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`shadow-sm border-l-4 ${snapshot.isDragging ? "shadow-lg scale-[1.02] rotate-1" : ""
                                                            } ${col.id === 'OVERDUE' ? 'border-l-red-500' : 'border-l-primary'}`}
                                                    >
                                                        <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
                                                            <div className="font-semibold text-sm truncate pr-2">
                                                                P.{bill.roomTenant?.room?.roomNumber} - {bill.roomTenant?.tenant?.name}
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                #{bill.id.slice(-4).toUpperCase()}
                                                            </span>
                                                        </CardHeader>
                                                        <CardContent className="p-3 pt-0">
                                                            <div className="text-base font-bold my-1">
                                                                {formatCurrency(bill.total)}
                                                            </div>
                                                            <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                    {col.id === 'OVERDUE' && <AlertCircle className="h-3 w-3 text-red-500" />}
                                                                    Hạn: {format(new Date(bill.dueDate), "dd/MM")}
                                                                </span>
                                                                <div className="flex gap-2">
                                                                    {(col.id === 'PENDING' || col.id === 'OVERDUE') && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                const content = `Chào ${bill.roomTenant?.tenant?.name}, vui lòng thanh toán tiền phòng ${bill.roomTenant?.room?.roomNumber} tháng ${bill.month}. Tổng: ${formatCurrency(bill.total)}. Link chi tiết: ${window.location.origin}/invoice/${bill.invoice?.token}`;
                                                                                navigator.clipboard.writeText(content);
                                                                                toast.success("Đã copy lời nhắn thanh toán.");
                                                                                if (bill.roomTenant?.tenant?.phone) {
                                                                                    const cleanPhone = bill.roomTenant.tenant.phone.replace(/\D/g, "");
                                                                                    window.open(`https://zalo.me/${cleanPhone}`, "_blank");
                                                                                }
                                                                            }}
                                                                            className="text-muted-foreground hover:text-green-600 transition-colors"
                                                                            title="Gửi Zalo nhắc nợ"
                                                                        >
                                                                            <MessageCircle className="h-4 w-4" />
                                                                        </button>
                                                                    )}
                                                                    <Link href={`/dashboard/billing/${bill.id}`} className="text-muted-foreground hover:text-primary transition-colors">
                                                                        <FileText className="h-4 w-4" />
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        {columnBills.length === 0 && (
                                            <div className="h-20 flex items-center justify-center text-xs text-muted-foreground/50 border-2 border-dashed rounded-lg">
                                                Kéo thả vào đây
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );
}
