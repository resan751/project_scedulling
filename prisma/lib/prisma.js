import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const databasePort = Number(process.env.DATABASE_PORT);

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  ...(Number.isInteger(databasePort) && databasePort > 0 ? { port: databasePort } : {}),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

export { prisma };
