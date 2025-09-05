import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    ObjectId,
    ObjectIdColumn,
    JoinColumn,
    Index,
} from 'typeorm';
import { Employer } from './employer.entity';
import { ObjectId as MongoObjectId } from 'mongodb';
import { Application } from './application.entity';
import BaseEntity from '../base.entity';

@Entity('jobs')
export class Job extends BaseEntity {

    @ObjectIdColumn()
    id: ObjectId;

    @Column()
    @Index()
    title: string;

    @Column('text')
    description: string;

    @Column('text', { nullable: true })
    requirements: string;

    @Column('text', { nullable: true })
    requiredSkills: string[];

    @Column('text', { nullable: true })
    workType: string;

    @Column('text', { nullable: true })
    experience: string;

    @Column()
    @Index()
    location: string;

    @Column({ type: 'decimal', nullable: true })
    salary: number;

    @Column({ type: 'timestamp', nullable: true })
    applicationDeadline: Date;

    @Column({ default: true })
    status: boolean;


    @Column()
    remote: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column()
    employerId: MongoObjectId;


    @OneToMany(() => Application, (application) => application.job)
    applicants: Application[];
}
