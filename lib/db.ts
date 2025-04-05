/* eslint-disable no-var */
import { PrismaClient } from "../prisma/generated/prisma/client";
import "server-only";

declare global {
  var dbInstance: PrismaClient | undefined;
}

const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

export const prisma = (() => {
  if (process.env.NODE_ENV === "production") {
    return createPrismaClient();
  }

  if (!global.dbInstance) {
    global.dbInstance = createPrismaClient();
  }
  
  return global.dbInstance;
})();