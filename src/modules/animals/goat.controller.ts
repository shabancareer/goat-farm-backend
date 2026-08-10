import { Controller, Post, Body, Get, Param, HttpStatus, HttpCode, Delete, Put } from '@nestjs/common';
import { GoatService } from './goat.service';
import { CreateGoatDto } from './dto/create-goat.dto';
import { UpdateGoatDto } from './dto/update-goat.dto';
import { GoatQueryDto } from './dto/goat-query.dto';
import { IGoatResponse } from './interfaces/goat.interface';
import { Goat } from './schemas/goat.schema';

@Controller('goats')
export class GoatController {
    constructor(private readonly goatService: GoatService) {
    }
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createGoatDto: CreateGoatDto): Promise<{
        success: boolean;
        message: string;
        data: Goat
    }> {
        const savedGoat = await this.goatService.create(createGoatDto);

        return {
            success: true,
            message: 'Goat saved successfully to MongoDB Atlas',
            data: savedGoat,
        };
    }

    @Get()
    async findAll(): Promise<{
        success: boolean;
        count: number;
        data: Goat[]
    }> {
        const goats = await this.goatService.findAll();

        return {
            success: true,
            count: goats.length,
            data: goats,
        };
    }
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<{
        success: boolean;
        data: Goat
    }> {
        const goat = await this.goatService.findOne(id);

        return {
            success: true,
            data: goat,
        };
    }
    @Put(':id')
    async update(@Param('id') id: string, @Body() updateGoatDto: UpdateGoatDto): Promise<{
        success: boolean;
        message: string;
        data: Goat
    }> {
        const updatedGoat = await this.goatService.update(id, updateGoatDto);

        return {
            success: true,
            message: 'Goat updated successfully',
            data: updatedGoat,
        };
    }
    @Delete(':id')
    async remove(@Param('id') id: string): Promise<{
        success: boolean;
        message: string;
        data: Goat
    }> {
        const deletedGoat = await this.goatService.remove(id);
        return {
            success: true,
            message: 'Goat deleted successfully',
            data: deletedGoat,
        };
    }
}
