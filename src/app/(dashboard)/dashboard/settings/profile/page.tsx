
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "./profile-form";

export default async function ProfileSettingsPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            name: true,
            phone: true,
            avatar: true,
        },
    });

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Hồ sơ</h3>
                <p className="text-sm text-muted-foreground">
                    Đây là thông tin hiển thị công khai của bạn.
                </p>
            </div>
            <Separator />
            <ProfileForm initialData={{
                name: user.name || "",
                phone: user.phone || "",
                image: user.avatar || "", // Map avatar from DB to image for form
            }} />
        </div>
    );
}
