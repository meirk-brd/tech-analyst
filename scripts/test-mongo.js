const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");

dotenv.config({ path: ".env.local" });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI. Set it in .env.local before testing.");
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB connection OK.");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("MongoDB connection failed:", error?.message || error);
  process.exit(1);
});
