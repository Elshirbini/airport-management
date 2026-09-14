import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthService } from './auth.service';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

import { RegisterInput } from './graphql/inputs/register.input';
import { LoginInput } from './graphql/inputs/login.input';
import { UserProfile } from './graphql/types/user-profile.type';
import { GraphQLContext } from 'src/graphql/graphql-context';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => UserProfile, {
    description: 'Register a new passenger account. Does not issue tokens.',
  })
  register(@Args('input') input: RegisterInput): Promise<UserProfile> {
    return this.authService.register(input);
  }

  @Mutation(() => UserProfile, {
    description: 'Authenticate with email and password.',
  })
  login(
    @Args('input') input: LoginInput,
    @Context() ctx: GraphQLContext,
  ): Promise<UserProfile> {
    return this.authService.login(input, ctx.reply);
  }

  @Mutation(() => UserProfile, {
    description: 'Rotate the refresh token stored in the httpOnly cookie.',
  })
  refreshToken(@Context() ctx: GraphQLContext): Promise<UserProfile> {
    const token = ctx.request.cookies?.refreshToken;
    if (!token) {
      throw new Error('No refresh token cookie present');
    }
    return this.authService.refreshToken(token, ctx.reply);
  }

  @Mutation(() => Boolean, {
    description: 'Verify email address using the OTP sent during registration.',
  })
  verifyEmail(
    @Args('email') email: string,
    @Args('otp') otp: string,
  ): Promise<boolean> {
    return this.authService.verifyEmail(email, otp);
  }

  @UseGuards(AuthGuard)
  @Query(() => UserProfile, {
    description: 'Return the currently authenticated user profile.',
  })
  profile(@CurrentUser() userId: string): Promise<UserProfile> {
    return this.authService.profile(userId);
  }
}
