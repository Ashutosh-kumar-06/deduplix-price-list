import mongoose from "mongoose";

const priceListSchema = new mongoose.Schema(
  {
    plNumber: {
      type: String,
      required: true,
      index: true,
    },
    description: String,
    status: {
      type: String,
      enum: ["active", "duplicate", "removed"],
      default: "active",
    },
    norm: String,
    createdBy: String,
  },
  { timestamps: true },
);

export default mongoose.model("PriceList", priceListSchema);
