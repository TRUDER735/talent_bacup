import {
    Entity,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    ObjectIdColumn,
    ObjectId,
} from 'typeorm';
import { Job } from './job.entity';
import BaseEntity from '../../utilis/base.entity';
import { Role } from '../../shared/decorators/roles.enum';


export enum AuthProvider {
    EMAIL = 'email',
    GOOGLE = 'google',
}

@Entity('employers')
export class Employer extends BaseEntity {

    @ObjectIdColumn()
    id: ObjectId;

    @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.EMAIL })
    authProvider: AuthProvider;

    @Column({ unique: true })
    email: string;

    @Column()
    name: string;

    @Column()
    company: string;

    @Column({ default: Role.EMPLOYER, type: 'enum', enum: Role })
    role: Role.EMPLOYER;

    @Column()
    location: string;

    @Column()
    industry: string;

    @Column({ nullable: true })
    logo: string;

    @Column({ nullable: true })
    website: string;

    @Column({ default: true })
    status: boolean;

    @Column({ default: false })
    emailVerified: boolean;

    @Column({ nullable: true })
    password?: string | null;

    @Column({type: 'boolean', default: false})
    isEmailVerified: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
    
    @Column('array', { nullable: true })
    jobs: ObjectId[];
}
