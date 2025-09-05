import { PartialType } from "@nestjs/mapped-types";
import { IsEnum, IsOptional, IsBoolean, IsInt, Min, IsString } from 'class-validator';
import { Industry } from '../utilis/entities/talent.entity';
import { Transform, Type } from "class-transformer";

class BaseFilterJobsDto {

    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value !== 'string') return value;
        const normalized = value.toLowerCase();
        const match = Object.values(Industry).find(
            (i) => i.toLowerCase() === normalized,
        );
        return match ? match : value;
    })
    location?: string;

    

    @IsOptional()
    @IsString()
    keyword?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number;
}

export class FilterJobsDto extends PartialType(BaseFilterJobsDto) { }