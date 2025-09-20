

import express from 'express';
import { ApolloServer } from 'apollo-server-express';
// import { graphqlUploadExpress } from 'graphql-upload';
import fs from 'fs';
import path from 'path';
import GraphQLUpload  from 'graphql-upload/GraphQLUpload.mjs';
import blogmodel from "./model/Blog.model.js";
// import express from "express"
import ideeamodel from './model/Idea.model.js';
import reactionmodel from './model/Reaction.model.js';
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs"
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import { db } from './db.js';
import cookieParser from "cookie-parser";


const typeDefs = `#graphql
  scalar Upload

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
    thumbnail: String
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

  input BlogInput {
    title:String!
    description:String!
    thumbnail: String!
  }

  input AddIdeaInput {
    title: String!
    description: String!
    reactions: [String]!
    thumbnail: Upload!     
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
    addIdea(input: AddIdeaInput!): Idea!
    editIdea(id: ID!, input: AddIdeaInput!): Idea!
    deleteIdea(id: ID!): String!
    ideaVote(id:ID!): String
  }
`;

const resolvers = {
  Upload: GraphQLUpload,

  Query: {
    reactions: async () => {
      return await reactionmodel.find();
    },
    blogs: async () => {
      const Blogs = await blogmodel.find();
      return Blogs || [];
    },
    blogById: async (_, { id }) => {
      const data = await blogmodel.findById(id);
      return data || { message: "data is not found" };
    },
    ideas: async (_, ) => {
  const filter = {
    adminApprove: true,
  };

  // if (status) {
  //   filter.status = status;
  // }

  // if (tag) {
  //   filter.tag = tag;  // Assuming your Idea model has a 'tag' field
  // }

  // if (reaction) {
  //   filter.reactions = { $in: [reaction] };
  // }

  const ideas = await ideeamodel.find(filter);
  if (!ideas || ideas.length === 0) return [];

  const statusColorMap = {
    Indevelopment: 'yellow',
    Progress: 'blue',
    Complete: 'green',
  };
  // return ideas.map((idea) => ({
  //   ...idea._doc,
  //   color: statusColorMap[idea.status],
  // }));
  return ideas
},

  },

  Mutation: {
    addBlog: async (_, { input }) => {
      return await blogmodel.create(input);
    },

    editBlog: async (_, { id, input }) => {
      return await blogmodel.findByIdAndUpdate(id, input, { new: true });
    },

    deleteBlog: async (_, { id }) => {
      await blogmodel.findByIdAndDelete(id);
      return `Blog with id ${id} deleted successfully`;
    },

    addIdea: async (_, { input }) => {
      const { title, description, reactions, thumbnail } = input;

      // Upload file to /uploads
      const { createReadStream, filename } = await thumbnail;

      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

      const filePath = path.join(uploadDir, filename);
      await new Promise((resolve, reject) =>
        createReadStream()
          .pipe(fs.createWriteStream(filePath))
          .on('finish', resolve)
          .on('error', reject)
      );

      const thumbnailUrl = `uploads/${filename}`;

      const newIdea = await ideeamodel.create({
        title,
        description,
        reactions,
        thumbnail: thumbnailUrl,
        status: 'Indevelopment',
        adminApprove: false,
        userIds: [],
        vote: 0,
      });

      return newIdea;
    },

    editIdea: async (_, { id, input }) => {
      return await ideeamodel.findByIdAndUpdate(id, input, { new: true });
    },

    deleteIdea: async (_, { id }) => {
      await ideeamodel.findByIdAndDelete(id);
      return `Idea with id ${id} deleted successfully`;
    },

  ideaVote: async (_, { id }, { req, res }) => {
  let identifier;

  console.log(req.cookies)
  const anonId = req.cookies?.anonId;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, chchchchc);
      console.log(decoded)
      identifier = decoded.userId;
    } catch (err) {
      console.error("Invalid token:", err.message);
    }
  }
  if (!identifier) {
    if (req.cookies?.anonId) {
      identifier = req.cookies.anonId;
    } else {
      identifier = uuidv4();    
      var token = jwt.sign({ id:identifier}, "chchchchc");
     res.cookie("anonId", token, {
        httpOnly: false,
        sameSite:  "none",
        secure: process.env.NODE_ENV === "production",  
        maxAge: 50 * 50 * 1000,
        path: "/"
      });
        console.log('✅Cookie set attempt - Headers:', res.getHeaders());
    }
  }
  const idea = await ideeamodel.findById(id);
  if (!idea) return "Idea not found";

  const hasVoted = idea.userIds.includes(identifier);
   console.log(hasVoted)
  if (hasVoted) {
    // remove vote
    await ideeamodel.findByIdAndUpdate(
      id,
      { $pull: { userIds: identifier }, $inc: { vote: -1 } },
      { new: true }
    );
    return "Vote removed";
  } else {
    // add vote
    await ideeamodel.findByIdAndUpdate(
      id,
      { $push: { userIds: identifier }, $inc: { vote: 1 } },
      { new: true }
    );
    return "Vote added";
  }
}
  },
};

async function startServer() {
  const app = express();
   app.use(
    cors({
      origin: "http://192.168.43.151:3000", // your React app URL
      credentials: true,               // allow cookies
    })
  );
    app.use(cookieParser());

  // File upload middleware
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }));

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context:({req,res})=>({req,res})
  });

  await apolloServer.start();

  // Apollo integration with Express
  apolloServer.applyMiddleware({ app, path: '/graphql',cors:false });

  app.listen(4000, () => {
    console.log(`🚀 Server running at http://localhost:4000/graphql`);
  });
}

startServer();

