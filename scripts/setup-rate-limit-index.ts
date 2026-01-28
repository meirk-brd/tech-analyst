import { MongoClient } from "mongodb";

async function setupRateLimitIndex() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is required");
  }

  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db("tech-analyst");

  // Create TTL index for automatic cleanup after 24 hours
  await db.collection("rate_limits").createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 86400 }
  );

  // Create index on IP for fast lookups
  await db.collection("rate_limits").createIndex(
    { ip: 1 },
    { unique: true }
  );

  console.log("TTL index created on rate_limits collection");

  await client.close();
  process.exit(0);
}

setupRateLimitIndex().catch((err) => {
  console.error("Failed to create index:", err);
  process.exit(1);
});
