import { Injectable, ConflictException, Logger, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employer as EmployerEntity } from '../utilis/entities/employer.entity';
import { Role } from '../shared/decorators/roles.enum';
import { HashUtil } from '../shared/utils/hash.util';
import { AwsService } from '../aws/aws.service';
import { BaseService } from '../abs/abs.service';
import { CreateJobDto } from '../utilis/entities/createJob.dto';
import { ObjectId as MongoObjectId } from 'mongodb';
import { Job } from '../utilis/entities/job.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EmployerService extends BaseService<EmployerEntity> {
    constructor(
        @InjectRepository(EmployerEntity)
        private readonly employerRepository: Repository<EmployerEntity>,
        private readonly awsService: AwsService,
    ) {
        super(employerRepository);
    }

    async createEmployer(email: string, password: string | null, role: Role): Promise<EmployerEntity> {
        try {
            // Check for existing employer with timeout
            const existingEmployer = await Promise.race([
                this.employerRepository.findOne({ where: { email } }),
                new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 10000))
            ]);

            if (existingEmployer) {
                throw new ConflictException('Employer with this email already exists');
            }

            // Create new employer entity with production-optimized password hashing
            const logger = new Logger('EmployerService');
            logger.log(`🔐 Hashing password for employer: ${email}`);
            const hashStartTime = Date.now();
            
            const hashedPassword = password ? await HashUtil.hashPassword(password) : null;
            
            const hashDuration = Date.now() - hashStartTime;
            logger.log(`✅ Password hashed in ${hashDuration}ms for employer: ${email}`);
            
            const newEmployer = this.employerRepository.create({
                email,
                role: role as Role.EMPLOYER,
                password: hashedPassword,
                name: email.split('@')[0],
                isEmailVerified: false, // Explicitly set to false
            });

            // Save with timeout protection
            logger.log(`💾 Saving employer to database: ${email}`);
            const saveStartTime = Date.now();
            
            const savedEmployer = await Promise.race([
                this.employerRepository.save(newEmployer),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database save timeout')), 15000))
            ]);

            const saveDuration = Date.now() - saveStartTime;
            logger.log(`✅ Employer saved successfully in ${saveDuration}ms: ${email}`);

            return savedEmployer;
        } catch (error) {
            const logger = new Logger('EmployerService');
            logger.error(`❌ Error creating employer: ${error.message}`);
            logger.error(`❌ Error stack: ${error.stack}`);
            
            if (error instanceof ConflictException) {
                throw error;
            }
            
            // Log database errors for debugging
            console.error('Database error in createEmployer:', error.message);
            console.error('Error stack:', error.stack);
            
            if (error.message?.includes('timeout')) {
                throw new InternalServerErrorException('Database operation timeout');
            }
            
            throw new InternalServerErrorException('Database error while creating employer');
        }
    }

    async findByEmail(email: string): Promise<EmployerEntity | null> {
        try {
            return await Promise.race([
                this.employerRepository.findOne({
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
            throw new InternalServerErrorException('Database error while finding employer by email');
        }
    }

    async getById(id: string): Promise<EmployerEntity | null> {
        if (!MongoObjectId.isValid(id)) {
            throw new BadRequestException('Invalid ID format');
        }
        return this.employerRepository.findOne({
            where: { _id: new MongoObjectId(id) },
        });
    }

    async updateProfile(
        email: string,
        profileData: Partial<EmployerEntity> = {},
        file?: Express.Multer.File,
    ): Promise<EmployerEntity> {
        const employer = await this.findByEmail(email);

        if (!employer) {
            throw new NotFoundException('Employer not found');
        }

        delete profileData.email;
        delete profileData.password;

        if (file && file.buffer) {
            console.log('Uploading file:', file.originalname);

            const filename = `${uuidv4()}-${email}.jpg`;
            const uploadedUrl = await this.awsService.uploadFile(file.buffer, filename);

            profileData.logo = `https://employer-logos.nyc3.cdn.digitaloceanspaces.com/${uploadedUrl}`;
        } else {
            console.log('No file uploaded, keeping existing logo.');
            profileData.logo = employer.logo;
        }

        Object.assign(employer, profileData);
        try {
            return await Promise.race([
                this.employerRepository.save(employer),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database save timeout')), 15000))
            ]);
        } catch (error: any) {
            console.error('Database error in updateProfile:', error.message);
            if (error.message?.includes('timeout')) {
                throw new InternalServerErrorException('Database save timeout');
            }
            throw new InternalServerErrorException('Failed to update employer profile');
        }
    }

     async update(id: MongoObjectId, updateData: Partial<EmployerEntity>): Promise<EmployerEntity> {
      try {
        const objectId = new MongoObjectId(id); // Convert string to ObjectId
        await Promise.race([
          this.employerRepository.update(objectId, updateData),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database update timeout')), 10000))
        ]);
        return await Promise.race([
          this.employerRepository.findOneOrFail({ where: { _id: objectId } }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 10000))
        ]);
      } catch (error: any) {
        console.error('Database error in employer update:', error.message);
        if (error.message?.includes('timeout')) {
          throw new InternalServerErrorException('Database operation timeout');
        }
        throw new InternalServerErrorException('Database error while updating employer');
      }
    }
}
