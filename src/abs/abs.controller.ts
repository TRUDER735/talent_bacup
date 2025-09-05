import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { BaseService } from './abs.service';
import { ObjectId } from 'mongodb';
import BaseEntity from '../utilis/base.entity';

@Controller('entities')
export class BaseController<T extends BaseEntity> {
    protected readonly service: BaseService<T>;

    constructor(service: BaseService<T>) {
        this.service = service;
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<T> {
        try {
            const objectIdParsed = new ObjectId(id);
            return this.service.findOne({ where: { _id: objectIdParsed as any } });
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @Get()
    async findMany(@Query() query: any) {
        return this.service.findMany(query);
    }

    @Post()
    async createOne(@Body() dto: T) {
        return this.service.createOne(dto);
    }

    @Put(':id')
    async updateOne(@Param('id') id: string, @Body() dto: Partial<T>) {
        return this.service.updateOne(id, dto);
    }
    @Delete(':id')
    async deleteOne(@Param('id') id: string) {
        return this.service.deleteOne(id);
    }
}