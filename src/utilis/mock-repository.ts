import { Repository } from 'typeorm';
import { MockType } from './mock.type';



export const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(
  () => ({
    findOne: jest.fn((entity) => entity),
    find: jest.fn(() => []),
    save: jest.fn((entity) => entity),
    delete: jest.fn(() => ({ affected: 1 })),
  }),
);