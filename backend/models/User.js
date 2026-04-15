import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

// Hash password before saving - handle async properly
userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) {
    return;
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    this.passwordHash = await bcryptjs.hash(this.passwordHash, salt);
  } catch (error) {
    throw error;
  }
});

// Compare password method
userSchema.statics.comparePassword = async function (password, hash) {
  return await bcryptjs.compare(password, hash);
};

export default mongoose.model("User", userSchema);
