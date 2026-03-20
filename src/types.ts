export interface Feed {
  id: string;
  title: string;
  description?: string;
  link: string;
  feedUrl: string;
  imageUrl?: string;
  lastFetched?: number;
}

export interface Article {
  id: string;
  feedId: string;
  title: string;
  link: string;
  pubDate: number;
  contentSnippet?: string;
  content?: string;
  imageUrl?: string;
  isRead: boolean;
  isFavorite: boolean;
}

export interface FullArticleContent {
  title: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  byline: string;
  dir: string;
  siteName: string;
  lang: string;
}
