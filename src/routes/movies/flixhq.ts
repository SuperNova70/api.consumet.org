import { FastifyRequest, FastifyReply, FastifyInstance, RegisterOptions } from 'fastify';
import { MOVIES } from '@consumet/extensions';
import { StreamingServers } from '@consumet/extensions/dist/models';

const routes = async (fastify: FastifyInstance, options: RegisterOptions) => {
  const flixhq = new MOVIES.FlixHQ();

  fastify.get('/flixhq', (_, rp) => {
    rp.status(200).send({
      intro:
        "Welcome to the flixhq provider: check out the provider's website @ https://flixhq.to/",
      routes: ['/:movie', '/info', '/watch/:episodeId'],
      documentation: 'https://docs.consumet.org/#tag/flixhq',
    });
  });

  fastify.get('/flixhq/:movie', async (request: FastifyRequest, reply: FastifyReply) => {
    const queries: { movie: string; page: number } = { movie: '', page: 1 };

    queries.movie = decodeURIComponent(
      (request.params as { movie: string; page: number }).movie
    );

    queries.page = (request.query as { movie: string; page: number }).page;

    const res = await flixhq.search(queries.movie, queries.page);

    reply.status(200).send(res);
  });

  fastify.get('/flixhq/info', async (request: FastifyRequest, reply: FastifyReply) => {
    const id = decodeURIComponent((request.query as { id: string }).id);

    if (!id) reply.status(400).send({ message: 'Missing id query' });

    try {
      const res = await flixhq
        .fetchMediaInfo(id)
        .catch((err) => reply.status(404).send({ message: err }));

      reply.status(200).send(res);
    } catch (err) {
      reply.status(500).send({
        message:
          'Something went wrong. Please try again later. or contact the developers.',
      });
    }
  });

  fastify.get(
    '/flixhq/watch/:episodeId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const episodeId = (request.params as { episodeId: string }).episodeId;
      const mediaId = (request.query as { mediaId: string }).mediaId;
      const server = (request.query as { server: StreamingServers }).server;

      if (!mediaId) reply.status(400).send({ message: 'Missing mediaId query' });

      if (server && !Object.values(StreamingServers).includes(server)) {
        reply.status(400).send({ message: 'Invalid server query' });
      }

      try {
        const res = await flixhq
          .fetchEpisodeSources(episodeId, mediaId, server)
          .catch((err) => reply.status(404).send({ message: err }));

        reply.status(200).send(res);
      } catch (err) {
        reply
          .status(500)
          .send({ message: 'Something went wrong. Please try again later.' });
      }
    }
  );
};

export default routes;
