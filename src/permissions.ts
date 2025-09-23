import { FastifyRequest, FastifyReply } from "fastify";

export function requirePermissionFactory(prisma: any) {
  return (perms: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.id;
      if (!userId) {
        reply.code(401).send({ message: "Unauthorized" });
        return;
      }

      const userPerms = await prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: { permissions: { include: { permission: true } } },
          },
        },
      });

      const allPerms = new Set<string>();
      userPerms.forEach((ur: any) =>
        ur.role?.permissions?.forEach((rp: any) =>
          allPerms.add(rp.permission.code)
        )
      );

      if (allPerms.has("SUPERADMIN")) return;
      const allowed = perms.some((p) => allPerms.has(p));
      if (!allowed) {
        reply.code(403).send({ message: "Forbidden: missing permission" });
      }
    };
  };
}
