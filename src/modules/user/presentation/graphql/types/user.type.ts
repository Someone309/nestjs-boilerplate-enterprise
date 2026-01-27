import { ObjectType, Field, ID } from '@nestjs/graphql';

/**
 * User GraphQL Type
 */
@ObjectType('User')
export class UserType {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field()
  firstName!: string;

  @Field()
  lastName!: string;

  @Field()
  fullName!: string;

  @Field()
  isActive!: boolean;

  @Field()
  isEmailVerified!: boolean;

  @Field({ nullable: true })
  lastLoginAt?: Date;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

/**
 * Paginated Users Response
 */
@ObjectType('PaginatedUsers')
export class PaginatedUsersType {
  @Field(() => [UserType])
  data!: UserType[];

  @Field()
  total!: number;

  @Field()
  page!: number;

  @Field()
  limit!: number;

  @Field()
  totalPages!: number;
}
