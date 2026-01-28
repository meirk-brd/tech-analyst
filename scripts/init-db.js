const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");

dotenv.config({ path: ".env.local" });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI. Set it in .env.local before running init.");
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("tech-analyst");

    await db.collection("company_cache").createIndex({ url: 1 }, { unique: true });
    await db
      .collection("company_cache")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    await db.collection("analysis_sessions").createIndex({ marketSector: 1 });
    await db.collection("analysis_sessions").createIndex({ createdAt: -1 });
    await db.collection("analysis_sessions").createIndex({ status: 1 });

    console.log("MongoDB indexes created.");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Failed to setup database indexes:", error?.message || error);
  process.exit(1);
});
