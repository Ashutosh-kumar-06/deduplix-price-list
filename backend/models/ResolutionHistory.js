import mongoose from "mongoose";

const resolutionHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["merge", "delete"],
      required: true,
    },
    recordId: mongoose.Schema.Types.ObjectId,
    keepId: mongoose.Schema.Types.ObjectId,
    removeId: mongoose.Schema.Types.ObjectId,
    performedBy: String,
  },
  { timestamps: true },
);

export default mongoose.model("ResolutionHistory", resolutionHistorySchema);
