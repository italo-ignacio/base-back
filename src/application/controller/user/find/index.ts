import { DataSource } from '@infra/database';
import {
  errorLogger,
  getGenericFilter,
  getPagination,
  messageErrorResponse,
  ok
} from '@main/utils';
import { userFindParams } from '@data/search';
import { userListQueryFields } from '@data/validation';
import type { Controller } from '@application/protocols';
import type { Request, Response } from 'express';
import type { userFields, userQueryFields } from '@data/validation';

/**
 * @typedef {object} UserPayload
 * @property {array<User>} content
 * @property {number} totalElements
 * @property {number} totalPages
 */

/**
 * @typedef {object} FindUserResponse
 * @property {Messages} message
 * @property {string} status
 * @property {UserPayload} payload
 */

/**
 * GET /user
 * @summary Find Users
 * @tags User
 * @security BearerAuth
 * @param {string} name.query
 * @param {string} email.query
 * @param {string} startDate.query (ISO 8601 format).
 * @param {string} endDate.query (ISO 8601 format).
 * @param {integer} page.query
 * @param {integer} limit.query
 * @param {string} orderBy.query - enum:name,email,createdAt,updatedAt
 * @param {string} sort.query - enum:asc,desc
 * @return {FindUserResponse} 200 - Successful response - application/json
 * @return {BadRequest} 400 - Bad request response - application/json
 * @return {UnauthorizedRequest} 401 - Unauthorized response - application/json
 */
export const findUserController: Controller =
  () =>
  async ({ query }: Request, response: Response) => {
    try {
      const { skip, take } = getPagination({ query });
      const { orderBy, where } = getGenericFilter<userQueryFields, userFields>({
        list: userListQueryFields,
        query
      });

      const search = await DataSource.user.findMany({
        orderBy,
        select: userFindParams,
        skip,
        take,
        where
      });

      const totalElements = await DataSource.user.count({
        where
      });

      return ok({
        payload: {
          content: search,
          totalElements,
          totalPages: Math.ceil(totalElements / take)
        },
        response
      });
    } catch (error) {
      errorLogger(error);

      return messageErrorResponse({ error, response });
    }
  };
