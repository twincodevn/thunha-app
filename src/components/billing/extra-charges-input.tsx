"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/billing";

interface ExtraCharge {
    name: string;
    amount: number;
}

interface ExtraChargesInputProps {
    defaultServices?: { name: string; price: number }[];
    propertyId?: string; // Used to trigger reset when property changes
}

export function ExtraChargesInput({ defaultServices = [], propertyId }: ExtraChargesInputProps) {
    const [charges, setCharges] = useState<ExtraCharge[]>([]);

    // Load default services when property changes
    useEffect(() => {
        if (defaultServices.length > 0) {
            setCharges(defaultServices.map(s => ({ name: s.name, amount: s.price })));
        } else {
            setCharges([]);
        }
    }, [defaultServices, propertyId]);

    const addCharge = () => {
        setCharges([...charges, { name: "", amount: 0 }]);
    };

    const removeCharge = (index: number) => {
        setCharges(charges.filter((_, i) => i !== index));
    };

    const updateCharge = (index: number, field: keyof ExtraCharge, value: string | number) => {
        const newCharges = [...charges];
        newCharges[index] = { ...newCharges[index], [field]: value };
        setCharges(newCharges);
    };

    const totalExtra = charges.reduce((sum, c) => sum + (c.amount || 0), 0);

    return (
        <div className="space-y-4 p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center justify-between">
                <h3 className="font-medium text-green-800">✨ Dịch vụ & Phí khác</h3>
                <span className="text-sm font-semibold text-green-700">{formatCurrency(totalExtra)}</span>
            </div>

            <input type="hidden" name="extraCharges" value={JSON.stringify(charges)} />

            <div className="space-y-3">
                {charges.map((charge, index) => (
                    <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                            <Input
                                placeholder="Tên phí (Internet...)"
                                value={charge.name}
                                onChange={(e) => updateCharge(index, "name", e.target.value)}
                                className="bg-white"
                                required
                            />
                        </div>
                        <div className="w-[120px]">
                            <Input
                                type="number"
                                placeholder="0"
                                value={charge.amount}
                                onChange={(e) => updateCharge(index, "amount", parseFloat(e.target.value) || 0)}
                                className="bg-white"
                                min={0}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCharge(index)}
                            className="text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCharge}
                className="w-full border-green-200 hover:bg-green-100 text-green-700"
            >
                <Plus className="mr-2 h-4 w-4" />
                Thêm khoản thu
            </Button>
        </div>
    );
}
