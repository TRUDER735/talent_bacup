// dtos/application.dto.ts
export class ApplicationWithJobDto {
  id: string;
  status: string;
  appliedAt: Date;
  coverLetter?: string;
  interviewDate?: Date;
  interviewDetails?: string;
  createdAt: Date;
  updatedAt: Date;
  job: {
    id: string;
    title: string;
    company?: string;
    location: string;
  } | null;
}

export class ApplicationWithTalentDto {
  id: string;
  status: string;
  appliedAt: Date;
  coverLetter?: string;
  interviewDate?: Date;
  interviewDetails?: string;
  createdAt: Date;
  updatedAt: Date;
  talent: {
    id: string;
    name: string;
    email: string;
    skills?: string[];
  } | null;
}