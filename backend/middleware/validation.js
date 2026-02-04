import Joi from 'joi';
import { AppError } from './errorHandler.js';

// Validation schemas
export const authSchemas = {
  register: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(255).required(),
    password_confirmation: Joi.string().valid(Joi.ref('password')).required(),
  }).with('password', 'password_confirmation'),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
};

export const productSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    price: Joi.number().positive().required(),
    quantity: Joi.number().integer().min(0).default(0),
    description: Joi.string().max(500).optional(),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    price: Joi.number().positive().optional(),
    quantity: Joi.number().integer().min(0).optional(),
    description: Joi.string().max(500).optional(),
  }).min(1),
};

export const transactionSchemas = {
  create: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          product_id: Joi.number().integer().required(),
          quantity: Joi.number().integer().min(1).required(),
          price: Joi.number().positive().required(),
        })
      )
      .min(1)
      .required(),
    payment_method: Joi.string().valid('cash', 'card', 'transfer').required(),
    notes: Joi.string().max(500).optional(),
  }),
};

// Validation middleware
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return next(new AppError('Validation error', 400, 'VALIDATION_ERROR'));
  }

  req.validatedData = value;
  next();
};
