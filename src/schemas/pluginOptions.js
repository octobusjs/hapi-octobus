import Joi from 'joi';
import { Transport, MessageBus } from 'octobus.js';

export default {
  messageBus: Joi.object().type(MessageBus),
  transport: Joi.object().type(Transport).default(new Transport()),
};
