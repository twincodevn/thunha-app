
import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            plan: string;
            role: "LANDLORD" | "TENANT";
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        plan: string;
        role: "LANDLORD" | "TENANT";
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        plan: string;
        role: "LANDLORD" | "TENANT";
    }
}
