import { createClient } from 'graphql-ws';
import WebSocket from 'ws';

const accessToken = 'token';

const client = createClient({
  url: 'ws://localhost:3000/graphql',
  webSocketImpl: WebSocket,
  connectionParams: {
    authorization: `Bearer ${accessToken}`,
  },
});

console.log('Connecting and subscribing to notificationCreated...');

const unsubscribe = client.subscribe(
  {
    query: `
      subscription {
        notificationCreated {
          id
          message
          createdAt
          status
        }
      }
    `,
  },
  {
    next: (data) => {
      console.log('Received notification:', JSON.stringify(data, null, 2));
    },
    error: (err) => console.error('Subscription error:', err),
    complete: () => console.log('Subscription complete'),
  },
);

process.on('SIGINT', () => {
  console.log('Unsubscribing...');
  unsubscribe();
  process.exit(0);
});
