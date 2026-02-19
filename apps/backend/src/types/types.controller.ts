import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { TypesService } from './types.service';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TypesController {
  constructor(private readonly typesService: TypesService) {}

  @Post()
  @Roles(UserRole.admin)
  create(@Body() createTypeDto: CreateTypeDto, @Request() req: any) {
    return this.typesService.create(createTypeDto, req.user);
  }

  @Get()
  findAll(@Query('categoryId') categoryId?: string) {
    return this.typesService.findAll(categoryId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.typesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.admin)
  update(@Param('id') id: string, @Body() updateTypeDto: UpdateTypeDto, @Request() req: any) {
    return this.typesService.update(id, updateTypeDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.admin)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.typesService.remove(id, req.user);
  }
}
