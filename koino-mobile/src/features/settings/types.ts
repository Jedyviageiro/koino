export type UserSettings = {
  id: number;
  fullname: string;
  email: string;
  timeZone: string;
  language: string;
  profilePictureUrl: string | null;
  username: string;
  bio: string | null;
  location: string | null;
  countryCode: string | null;
  friendCode: string;
};

export type PublicProfile = {
  userId: number;
  username: string;
  fullname: string;
  profilePictureUrl: string | null;
  joinedAt: string;
  bio: string | null;
  location: string | null;
  countryCode: string | null;
  friendshipStatus: string | null;
  friendshipId: number | null;
  friendsCount: number;
  postsCount: number;
};

export type LocalPreferences = {
  pushMessages: boolean;
  pushMentions: boolean;
  planReminders: boolean;
  communityActivity: boolean;
  newFollowers: boolean;
  emailNotifications: boolean;
  weeklySummary: boolean;
};
