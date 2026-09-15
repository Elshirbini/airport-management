import { createClient } from 'graphql-ws';
import WebSocket from 'ws';

const accessToken = 'token';
const flightId = 'flight';

const client = createClient({
  url: 'ws://localhost:3000/graphql',
  webSocketImpl: WebSocket,
  connectionParams: {
    authorization: `Bearer ${accessToken}`,
  },
});

console.log(
  `Connecting and subscribing to flightStatusUpdated for flightId: ${flightId}...`,
);

const unsubscribe = client.subscribe(
  {
    query: `
      subscription FlightStatusUpdated($flightId: ID!) {
        FLIGHT_STATUS_UPDATED(flightId: $flightId) {
          id
          flightNumber
          status
          updatedAt
        }
      }
    `,
    variables: { flightId },
  },
  {
    next: (data) => {
      console.log('Received flight update:', JSON.stringify(data, null, 2));
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
