import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
// import blogmodel from './model/Blog.model';
import blogmodel from "./model/Blog.model.js"
import ideeamodel from './model/Idea.model.js';
import reactionmodel from './model/Reaction.model.js';
import { db } from './db.js';
const typeDefs = `#graphql
  type Blog {
    id: ID!
    title: String!
    de: String!
  }
  type Blogs {
    id: ID!
    title: String!
    description: String!
    thumbnail: String!
  }
  type Idea {
    id: ID
    title: String
    description: String
    status: String
    adminApprove: Boolean
    reactions:[String!]
    userIds:[String]!
    vote: Int!
  }
  type Reaction {
  id:ID!
  data: String!
  }
    input BlogInput{
       title:String!
       description:String!
       thumbnail:String!
    }
    input AddIdeaInput {
    title: String!
    reactions:[String]!
    description: String!
  }
  input EditInput {
    id: ID!
    title: String!
    description: String!
    thumbnail: String!}
  input VoteInput {
 value:Int!
  }
  
    type Query {
    blogs: [Blogs!]!
    blogById(id: ID!): Blogs!
    ideas: [Idea!]!
    reactions: [Reaction!]!
    }
  type Mutation {
    addBlog(input: BlogInput!): Blogs!
    editBlog(id: ID!, input: BlogInput!): Blogs!
    deleteBlog(id: ID!): String!
    addIdea(input: AddIdeaInput!):Idea!
    editIdea(id: ID!, input: AddIdeaInput!): Idea!
    deleteIdea(id: ID!): String!
    ideaVote(id:ID!,userId:ID!): String
  }
`;
const resolvers = {
  Query: {
    reactions: async () => {
      const reaction = await reactionmodel.find();
      return reaction
    },
    blogs: async () => {
      const Blogs = await blogmodel.find();
      if (!Blogs) {
        return `No blogs found `
      }
      return Blogs;
    },
    blogById: async (_, { id }) => {
      const data = await blogmodel.findById(id)
      console.log(id);
      if (!data) {
        return {message:"data is not found"};
        
      }
      return data;
    },
    ideas: async () => {
      const Idea = await ideeamodel.find({
        status: { $in: ["Indevelopment", "Progress", "Complete"] },
        adminApprove: true
      });
      if (!Idea) {
        return `not found idea`
      }
      console.log(Idea.length)
      return Idea;
    },
  },
  Mutation: {
    addBlog: async (_, { input }) => {
      console.log(input);
      return await blogmodel.create(input);
    },
    editBlog: async (_, { id, input }) => {
      return await blogmodel.findByIdAndUpdate(id, input, { new: true });
    },
    deleteBlog: async (_, { id }) => {
      await blogmodel.findByIdAndDelete(id);
      return `Blog with id deleted successfully`;
    },
    addIdea: async (_, { input }) => {
      console.log(input);
      const data = await ideeamodel.create(input);
      console.log(data);
      return data;
    },
    editIdea: async (_, { id, input }) => {
      console.log(input)
      const updatedIdea = await ideeamodel.findByIdAndUpdate(id, input, { new: true });
      return updatedIdea;
    },
    deleteIdea: async (_, { id }) => {
      await ideeamodel.findByIdAndDelete(id);
      if(!id){
        return `no `
      }
      return `Idea with id ${id} deleted successfully`;
    },
    ideaVote: async (_,{id, userId}) => {
      const idea = await ideeamodel.findOne({
        _id: id,
        userIds: userId,
      });
      if (idea) {
        return  "User has already voted!" 
      }
      console.log("idea",idea,id);
      const updatedIdea = await ideeamodel.findByIdAndUpdate(
        id,
        {
          $push: { userIds: userId },
          $inc: { vote: +1 },
        },
        { new: true }
      );
      console.log(updatedIdea);
      return `vote added sucessfully`
    }
  }
}
// const data =await BlogsScema.find();
// console.log(data);
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await db;
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(` Server ready at ${url}`);
