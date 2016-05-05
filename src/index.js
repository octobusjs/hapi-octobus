import { createEventDispatcher } from 'octobus.js';
import pkg from '../package.json';

const internals = {
  handlers: {},
  replies: {},
};

export function register(server, options, next) {
  const eventDispatcher = options.eventDispatcher || createEventDispatcher(options);

  server.expose('eventDispatcher', eventDispatcher);

  server.decorate('server', 'eventDispatcher', eventDispatcher);

  server.decorate('request', 'eventDispatcher', eventDispatcher);

  server.handler('dispatch', internals.handlers.dispatch);

  server.method('dispatch', (event, params = {}) => eventDispatcher.dispatch(event, params));

  next();
}

register.attributes = {
  pkg,
  dependencies: [],
};

internals.replies.dispatch = function dispatch(event, params = {}) {
  const { request, response } = this;
  const { eventDispatcher } = request;

  return eventDispatcher.dispatch(event, params)
    .then(response)
    .catch(response);
};

internals.handlers.dispatch = (route, options) => (request, reply) => {
  let event;
  let params;
  const { eventDispatcher } = request;

  if (typeof options === 'string') {
    event = options;
    params = {
      ...request.params,
      ...request.query,
      ...request.payload,
    };
  } else {
    event = options.event;
    params = options.buildParams(request);
  }

  return reply(eventDispatcher.dispatch(event, params));
};
