# fastify-authz

Fastify plugin for **JWT verification** and **Prisma-backed RBAC authorization**.

## Install

```bash
npm install fastify-authz
```

## Usage

```ts
import Fastify from "fastify";
import fastifyAuthz from "fastify-authz";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = Fastify();

app.register(fastifyAuthz, {
  prisma,
  jwt: {
    secret: process.env.JWT_ACCESS_SECRET!,
    issuer: process.env.JWT_ISSUER!,
    audience: process.env.JWT_AUDIENCE!,
  },
});

app.get("/roles", {
  preHandler: [app.auth.verify, app.auth.requirePermission(["IAM_READ"])],
}, async () => {
  return await prisma.role.findMany();
});

app.listen({ port: 3000 });
```
