export type CommunityPostType = 'VERSE' | 'QUESTION' | 'PHOTO';
export type CommunityAuthor = { userId: number; fullname: string; profilePictureUrl: string | null };
export type CommunityVerse = { verseId: number; reference: string; text: string };
export type CommunityComment = { commentId: number; author: CommunityAuthor; content: string; createdAt: string };
export type CommunityPost = {
  postId: number;
  author: CommunityAuthor;
  postType: CommunityPostType;
  content: string | null;
  verse: CommunityVerse | null;
  photoUrl: string | null;
  createdAt: string;
  comments: CommunityComment[];
};
export type CurrentUser = { userId: number; fullname: string; email: string; profilePictureUrl: string | null };
export type BibleBook = { bookId: number; title: string; orderIndex: number };
export type BibleChapter = { chapterId: number; chapterNumber: number; verseCount: number };
export type BibleVerseOption = { verseId: number; verseNumber: number; text: string };
