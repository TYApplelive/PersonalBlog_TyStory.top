import { listUsers } from "@serverUtils/auth-db";
import { requireAdminSession } from "@serverUtils/auth";

export default defineEventHandler(async (event) => {
  await requireAdminSession(event);

  const users = await listUsers();
  console.log(`[Users API] 获取用户列表，共 ${users.length} 个用户`);
  return users;
});
