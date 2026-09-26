import { type Filter, ObjectId } from "mongodb";
import { getMongoDatabase } from "../../mongodb/client.js";

type EventDocument = { _id: string | ObjectId; [key: string]: any };
type EventPayload = Record<string, any>;

function idFilter(id: string) {
  if (ObjectId.isValid(id)) {
    return { _id: { $in: [id, new ObjectId(id)] } };
  }
  return { _id: id };
}

function buildPayload(input: any, includeCreatedAt = true) {
  const payload: EventPayload = {
    name: input.name,
    nameFr: input.nameFr ?? null,
    status: input.status ?? null,
    sport: input.sport ?? null,
    venue: input.venue ?? null,
    location: input.location ?? null,
    startAt: input.startAt ?? null,
    endAt: input.endAt ?? null,
    updatedAt: new Date(),
  };

  if (includeCreatedAt) payload.createdAt = input.createdAt ?? new Date();
  return payload;
}

function buildCreateDocument(input: any) {
  const id = new ObjectId().toHexString();
  return {
    _id: id,
    ...buildPayload(input),
  };
}

export async function listEvents(
  params?: { status?: string; limit?: number; sort?: "asc" | "desc" },
) {
  const db = await getMongoDatabase();
  const collection = db.collection<EventDocument>("events");

  const filter: Filter<EventDocument> = {};

  if (params?.status) {
    filter.status = params.status;
  }

  const docs = await collection
    .find(filter)
    .limit(params?.limit ?? 100)
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((doc) => ({
    ...doc,
    // _id: doc._id.toString(),
    // datetime: doc.datetime instanceof Date ? doc.datetime.toISOString() : doc.datetime,
  }));
}

export async function getEventById(id: string) {
  const db = await getMongoDatabase();
  const collection = db.collection<EventDocument>("events");

  const filter: Filter<EventDocument> = ObjectId.isValid(id)
    ? { _id: new ObjectId(id) }
    : ({ name: id } as any);

  const doc = await collection.findOne(filter);
  if (!doc) return null;

  return {
    ...doc,
    _id: doc._id.toString(),
    startAt: doc.startAt instanceof Date ? doc.startAt.toISOString() : doc.startAt,
  };
}

export async function createEvent(input: any) {
  const db = await getMongoDatabase();
  const document = buildCreateDocument(input);
  const { _id, ...safeBody } = document as any;
  await db.collection<EventDocument>("events").insertOne(safeBody);
  return getEventById(String(document._id));
}

export async function updateEvent(id: string, input: EventPayload) {
  const db = await getMongoDatabase();
  const collection = db.collection<EventDocument>("events");

  const filter = idFilter(id);
  const payload = buildPayload(input, false);

  const fields = ["name", "nameFr", "status", "sport", "location", "startAt", "endAt", "venue"] as const;

  const changed = Object.fromEntries(
    fields
      .filter((field) => Object.prototype.hasOwnProperty.call(input, field))
      .map((field) => [field, payload[field]]),
  );

  await collection.updateOne(filter, {
    $set: { ...changed, updatedAt: new Date() },
  });

  return getEventById(id);
}

export async function deleteEvent(id: string) {
  const db = await getMongoDatabase();

  const result = await db
    .collection<EventDocument>("events")
    .deleteOne(idFilter(id));

  return result.deletedCount === 1;
}