import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, AuditUserContext } from '../audit/audit.service';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';

@Injectable()
export class TypesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(createTypeDto: CreateTypeDto, user: AuditUserContext) {
    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createTypeDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check for duplicate name within the same category
    const existing = await this.prisma.type.findFirst({
      where: {
        categoryId: createTypeDto.categoryId,
        name: createTypeDto.name,
      },
    });

    if (existing) {
      throw new ConflictException('Type name already exists in this category');
    }

    const type = await this.prisma.type.create({
      data: createTypeDto,
      include: {
        category: true,
      },
    });

    const { category: _c, ...typeFlat } = type as any;
    await this.audit.log('Type', type.id, 'CREATE', user, { after: typeFlat });

    return type;
  }

  async findAll(categoryId?: string) {
    return this.prisma.type.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: {
        category: true,
        _count: {
          select: { machines: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const type = await this.prisma.type.findUnique({
      where: { id },
      include: {
        category: true,
        machines: {
          orderBy: { serialNumber: 'asc' },
        },
      },
    });

    if (!type) {
      throw new NotFoundException('Type not found');
    }

    return type;
  }

  async update(id: string, updateTypeDto: UpdateTypeDto, user: AuditUserContext) {
    const before = await this.findOne(id);

    if (updateTypeDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateTypeDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const type = await this.prisma.type.update({
      where: { id },
      data: updateTypeDto,
      include: {
        category: true,
      },
    });

    const { category: _cb, machines: _mb, ...beforeFlat } = before as any;
    const { category: _ca, ...afterFlat } = type as any;
    const diff = this.audit.diffObjects(beforeFlat, afterFlat);
    await this.audit.log('Type', id, 'UPDATE', user, diff);

    return type;
  }

  async remove(id: string, user: AuditUserContext) {
    const type = await this.findOne(id);

    await this.prisma.type.delete({
      where: { id },
    });

    const { category: _c, machines: _m, ...typeFlat } = type as any;
    await this.audit.log('Type', id, 'DELETE', user, { before: typeFlat });

    return { message: 'Type deleted successfully' };
  }
}
