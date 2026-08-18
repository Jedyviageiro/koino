export type AuthSession = {
  id: number;
  token: string;
  refreshToken: string;
  email: string;
  fullname: string;
  profilePictureUrl: string | null;
  language: string;
};

export type RegistrationResult = {
  id: number;
  email: string;
  fullname: string;
  verificationRequired: boolean;
};
