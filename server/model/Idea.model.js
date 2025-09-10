import mongoose from "mongoose";

const ideaSchema = new mongoose.Schema({
  title: { type: String },
  description: String,
  status: {
    type: String,
    enum: ["Indevelopment", "Progress", "Complete"],
    default: "Indevelopment",
  },
  reactions:{
    type:Array
  },
  adminApprove: { type: Boolean, default: false },
  vote: { type: Number, default: 0 },
  userIds:
   [{ type: String }], 
});
const ideeamodel=mongoose.model("idea",ideaSchema)
export default ideeamodel