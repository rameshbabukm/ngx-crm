import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
    uri: 'http://localhost:8080/graphql/sales',
    cache: new InMemoryCache()
});

export default client;
