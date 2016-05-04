import { createEventDispatcher } from 'octobus.js';
import pkg from '../package.json';

const internals = {
  handlers: {},
  replies: {},
};

export function register(server, options, next) {
  const eventDispatcher = createEventDispatcher(options);

  server.expose('eventDispatcher', eventDispatcher);

  server.decorate('server', 'eventDispatcher', eventDispatcher);
  server.decorate('request', 'eventDispatcher', eventDispatcher);
  server.decorate('reply', 'dispatch', internals.replies.dispatch);
  server.handler('dispatch', internals.handlers.dispatch);

  next();
}

register.attributes = {
  pkg,
  dependencies: [],
};

internals.replies.dispatch = function dispatch(event, params = {}) {
  const { request, response } = this;
  const { eventDispatcher } = request;

  response(eventDispatcher.dispatch(event, params));
};

internals.handlers.dispatch = (route, options) => (request, reply) => {
  const event = options;

  return reply.dispatch(event, {
    ...request.params,
    ...request.query,
    ...request.payload,
  });
};
