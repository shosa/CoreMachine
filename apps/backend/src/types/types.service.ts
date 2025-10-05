import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';

@Injectable()
export class TypesService {
  constructor(private prisma: PrismaService) {}

  async create(createTypeDto: CreateTypeDto) {
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

    return this.prisma.type.create({
      data: createTypeDto,
      include: {
        category: true,
      },
    });
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

  async update(id: string, updateTypeDto: UpdateTypeDto) {
    await this.findOne(id);

    if (updateTypeDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateTypeDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    return this.prisma.type.update({
      where: { id },
      data: updateTypeDto,
      include: {
        category: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.type.delete({
      where: { id },
    });

    return { message: 'Type deleted successfully' };
  }
}
