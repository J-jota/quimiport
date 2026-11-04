import { PrismaClient } from '@prisma/client';

/** Cliente Prisma compartilhado (singleton por processo). */
export const prisma = new PrismaClient();
