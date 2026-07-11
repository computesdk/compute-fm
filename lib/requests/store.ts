import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { RequestStatus, SongRequest, WishlistItem } from "./types";

// Persistence for the *aggregate* view: a log of requests plus the
// should-purchase wishlist. The per-request "who to notify" state lives inside
// the durable workflow, so this store only needs simple writes and list reads.
export interface RequestStore {
  createRequest(request: SongRequest): Promise<void>;
  updateRequestStatus(
    id: string,
    status: RequestStatus,
    patch?: Partial<Pick<SongRequest, "reason">>
  ): Promise<void>;
  listRequests(limit?: number): Promise<SongRequest[]>;
  addToWishlist(item: Omit<WishlistItem, "requestCount" | "firstRequestedAt" | "lastRequestedAt">): Promise<void>;
  listWishlist(): Promise<WishlistItem[]>;
}

const TABLE = process.env.SONG_REQUESTS_TABLE || "compute-fm-song-requests";
const REQUEST_PK = "REQUEST";
const WISHLIST_PK = "WISHLIST";

let docClient: DynamoDBDocumentClient | null = null;
function client(): DynamoDBDocumentClient {
  if (!docClient) {
    docClient = DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" }),
      { marshallOptions: { removeUndefinedValues: true } }
    );
  }
  return docClient;
}

class DynamoRequestStore implements RequestStore {
  async createRequest(request: SongRequest): Promise<void> {
    await client().send(
      new PutCommand({
        TableName: TABLE,
        Item: { pk: REQUEST_PK, sk: request.id, ...request },
      })
    );
  }

  async updateRequestStatus(
    id: string,
    status: RequestStatus,
    patch?: Partial<Pick<SongRequest, "reason">>
  ): Promise<void> {
    const names: Record<string, string> = { "#s": "status", "#u": "updatedAt" };
    const values: Record<string, unknown> = { ":s": status, ":u": Date.now() };
    let expr = "SET #s = :s, #u = :u";
    if (patch?.reason) {
      names["#r"] = "reason";
      values[":r"] = patch.reason;
      expr += ", #r = :r";
    }
    await client().send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { pk: REQUEST_PK, sk: id },
        UpdateExpression: expr,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      })
    );
  }

  async listRequests(limit = 100): Promise<SongRequest[]> {
    const res = await client().send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": REQUEST_PK },
        ScanIndexForward: false,
        Limit: limit,
      })
    );
    return (res.Items ?? []) as SongRequest[];
  }

  async addToWishlist(
    item: Omit<WishlistItem, "requestCount" | "firstRequestedAt" | "lastRequestedAt">
  ): Promise<void> {
    const now = Date.now();
    await client().send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { pk: WISHLIST_PK, sk: item.trackKey },
        UpdateExpression:
          "SET #t = :t, #a = :a, trackKey = :k, lastRequestedAt = :now, firstRequestedAt = if_not_exists(firstRequestedAt, :now) ADD requestCount :one",
        ExpressionAttributeNames: { "#t": "title", "#a": "artist" },
        ExpressionAttributeValues: {
          ":t": item.title,
          ":a": item.artist ?? "",
          ":k": item.trackKey,
          ":now": now,
          ":one": 1,
        },
      })
    );
  }

  async listWishlist(): Promise<WishlistItem[]> {
    const res = await client().send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": WISHLIST_PK },
      })
    );
    const items = (res.Items ?? []) as WishlistItem[];
    return items.sort((a, b) => b.requestCount - a.requestCount);
  }
}

let store: RequestStore | null = null;
export function getStore(): RequestStore {
  if (!store) store = new DynamoRequestStore();
  return store;
}
