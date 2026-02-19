import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, AuditUserContext } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(createUserDto: CreateUserDto, actor: AuditUserContext) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    await this.audit.log('User', user.id, 'CREATE', actor, { after: userWithoutPassword });

    return userWithoutPassword;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            maintenances: true,
            uploadedDocuments: true,
            scheduledMaintenances: true,
          },
        },
      },
    });

    return users.map(user => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, actor: AuditUserContext) {
    const before = await this.findById(id);

    if (updateUserDto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already exists');
      }
    }

    const updateData: any = { ...updateUserDto };

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    const { password: _, ...userWithoutPassword } = user;

    // Diff without password fields
    const { password: _pb, ...beforeSafe } = before;
    const diff = this.audit.diffObjects(beforeSafe, userWithoutPassword);
    await this.audit.log('User', id, 'UPDATE', actor, diff);

    return userWithoutPassword;
  }

  async remove(id: string, actor: AuditUserContext) {
    const user = await this.findById(id);

    await this.prisma.user.delete({
      where: { id },
    });

    const { password: _, ...userSafe } = user;
    await this.audit.log('User', id, 'DELETE', actor, { before: userSafe });

    return { message: 'User deleted successfully' };
  }
}
