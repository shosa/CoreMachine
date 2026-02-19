import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, AuditUserContext } from '../audit/audit.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, user: AuditUserContext) {
    const existing = await this.prisma.category.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existing) {
      throw new ConflictException('Category name already exists');
    }

    const category = await this.prisma.category.create({
      data: createCategoryDto,
    });

    await this.audit.log('Category', category.id, 'CREATE', user, { after: category });

    return category;
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        types: {
          include: {
            _count: {
              select: { machines: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        types: {
          include: {
            _count: {
              select: { machines: true },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, user: AuditUserContext) {
    const before = await this.findOne(id);

    if (updateCategoryDto.name) {
      const existing = await this.prisma.category.findUnique({
        where: { name: updateCategoryDto.name },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Category name already exists');
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });

    const { types: _t, ...beforeFlat } = before as any;
    const diff = this.audit.diffObjects(beforeFlat, category);
    await this.audit.log('Category', id, 'UPDATE', user, diff);

    return category;
  }

  async remove(id: string, user: AuditUserContext) {
    const category = await this.findOne(id);

    await this.prisma.category.delete({
      where: { id },
    });

    const { types: _t, ...categoryFlat } = category as any;
    await this.audit.log('Category', id, 'DELETE', user, { before: categoryFlat });

    return { message: 'Category deleted successfully' };
  }
}
