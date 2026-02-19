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
import { MachinesService } from './machines.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('machines')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Post()
  @Roles(UserRole.admin)
  create(@Body() createMachineDto: CreateMachineDto, @Request() req: any) {
    return this.machinesService.create(createMachineDto, req.user);
  }

  @Get()
  findAll(@Query('typeId') typeId?: string, @Query('categoryId') categoryId?: string) {
    return this.machinesService.findAll({ typeId, categoryId });
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.machinesService.search(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.machinesService.findOne(id);
  }

  @Get(':id/qrcode')
  async getQRCode(@Param('id') id: string) {
    const qrCodeDataUrl = await this.machinesService.generateQRCode(id);
    return { qrCode: qrCodeDataUrl };
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.tecnico)
  update(@Param('id') id: string, @Body() updateMachineDto: UpdateMachineDto, @Request() req: any) {
    return this.machinesService.update(id, updateMachineDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.admin)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.machinesService.remove(id, req.user);
  }
}
