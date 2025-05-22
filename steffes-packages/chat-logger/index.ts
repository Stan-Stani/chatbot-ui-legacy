import { Container, ContainerResponse, CosmosClient } from '@azure/cosmos';

export class ChatLogger {
  containerResponsePromise: Promise<ContainerResponse>;
  constructor() {
    const promiseAndResolvers = (Promise as any).withResolvers();
    this.containerResponsePromise = promiseAndResolvers.promise as any;
    (async () => {
      const endpoint = process.env['COSMOS_ENDPOINT'];
      const key = process.env['COSMOS_KEY'];

      try {
        const client = new CosmosClient({ endpoint, key });

        const { database } = await client.databases.createIfNotExists({
          id: 'dev-2025-04-29',
        });

        database.containers
          .createIfNotExists({
            id: 'Chatbot',
          })
          .then((containerResponse) => {
            promiseAndResolvers.resolve(containerResponse);
          })
          .catch((error) => {
            promiseAndResolvers.reject(error);
          });
      } catch (error) {
        console.error(error);
      }
    })();
  }
}
