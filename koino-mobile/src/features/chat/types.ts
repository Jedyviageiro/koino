export type ChatFriend = {
  userId: number;
  username: string;
  fullname: string;
  profilePictureUrl: string | null;
  lastMessage: string | null;
  lastMessageId: number | null;
  lastMessageSenderId: number | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export type ChatMessage = {
  messageId: number;
  senderId: number;
  recipientId: number;
  body: string;
  photoUrl: string | null;
  sentAt: string;
  deliveredAt: string | null;
  readAt: string | null;
};
