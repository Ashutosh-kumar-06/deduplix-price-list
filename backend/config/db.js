import mongoose from "mongoose";
import User from "../models/User.js";
import PriceList from "../models/PriceList.js";

export async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri || typeof mongoUri !== "string") {
      throw new Error(
        "MONGODB_URI is missing. Create a .env file in the project root with a valid MongoDB connection string.",
      );
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");

    // Remove legacy user type field from existing records.
    const cleanupResult = await User.updateMany(
      { role: { $exists: true } },
      { $unset: { role: "" } },
    );
    if (cleanupResult.modifiedCount > 0) {
      console.log(
        `✓ Removed role field from ${cleanupResult.modifiedCount} users`,
      );
    }

    // Seed a default user if none exists
    const defaultUserExists = await User.findOne({ email: "user@example.com" });
    if (!defaultUserExists) {
      const defaultUser = new User({
        name: "User",
        email: "user@example.com",
        passwordHash: "user12345",
      });
      await defaultUser.save();
      console.log("✓ Seeded default user (user@example.com / user12345)");
    }

    // Seed sample price list data if empty
    const count = await PriceList.countDocuments();
    if (count === 0) {
      const sampleData = [
        {
          plNumber: "PL-001",
          description: "Standard Product A",
          norm: "PL001",
        },
        {
          plNumber: "PL-002",
          description: "Standard Product B",
          norm: "PL002",
        },
        { plNumber: "PL001", description: "Product A Variant", norm: "PL001" },
        { plNumber: "PL-003", description: "Premium Product C", norm: "PL003" },
        { plNumber: "PL-002", description: "Product B Updated", norm: "PL002" },
        { plNumber: "PL-004", description: "Budget Product D", norm: "PL004" },
        {
          plNumber: "PL-005",
          description: "Enterprise Product E",
          norm: "PL005",
        },
        { plNumber: "PL005", description: "Product E Variant", norm: "PL005" },
        { plNumber: "PL-006", description: "Custom Solution F", norm: "PL006" },
        { plNumber: "PL-007", description: "Special Offer G", norm: "PL007" },
        { plNumber: "PL-008", description: "Limited Edition H", norm: "PL008" },
        { plNumber: "PL008", description: "Product H Restock", norm: "PL008" },
        { plNumber: "PL-009", description: "Clearance Item I", norm: "PL009" },
        { plNumber: "PL-010", description: "New Launch J", norm: "PL010" },
        {
          plNumber: "PL010",
          description: "Product J Pre-order",
          norm: "PL010",
        },
      ];
      await PriceList.insertMany(sampleData);
      console.log("✓ Seeded 15 sample price list records");
    }
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}
