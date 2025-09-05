import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import * as _ from 'lodash';
import BaseEntity from '../utilis/base.entity';

export class BaseService<T extends BaseEntity> {
    constructor(private readonly repository: Repository<T>) {}


    async findOne(filter: FindOneOptions<T>): Promise<T> {
        if (filter == null)
            throw new BadRequestException('Filter Query should be provided');
        const entity = await this.repository.findOne(filter);
        if (!entity) throw new NotFoundException('Entity not found');
        return entity;
    }

    async findMany(filter?: FindManyOptions<T>): Promise<T[]> {
        return this.repository.find(filter);
    }

    async createOne(dto: T): Promise<T> {
        if (_.isEmpty(dto)) throw new BadRequestException('dto should be provided');
        return this.repository.save(dto);
    }

    async updateOne(_id: string, dto: Partial<T>): Promise<T> {
        if (_.isEmpty(dto)) throw new BadRequestException('dto should be provided');

        const filter: FindOneOptions<T> = {
            where: { _id: _id as any }
        };

        const entity = await this.repository.findOne(filter);
        if (!entity) throw new NotFoundException('Entity not found');

        Object.assign(entity, dto);
        return this.repository.save(entity);
    }

    // async deleteMany(ids: string[]): Promise<void> {
    //     const result = await this.repository.delete(ids);
    //     if (result.affected === 0) {
    //         throw new NotFoundException('No entities found for the provided IDs');
    //     }
    // }

    async deleteOne(_id: string): Promise<void> {
        const result = await this.repository.delete(_id);
        if (result.affected === 0) {
            throw new NotFoundException('No entity found for the provided ID');
        }
    }

    protected async seedWith(seeds: T[]): Promise<void> {
        await Promise.all(
            seeds.map(async (entity) => {
                const exists = await this.repository.count({
                    where: { _id: entity._id as any },
                });
                if (!exists) {
                    await this.repository.save(entity);
                }
            }),
        );
  }
}