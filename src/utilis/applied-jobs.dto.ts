export class AppliedJobDto {
  id: string;
  status: string;
  appliedAt: Date;
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    salary?: number;
    postedAt: Date;
  };
}