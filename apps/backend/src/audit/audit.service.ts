import { Injectable } from '@nestjs/common';
import { AuditAction, AuditEntity } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditUserContext {
  id: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    entity: AuditEntity,
    entityId: string,
    action: AuditAction,
    user: AuditUserContext,
    changes?: object,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          entity,
          entityId,
          action,
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          changes: changes ? (changes as any) : undefined,
        },
      });
    } catch {
      // Audit logging failure must not break business operations
    }
  }

  diffObjects(
    before: Record<string, any>,
    after: Record<string, any>,
  ): { before: Record<string, any>; after: Record<string, any> } {
    const EXCLUDED = new Set(['password', 'createdAt', 'updatedAt']);
    const changedBefore: Record<string, any> = {};
    const changedAfter: Record<string, any> = {};

    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of allKeys) {
      if (EXCLUDED.has(key)) continue;
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changedBefore[key] = before[key];
        changedAfter[key] = after[key];
      }
    }

    return { before: changedBefore, after: changedAfter };
  }

  async findAll(filters: {
    entity?: AuditEntity;
    entityId?: string;
    userId?: string;
    action?: AuditAction;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.entity) where.entity = filters.entity;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
