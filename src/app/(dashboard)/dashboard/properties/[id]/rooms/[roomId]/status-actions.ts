"use server";

import { prisma } from "@/lib/prisma";
import { RoomStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateRoomStatus(roomId: string, status: RoomStatus) {
    await prisma.room.update({
        where: { id: roomId },
        data: { status },
    });
    revalidatePath("/dashboard/properties");
    revalidatePath(`/dashboard/properties/${roomId}`);
    revalidatePath("/listings");
}
