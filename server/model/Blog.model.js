import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  thumbnail: String,
});
const blogmodel=mongoose.model("blog",blogSchema);
export default blogmodel;
