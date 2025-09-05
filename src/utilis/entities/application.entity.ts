// application.entity.ts
import { Entity, ObjectIdColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Job } from './job.entity';


export enum ApplicationStatus {
  PENDING = 'pending',
  INTERVIEW_INVITED = 'interview_invited',
  // Add other statuses as needed
}

export abstract class BaseEntity {
  _id?: ObjectId;
}

@Entity('applications')
export class Application extends BaseEntity  {
    @ObjectIdColumn()
    id: ObjectId;

  @Column()
  jobId: ObjectId;

  @Column()
  talentId: ObjectId;

  @ManyToOne(() => Job, (job) => job.applicants)
    @JoinColumn({ name: 'jobId' }) // Explicitly tell TypeORM which column is the foreign key
    job: Job;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING
  })
  status: ApplicationStatus;

  @Column({ nullable: true })
  coverLetter?: string;

  @Column({ nullable: true })
  resumeUrl?: string;

  @Column({ nullable: true })
  interviewDate?: Date;

  @Column({ nullable: true })
  interviewDetails?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}