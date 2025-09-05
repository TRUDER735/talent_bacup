import { PartialType } from "@nestjs/mapped-types";
import { TalentEntity } from "./talent.entity";
import { Employer } from "./employer.entity";
import { Job } from "./job.entity";
import { Application } from "./application.entity";
export class TalentDto extends PartialType(TalentEntity) { }
export class EmployerDto extends PartialType(Employer) { }
export class JobDto extends PartialType(Job) { }
export class ApplicationDto extends PartialType(Application) { }