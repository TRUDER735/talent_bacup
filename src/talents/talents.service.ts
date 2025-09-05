import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { BaseService } from '../abs/abs.service';
import { TalentEntity, AuthProvider } from '../utilis/entities/talent.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId, Repository } from 'typeorm';
import { ObjectId as MongoObjectId } from 'mongodb';
import { FilterTalentDto } from '../utilis/filter.dto';
import { v4 as uuidv4 } from 'uuid';
import { AwsService } from '../aws/aws.service';
import { HashUtil } from '../shared/utils/hash.util';
import * as bcrypt from 'bcrypt';
import { Role } from '../shared/decorators/roles.enum';

@Injectable()
export class TalentsService extends BaseService<TalentEntity> {

    constructor(
        @InjectRepository(TalentEntity)
        private readonly talentRepository: Repository<TalentEntity>,
        private readonly awsService: AwsService,
    ) {
        super(talentRepository);
    }
    /**
     * @param email - The email of the talent
     * @param password - The password of the talent (nullable)
     * @param authProvider - The authentication provider
     */

    async createTalent(email: string, password: string | null, authProvider: AuthProvider, role: Role): Promise<TalentEntity> {
        try {
            // Check for existing talent with timeout
            const existingTalent = await Promise.race([
                this.talentRepository.findOne({ where: { email } }),
                new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 10000))
            ]);

            if (existingTalent) {
                throw new ConflictException('User with this email already exists');
            }

            // Create new talent entity
            const newTalent = this.talentRepository.create({
                email,
                password: password ? await HashUtil.hashPassword(password) : null,
                authProvider,
                role: role as Role.TALENT,
                name: email.split('@')[0],
                isEmailVerified: false, // Explicitly set to false
            });

            // Save with timeout protection
            const savedTalent = await Promise.race([
                this.talentRepository.save(newTalent),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database save timeout')), 15000))
            ]);

            return savedTalent;
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            
            // Log database errors for debugging
            console.error('Database error in createTalent:', error.message);
            console.error('Error stack:', error.stack);
            
            if (error.message?.includes('timeout')) {
                throw new InternalServerErrorException('Database operation timeout');
            }
            
