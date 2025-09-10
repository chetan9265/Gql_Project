import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema({
  data:String
});
const reactionmodel=mongoose.model("reaction",reactionSchema);
export default reactionmodel
