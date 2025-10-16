import { IsEnum, IsString } from 'class-validator';

enum OAuthProvider {
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

export class OAuthDto {
  @IsEnum(OAuthProvider)
  provider!: OAuthProvider;

  @IsString()
  token!: string;
}

export { OAuthProvider };
