import {
    Column,
    CreateDateColumn,
    Entity,
    ObjectId,
    ObjectIdColumn,
    OneToMany,
} from 'typeorm';
import BaseEntity from '../../utilis/base.entity';
import { Application } from './application.entity';
import { Role } from '../../shared/decorators/roles.enum';

export enum Industry {
    SOFTWARE_DEVELOPMENT = 'Software Development',
    DIGITAL_MARKETING = 'Digital Marketing',
    DESIGN = 'Design',
    DATA_SCIENCE = 'Data Science',
}

export enum AuthProvider {
    EMAIL = 'email',
    GOOGLE = 'google',
}

export interface Project {
    projectName: string;
    projectUrl: string;
    projectDescription: string;
}

export interface Education {
    school: string;
    degree: string;
    fieldOfStudy: string;
    startDate: Date;
    endDate: Date;
}

export enum Location {
    ONSITE = 'onsite',
    REMOTE = 'remote',
    HYBRID = 'hybrid',
}

export interface Experience {
    company: string;
    position: string;
    startDate: Date;
    endDate: Date;
    description: string;
    location: Location;
}

export interface Volunteering {
    organization: string;
    position: string;
    startDate: Date;
    endDate: Date;
    description: string;
}

@Entity('talents')
export class TalentEntity extends BaseEntity {
    @ObjectIdColumn()
    id: ObjectId;

    @Column({ unique: true })
    email: string;

    @Column({type:'enum', default: Role.TALENT, enum: Role})
    role:Role;

    @Column({ nullable: true })
    password?: string | null; 

    @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.EMAIL })
    authProvider: AuthProvider;

    @Column({type: 'boolean', default: false})
    isEmailVerified: boolean;

    @Column()
    name: string;

    @Column()
    slug: string;

    @Column({ nullable: true })
    profilePicUrl?: string;

    @Column({ nullable: true })
    bio?: string;

    @Column({ nullable: true })
    resumeUrl?: string;

    @Column({ nullable: true })
    portfolioUrl?: string;

    @Column({ nullable: true })
    linkedInUrl?: string;

    @Column({ nullable: true })
    githubUrl?: string;

    @Column({ nullable: true })
    xUrl?: string;

    @Column({ nullable: true })
    instagramUrl?: string;

    @Column({ nullable: true })
    occupation?: string;

    @Column({ nullable: true })
    location?: string;

    @Column({ type: 'enum', enum: Industry, nullable: true })
    industry?: Industry;

    @Column({ type: 'simple-array', nullable: true })
    skills?: string[];

    @Column({ type: 'json', nullable: true })
    education?: Education[];

    @Column({ type: 'json', nullable: true })
    experience?: Experience[]; // Corrected spelling

    @Column({ type: 'json', nullable: true })
    projects?: Project[];

    @Column({ type: 'json', nullable: true })
    volunteering?: Volunteering[];

    @Column({ default: false })
    status: boolean;

    @Column({ default: false })
    isHired: boolean;
    // @OneToMany(() => Application, (application) => application.talent, { cascade: true })
    // applications: Application[];

    @CreateDateColumn()
    createdAt: Date;
}
