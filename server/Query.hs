import { gql } from '@apollo/client';

export const GET_ALL_BLOGS = gql`
  query GetAllBlogs {
    blogs {
      id
      title
      description
      thumbnail
    }
  }
`;
export const GET_BLOG_BY_ID = gql`
  query GetBlogById($id: ID!) {
    blogById(id: $id) {
      id
      title
      description
      thumbnail
    }
  }
`;
export const GET_ALL_IDEAS = gql`
  query GetAllIdeas {
    ideas {
      id
      title
      description
      status
      adminApprove
      userIds
      vote
    }
  }
`;
export const GET_ALL_REACTIONS = gql`
  query GetAllReactions {
    reactions {
     id
    data
    }
  }
`;

export const ADD_BLOG = gql`
  mutation AddBlog($input: BlogInput!) {
    addBlog(input: $input) {
      title
      description
      thumbnail
    }
  }
`;

export const EDIT_BLOG = gql`
  mutation EditBlog($id: ID!, $input: BlogInput!) {
    editBlog(id: $id, input: $input) {
      id
      title
      description
      thumbnail
    }
  }
`;

export const DELETE_BLOG = gql`
  mutation DeleteBlog($id: ID!) {
    deleteBlog(id: $id)
  }
`;

export const ADD_IDEA = gql`
  mutation AddIdea($input: AddIdeaInput!) {
    addIdea(input: $input) {
      title
      description
      reactions
    }
  }
`;

export const EDIT_IDEA = gql`
  mutation EditIdea($id: ID!, $input: AddIdeaInput!) {
    editIdea(id: $id, input: $input) {
      id
      title
      description
      status
      adminApprove
      userIds
      vote
    }
  }
`;
export const DELETE_IDEA = gql`
  mutation DeleteIdea($id: ID!) {
    deleteIdea(id: $id)
  }
`;
export const IDEA_VOTE = gql`
  mutation IDEA_VOTE($id: ID!, $userId: ID!) {
    ideaVote(id: $id, userId: $usserId)
  }
`;
