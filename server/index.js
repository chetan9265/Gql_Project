

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
import { db } from './db.js';

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
    ideaVote(id:ID!,userId:ID!): String
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
    ideas: async (_, { status, tag, reaction }) => {
  const filter = {
    adminApprove: true,
  };

  if (status) {
    filter.status = status;
  }

  if (tag) {
    filter.tag = tag;  // Assuming your Idea model has a 'tag' field
  }

  if (reaction) {
    filter.reactions = { $in: [reaction] };
  }

  const ideas = await ideeamodel.find(filter);

  if (!ideas || ideas.length === 0) return [];

  const statusColorMap = {
    Indevelopment: 'yellow',
    Progress: 'blue',
    Complete: 'green',
  };

  return ideas.map((idea) => ({
    ...idea._doc,
    color: statusColorMap[idea.status],
  }));
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

    ideaVote: async (_, { id, userId }) => {
      const idea = await ideeamodel.findOne({ _id: id, userIds: userId });
      if (idea) return "User has already voted!";

      await ideeamodel.findByIdAndUpdate(
        id,
        { $push: { userIds: userId }, $inc: { vote: 1 } },
        { new: true }
      );

      return "Vote added successfully";
    },
  },
};

async function startServer() {
  const app = express();

  // File upload middleware
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }));

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await apolloServer.start();

  // Apollo integration with Express
  apolloServer.applyMiddleware({ app, path: '/graphql' });

  app.listen(4000, () => {
    console.log(`🚀 Server running at http://localhost:4000/graphql`);
  });
}

startServer();

