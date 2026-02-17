
"use client";

import { SignaturePad } from "@/components/contracts/signature-pad";
import { useRouter } from "next/navigation";

export function SignContractClient({ contractId }: { contractId: string }) {
    const router = useRouter();

    const handleSave = async (signatureData: string) => {
        const res = await fetch(`/api/contracts/${contractId}/sign`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ signatureImage: signatureData }),
        });

        if (!res.ok) {
            throw new Error("Failed to sign contract");
        }

        router.refresh();
    };

    return <SignaturePad onSave={handleSave} />;
}
