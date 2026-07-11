export type RequestStatus =
  | "pending" // waiting for the song to air naturally
  | "notifying" // watcher matched it; workflow is delivering the notification
  | "played" // aired and the requester was notified
  | "should-purchase"; // never aired in the window, or not in the catalog

export interface SongRequest {
  id: string;
  // Normalized "title|artist" key used to match against now-playing.
  trackKey: string;
  // What the requester typed, preserved verbatim.
  query: string;
  // Resolved catalog metadata when the request matched an owned track.
  matchedTitle?: string;
  matchedArtist?: string;
  slackUserId: string;
  slackChannelId: string;
  slackUserName?: string;
  status: RequestStatus;
  // Why it landed in should-purchase, when applicable.
  reason?: "not-in-catalog" | "expired";
  createdAt: number;
  updatedAt: number;
  // Absolute epoch ms after which a pending request expires to should-purchase.
  expiresAt: number;
}

export interface WishlistItem {
  // Same normalized key as SongRequest.trackKey.
  trackKey: string;
  title: string;
  artist?: string;
  requestCount: number;
  firstRequestedAt: number;
  lastRequestedAt: number;
}
