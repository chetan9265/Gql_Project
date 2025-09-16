
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { GraphQLUpload } from 'graphql-upload';
import fs from 'fs';
import path from 'path';
import blogmodel from "./model/Blog.model.js";
import ideeamodel from './model/Idea.model.js';
import reactionmodel from './model/Reaction.model.js';
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
    ideas: async () => {
      const ideas = await ideeamodel.find({
        status: { $in: ["Indevelopment", "Progress", "Complete"] },
        adminApprove: true,
      });

      if (!ideas || ideas.length === 0) return [];

      const statusColorMap = {
        Indevelopment: 'yellow',
        Progress: 'blue',
        Complete: 'green',
      };

      const groupedIdeas = { Indevelopment: [], Progress: [], Complete: [] };

      ideas.forEach((idea) => {
        if (groupedIdeas[idea.status]) {
          groupedIdeas[idea.status].push({
            ...idea._doc,
            color: statusColorMap[idea.status],
          });
        }
      });

      return Object.keys(statusColorMap).map((status) => ({
        status,
        color: statusColorMap[status],
        ideas: groupedIdeas[status],
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

const app = express();

app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }));

const server = new ApolloServer({ typeDefs, resolvers });
await server.start();

app.use('/graphql', express.json(), expressMiddleware(server));

app.listen(4000, () => {
  console.log(' Server running at http://localhost:4000/graphql');
});

