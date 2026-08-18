import { Controller, Post, Body, Get, Param, HttpStatus, HttpCode, Delete, Put, UseGuards } from '@nestjs/common';
import { GoatService } from './goat.service';
import { CreateGoatDto } from './dto/create-goat.dto';
import { UpdateGoatDto } from './dto/update-goat.dto';
import { Goat } from './schemas/goat.schema';
import { CurrentUser } from '../../common/decorators/Rbac.decorator';
import type { RequestUser } from '../../common/interfaces/jwt.interface';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Controller('goats')
@UseGuards(RolesGuard, PermissionsGuard)
export class GoatController {
    constructor(private readonly goatService: GoatService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @CurrentUser() user: RequestUser,
        @Body() createGoatDto: CreateGoatDto,
    ): Promise<{
        success: boolean;
        message: string;
        data: Goat;
    }> {
        const savedGoat = await this.goatService.create({
            ...createGoatDto,
            orgId: user?.orgId,
        } as any);

        return {
            success: true,
            message: 'Goat saved successfully to MongoDB Atlas',
            data: savedGoat,
        };
    }

    @Get()
    async findAll(@CurrentUser() user: RequestUser): Promise<{
        success: boolean;
        count: number;
        data: Goat[];
    }> {
        // All users (including Super Owners) view goats strictly filtered by active organization
        const goats = await this.goatService.findAll(user?.orgId);

        return {
            success: true,
            count: goats.length,
            data: goats,
        };
    }

    @Get(':id')
    async findOne(
        @CurrentUser() user: RequestUser,
        @Param('id') id: string,
    ): Promise<{
        success: boolean;
        data: Goat;
    }> {
        const goat = await this.goatService.findOne(id, user?.orgId);

        return {
            success: true,
            data: goat,
        };
    }

    @Put(':id')
    async update(
        @CurrentUser() user: RequestUser,
        @Param('id') id: string,
        @Body() updateGoatDto: UpdateGoatDto,
    ): Promise<{
        success: boolean;
        message: string;
        data: Goat;
    }> {
        const updatedGoat = await this.goatService.update(id, updateGoatDto, user?.orgId);

        return {
            success: true,
            message: 'Goat updated successfully',
            data: updatedGoat,
        };
    }

    @Delete(':id')
    async remove(
        @CurrentUser() user: RequestUser,
        @Param('id') id: string,
    ): Promise<{
        success: boolean;
        message: string;
        data: Goat;
    }> {
        const deletedGoat = await this.goatService.remove(id, user?.orgId);
        return {
            success: true,
            message: 'Goat deleted successfully',
            data: deletedGoat,
        };
    }
}
