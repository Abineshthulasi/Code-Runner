
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq, count } from "drizzle-orm";

async function checkAdmins() {
    try {
        const [result] = await db.select({ count: count() }).from(users).where(eq(users.role, 'admin'));
        console.log(`Total Admin Users: ${result.count}`);

        // Also list all users for context
        const allUsers = await db.select().from(users);
        console.log("All Users:");
        console.table(allUsers.map(u => ({ id: u.id, username: u.username, role: u.role })));

        process.exit(0);
    } catch (error) {
        console.error("Failed to connect or query database:", error);
        process.exit(1);
    }
}

checkAdmins();
