
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Contract } from "@prisma/client";
import { PenTool, CheckCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { saveSignature } from "@/app/(dashboard)/dashboard/contracts/signing-actions";

const SignaturePad = dynamic(() => import("./signature-pad").then(m => m.SignaturePad), { ssr: false });

interface ContractSigningSectionProps {
    contract: Contract;
    isLandlord: boolean;
}

export function ContractSigningSection({ contract, isLandlord }: ContractSigningSectionProps) {
    const [signingRole, setSigningRole] = useState<"LANDLORD" | "TENANT" | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (signature: string) => {
        if (!signingRole) return;
        setIsSaving(true);
        try {
            const result = await saveSignature(contract.id, signingRole, signature);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Đã lưu chữ ký thành công");
                setSigningRole(null);
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Chữ ký điện tử</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Landlord Signature */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Chủ nhà (Bên cho thuê)</p>
                        {contract.landlordSignature ? (
                            <span className="text-xs text-green-600 font-medium flex items-center">
                                <CheckCircle className="mr-1 h-3 w-3" /> Đã ký
                            </span>
                        ) : (
                            isLandlord && !signingRole && (
                                <Button size="sm" variant="outline" onClick={() => setSigningRole("LANDLORD")}>
                                    <PenTool className="mr-2 h-3 w-3" /> Ký tên
                                </Button>
                            )
                        )}
                    </div>

                    {signingRole === "LANDLORD" ? (
                        <div className="border p-4 rounded-lg bg-gray-50 animate-in fade-in zoom-in-95">
                            <p className="text-xs text-muted-foreground mb-2">Vui lòng ký tên vào khung bên dưới:</p>
                            <SignaturePad onSave={handleSave} />
                            <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setSigningRole(null)}>
                                Hủy bỏ
                            </Button>
                        </div>
                    ) : (
                        contract.landlordSignature ? (
                            <div className="relative h-20 w-full bg-white border rounded flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={contract.landlordSignature}
                                    alt="Chữ ký chủ nhà"
                                    className="h-full object-contain p-2"
                                />
                            </div>
                        ) : (
                            <div className="h-20 bg-gray-50 border border-dashed rounded flex items-center justify-center text-muted-foreground text-xs">
                                Chưa có chữ ký
                            </div>
                        )
                    )}
                </div>

                {/* Tenant Signature */}
                <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Khách thuê (Bên thuê)</p>
                        {contract.tenantSignature ? (
                            <span className="text-xs text-green-600 font-medium flex items-center">
                                <CheckCircle className="mr-1 h-3 w-3" /> Đã ký
                            </span>
                        ) : (
                            // Allow landlord to capture tenant signature (In-person) OR Tenant to sign (if logged in as tenant)
                            // Since isLandlord prop is passed, if true, show "Capture Signature"
                            isLandlord && !signingRole && (
                                <Button size="sm" variant="outline" onClick={() => setSigningRole("TENANT")}>
                                    <PenTool className="mr-2 h-3 w-3" /> Ký hộ khách
                                </Button>
                            )
                        )}
                    </div>

                    {signingRole === "TENANT" ? (
                        <div className="border p-4 rounded-lg bg-gray-50 animate-in fade-in zoom-in-95">
                            <p className="text-xs text-muted-foreground mb-2">Khách thuê ký tên vào khung bên dưới:</p>
                            <SignaturePad onSave={handleSave} />
                            <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setSigningRole(null)}>
                                Hủy bỏ
                            </Button>
                        </div>
                    ) : (
                        contract.tenantSignature ? (
                            <div className="relative h-20 w-full bg-white border rounded flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={contract.tenantSignature}
                                    alt="Chữ ký khách thuê"
                                    className="h-full object-contain p-2"
                                />
                            </div>
                        ) : (
                            <div className="h-20 bg-gray-50 border border-dashed rounded flex items-center justify-center text-muted-foreground text-xs">
                                Chưa có chữ ký
                            </div>
                        )
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
