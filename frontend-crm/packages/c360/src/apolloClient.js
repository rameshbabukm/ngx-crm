import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
    uri: 'http://localhost:8080/graphql/c360',
    cache: new InMemoryCache()
});

export default client;
