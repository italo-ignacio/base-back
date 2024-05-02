interface GetPageAndLimitInput<QueryType extends string, ModelType extends string> {
  query: {
    [key in QueryType]?: string;
  } & {
    orderBy?: QueryType;
    sort?: 'asc' | 'desc';
    distinct?: ModelType;
  };
  list: QueryType[];
}

interface GetPageAndLimitOutput {
  orderBy: object;
  where: object;
}

const isObjectEmpty = (obj: object): boolean => Object.keys(obj).length === 0;

const getDate = (item: unknown): Date | null => {
  const startDate = new Date(item as string);

  return isNaN(startDate.getTime()) ? null : startDate;
};

const hasOrder = (query: { orderBy?: string; sort?: 'asc' | 'desc' }): boolean =>
  typeof query.orderBy !== 'undefined' &&
  typeof query.sort !== 'undefined' &&
  (query.sort === 'asc' || query.sort === 'desc');

export const getGenericFilter = <QueryType extends string, ModelType extends string>({
  query,
  list
}: GetPageAndLimitInput<QueryType, ModelType>): GetPageAndLimitOutput => {
  const orderBy = {};
  const where: object[] = [];

  for (const item of list) {
    if (hasOrder(query))
      if (item === 'startDate' && query.orderBy === 'createdAt')
        Object.assign(orderBy, {
          [query.orderBy]: query.sort
        });
      else if (item === query.orderBy)
        Object.assign(orderBy, {
          [query.orderBy]: query.sort
        });

    if (typeof query[item] !== 'undefined')
      if (item === 'startDate') {
        const date = getDate(query[item]);

        if (date !== null)
          where.push({
            createdAt: {
              gte: date
            }
          });
      } else if (item === 'endDate') {
        const date = getDate(query[item]);

        if (date !== null)
          where.push({
            createdAt: {
              lte: date
            }
          });
      } else if (item.endsWith('Enum'))
        where.push({
          [item.replace('Enum', '')]: {
            equals: query[item]
          }
        });
      else if (item.endsWith('Id'))
        where.push({
          [item]: {
            equals: query[item] === 'null' ? null : Number(query[item])
          }
        });
      else
        where.push({
          [item]: {
            contains: query[item],
            mode: 'insensitive'
          }
        });
  }

  if (isObjectEmpty(orderBy)) Object.assign(orderBy, { id: 'desc' });

  return {
    orderBy,
    where:
      where.length > 0
        ? {
            OR: where
          }
        : {}
  };
};
