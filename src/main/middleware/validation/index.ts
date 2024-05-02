import { DataSource } from '@infra/database';
import { env } from '@main/config/env';
import { errorLogger, removeBearer, unauthorized } from '@main/utils';
import { verify } from 'jsonwebtoken';
import type { Controller } from '@application/protocols';
import type { NextFunction, Request, Response } from 'express';
import type { tokenInput } from '@domain/token';

export const validateTokenMiddleware: Controller =
  // eslint-disable-next-line consistent-return
  () => async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { authorization } = request.headers;

      if (typeof authorization === 'undefined') return unauthorized({ response });

      const accessToken = removeBearer(authorization);

      if (accessToken === null) return unauthorized({ response });

      const { SECRET } = env.JWT;
      const { user } = verify(accessToken, SECRET) as { user: tokenInput };

      if (
        typeof user.id === 'undefined' ||
        typeof user.name === 'undefined' ||
        typeof user.email === 'undefined'
      )
        return unauthorized({ response });

      const account = await DataSource.user.findFirst({
        where: {
          AND: {
            ...user
          }
        }
      });

      if (account === null) return unauthorized({ response });

      Object.assign(request, { user });
      next();
    } catch (error) {
      errorLogger(error);

      return unauthorized({ response });
    }
  };
