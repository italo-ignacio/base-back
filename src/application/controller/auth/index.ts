import { DataSource } from '@infra/database';
import { ValidationError } from 'yup';
import { authenticateSchema } from '@data/validation';
import {
  badRequest,
  errorLogger,
  generateToken,
  messageErrorResponse,
  ok,
  validationErrorResponse
} from '@main/utils';
import { compare } from 'bcrypt';
import { messages } from '@domain/helpers';
import { userFindParams } from '@data/search';
import type { Controller } from '@application/protocols';
import type { Request, Response } from 'express';

interface Body {
  email: string;
  password: string;
}

/**
 * @typedef {object} LoginProps
 * @property {string} email.required
 * @property {string} password.required
 */

/**
 * @typedef {object} LoginResponse
 * @property {string} accessToken.required
 * @property {User} user.required
 */

/**
 * POST /login
 * @summary Login
 * @tags Auth
 * @param {LoginProps} request.body.required - application/json
 * @return {LoginResponse} 200 - Successful response - application/json
 * @return {BadRequest} 400 - Bad request response - application/json
 */
export const authenticateUserController: Controller =
  () => async (request: Request, response: Response) => {
    try {
      await authenticateSchema.validate(request, { abortEarly: false });

      const { email, password } = request.body as Body;

      const user = await DataSource.user.findUnique({
        select: { ...userFindParams, password: true },
        where: { email }
      });

      if (user === null)
        return badRequest({
          message: messages.auth.notFound,
          response
        });

      const passwordIsCorrect = await compare(password, user.password);

      if (!passwordIsCorrect)
        return badRequest({
          message: messages.auth.notFound,
          response
        });

      const { accessToken } = generateToken({
        email: user.email,
        id: user.id,
        name: user.name
      });

      return ok({
        payload: {
          accessToken,
          user: {
            createdAt: user.createdAt,
            email: user.email,
            id: user.id,
            name: user.name,
            updatedAt: user.updatedAt
          }
        },
        response
      });
    } catch (error) {
      errorLogger(error);

      if (error instanceof ValidationError) return validationErrorResponse({ error, response });

      return messageErrorResponse({ error, response });
    }
  };
