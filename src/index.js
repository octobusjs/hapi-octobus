import Joi from 'joi';
import { MessageBus, Message } from 'octobus.js';
import pkg from '../package.json';
import pluginOptionsSchema from './schemas/pluginOptions';

const internals = {
  handlers: {},
  replies: {},
};

export function register(server, options, next) { // eslint-disable-line
  const pluginOptions = Joi.attempt(options, pluginOptionsSchema);
  const messageBus = pluginOptions.messageBus || new MessageBus();

  server.expose('messageBus', messageBus);

  server.decorate('server', 'messageBus', messageBus);

  server.decorate('request', 'messageBus', messageBus);

  server.handler('send', internals.handlers.send);

  server.method('send', (topic, data = {}) => messageBus.send(topic, data));

  next();
}

register.attributes = {
  pkg,
  dependencies: [],
};

internals.replies.send = function send(topic, data = {}) {
  const { request, response } = this;
  const { messageBus } = request;

  return messageBus.send(new Message({ topic, data }))
    .then(response)
    .catch(response);
};

internals.handlers.send = (route, options) => (request, reply) => {
  let topic;
  let data;
  const { messageBus } = request;

  if (typeof options === 'string') {
    topic = options;
    data = {
      ...request.params,
      ...request.query,
      ...request.payload,
    };
  } else {
    topic = options.topic;
    data = options.getData(request);
  }

  return reply(messageBus.send(new Message({ topic, data })));
};
