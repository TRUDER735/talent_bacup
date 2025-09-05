import { Controller, Get, Post, Body, Query, Param, NotFoundException, BadRequestException, Put, UploadedFile, UseInterceptors, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { BaseController } from '../abs/abs.controller';
import { TalentEntity } from '../utilis/entities/talent.entity';
import { TalentsService } from './talents.service';
import { FilterTalentDto } from '../utilis/filter.dto';
import { Roles } from '../shared/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';


@Controller('talents')
export class TalentsController extends BaseController<TalentEntity> {
    constructor(public readonly service: TalentsService) {
        super(service);
    }

    @Get('filter')
    async filterTalents(
        @Query() filterDto: FilterTalentDto
    ): Promise<TalentEntity[]> {
        return this.service.filterTalents(filterDto);
    }

    @Get('random')
    async getRandomProfiles(): Promise<TalentEntity[]> {
        return this.service.getRandomProfiles();
    }
    @Put('profile')
    @UseGuards(AuthGuard('jwt')) 
    @Roles('talent')
    @UseInterceptors(FileInterceptor('file'))
    async createProfile(
        @Body('email') email: string,
        @Body() profileData: Partial<TalentEntity>,
        @UploadedFile() file?: Express.Multer.File, 
    ) {
        return this.service.createProfile(email, profileData, file);
    }


    // @Put('updateprofile')
    // // @UseGuards(AuthGuard('jwt')) // Ensure authentication
    // @UseInterceptors(FileInterceptor('profilePic'))
    // async updateProfile(
    //     @Request() req: any,
    //     @Body() profileData,
    //     @UploadedFile() file: Express.Multer.File
    // ) {
    //     console.log('Request User:', req.user); // Debugging

    //     if (!req.user) {
    //         throw new UnauthorizedException('User not authenticated');
    //     }

    //     return this.service.updateProfile(req.user.id, req.user.role, profileData, file);
    // }
}