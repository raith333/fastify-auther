// src/index.ts
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import { verifyJwt } from "./verify";
import { requirePermissionFactory } from "./permissions";
import { requestContext } from "@fastify/request-context";

// Augment request-context so requestContext.set("user", ...) is typed
declare module "@fastify/request-context" {
  interface RequestContextData {
    user?: { id: string };
  }
}

export type FastifyAuthzOptions = {
  prisma: unknown; // expects a PrismaClient-like instance
  jwt: {
    secret: string;
    issuer: string;
    audience: string;
  };
};

declare module "fastify" {
  interface FastifyRequest {
    user?: { id: string };
  }

  interface FastifyInstance {
    auth: {
      verify: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
      requirePermission: (
        perms: string[]
      ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    };
  }
}

const plugin: FastifyPluginAsync<FastifyAuthzOptions> = async (fastify, opts) => {
  const { prisma, jwt } = opts;

  const verify = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const header = request.headers["authorization"];
      if (!header?.startsWith("Bearer ")) {
        reply.code(401).send({ message: "Missing Authorization header" });
        return;
      }

      const token = header.slice("Bearer ".length).trim();
      const claims = verifyJwt(token, jwt.secret, jwt.issuer, jwt.audience);

      if (claims.type !== "access") {
        reply.code(401).send({ message: "Invalid token type" });
        return;
      }

      const user = { id: claims.sub };
      request.user = user;
      requestContext.set("user", user);
    } catch (err) {
      request.log.error({ err }, "Token verification failed");
      reply.code(401).send({ message: "Invalid token" });
      return;
    }
  };

  const requirePermission = requirePermissionFactory(prisma);

  fastify.decorate("auth", { verify, requirePermission });
};

// 🚀 Important: register under the correct name
export default fp(plugin, { name: "fastify-auther" });
