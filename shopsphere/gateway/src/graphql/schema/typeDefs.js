export const typeDefs = `
  type Category {
    id: Int!
    name: String!
  }

  type Product {
    id: Int!
    name: String!
    price: Float!
    inStock: Boolean!
    brand: String!
    categoryId: Int!

    # Advanced GraphQL: field-level resolvers
    category: Category
    finalPrice: Float!
  }

  input ProductInput {
    name: String!
    price: Float!
    categoryId: Int!
    brand: String!
    inStock: Boolean!
  }

  type Query {
    products: [Product!]!
    product(id: Int!): Product
  }

  type Mutation {
    createProduct(input: ProductInput!): Product!
    updateProduct(id: Int!, input: ProductInput!): Product!
    deleteProduct(id: Int!): Boolean!
  }
`;