            throw new InternalServerErrorException('Database error while creating talent');
        }
    }

    async findByEmail(email: string): Promise<TalentEntity | null> {
        try {
            return await Promise.race([
                this.talentRepository.findOne({
                    where: { email },
                    select: ['id', 'email', 'password', 'isEmailVerified'],
                }),
                new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 10000))
            ]);
        } catch (error) {
            console.error('Database error in findByEmail:', error.message);
            if (error.message?.includes('timeout')) {
                throw new InternalServerErrorException('Database query timeout');
            }
            throw new InternalServerErrorException('Database error while finding talent by email');
        }
    }
    async createProfile(
        email: string,
        profileData: Partial<TalentEntity> = {}, 
        file?: Express.Multer.File,
    ): Promise<TalentEntity> {
        const talent = await this.findByEmail(email);

        if (!talent) {
            throw new NotFoundException('Talent not found');
        }

        profileData = profileData ?? {};

        delete profileData.email;
        delete profileData.password;
        delete profileData.authProvider;

        profileData.education = profileData.education
            ? [...(talent.education || []), ...(typeof profileData.education === 'string' ? JSON.parse(profileData.education) : profileData.education)]
            : talent.education;

        profileData.skills = profileData.skills
            ? Array.from(new Set([...(talent.skills || []), ...(typeof profileData.skills === 'string' ? JSON.parse(profileData.skills) : profileData.skills)]))
            : talent.skills;

        profileData.experience = profileData.experience
            ? [...(talent.experience || []), ...(typeof profileData.experience === 'string' ? JSON.parse(profileData.experience) : profileData.experience)]
            : talent.experience;
        
        
        if (file && file.buffer) {
            console.log('Uploading file:', file.originalname);

            const filename = `${uuidv4()}-${email}.jpg`;
            const uploadedUrl = await this.awsService.uploadFile(file.buffer, filename);

            profileData.profilePicUrl = `https://talent-profiles.nyc3.cdn.digitaloceanspaces.com/${uploadedUrl}`;
        } else {
            console.log('No file uploaded, keeping existing profile picture.');
            profileData.profilePicUrl = talent.profilePicUrl; 
        }

        Object.assign(talent, profileData);
        return await this.talentRepository.save(talent);
    }



   async filterTalents(filterDto: FilterTalentDto): Promise<TalentEntity[]> {
  let { isHired, industry, keyword } = filterDto;

 

  const query: any = {};

  if (isHired !== undefined) {
    query.isHired = isHired;
  }

  if (industry) {
    query.industry = new RegExp(`^${industry}$`, 'i');
  }

  if (keyword?.trim()) {
    const regex = new RegExp(keyword, 'i');
    query.$or = [
      { name: regex },
      { skills: regex },
      { location: regex },
    ];
  }

  return await this.talentRepository.find({
    where: query,
    order: { createdAt: 'ASC' },
  });
}



    async getRandomProfiles(count: number = 14): Promise<TalentEntity[]> {
        const allProfiles = await this.talentRepository.find();
        return allProfiles.sort(() => Math.random() - 0.5).slice(0, count);
    }

    async createOne(dto: any): Promise<TalentEntity> {
        if (!dto.password) {
            throw new BadRequestException('Password must be provided');
        }

        const salt = await bcrypt.genSalt();
        dto.password = await bcrypt.hash(dto.password, salt);

        return super.createOne(dto);
    }

   async update(id: MongoObjectId, updateData: Partial<TalentEntity>): Promise<TalentEntity> {
        try {
            const objectId = new MongoObjectId(id); // Convert string to ObjectId
            
            // Update with timeout protection
            await Promise.race([
                this.talentRepository.update(objectId, updateData),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database update timeout')), 10000))
            ]);
            
            // Find updated record with timeout protection
            return await Promise.race([
                this.talentRepository.findOneOrFail({ where: { _id: objectId } }),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 10000))
            ]);
        } catch (error) {
            console.error('Database error in talent update:', error.message);
            if (error.message?.includes('timeout')) {
                throw new InternalServerErrorException('Database operation timeout');
            }
            throw new InternalServerErrorException('Database error while updating talent');
        }
    }


    // async updateProfile(
    //     talentId: string,
    //     userRole: string,
    //     profileData: Partial<TalentEntity>,
    //     file?: Express.Multer.File,
    // ): Promise<TalentEntity> {
    //     const talent = await this.talentRepository.findOne({ where: { id: new ObjectId(talentId) } });
    //     console.log('talent', talent);

    //     if (!talent) {
    //         throw new NotFoundException('Talent not found');
    //     }

    //     // Ensure only talents can update their profiles
    //     // if (userRole !== 'talent') {
    //     //     throw new ForbiddenException('Only talents can update their profile');
    //     // }

    //     delete profileData.email;
    //     delete profileData.password;
    //     delete profileData.authProvider;

    //     profileData.education = typeof profileData.education === 'string' ? JSON.parse(profileData.education) : profileData.education;
    //     profileData.skills = typeof profileData.skills === 'string' ? JSON.parse(profileData.skills) : profileData.skills;
    //     profileData.experience = typeof profileData.experience === 'string' ? JSON.parse(profileData.experience) : profileData.experience;

    //     if (file) {
    //         const filename = `${uuidv4()}-${talent.email}.jpg`;
    //         const uploadedUrl = await this.awsService.uploadFile(file.buffer, filename);
    //         profileData.profilePicUrl = `https://talent-profiles.nyc3.cdn.digitaloceanspaces.com/${uploadedUrl}`;
    //     }

    //     Object.assign(talent, profileData);
    //     return await this.talentRepository.save(talent);
        

    // }
}
