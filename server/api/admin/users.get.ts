import { listUsers } from "@serverUtils/auth-db";
import { requireAdminSession } from "@serverUtils/auth";

export default defineEventHandler(async (event) => {
  // 双重校验：中间件已限制，这里继续显式要求管理员会话。
  await requireAdminSession(event);
  return await listUsers();
});
