import { stringRequired } from '@main/utils';
import { yup } from '@infra/yup';

export const insertUserSchema = yup.object().shape({
  body: yup.object().shape({
    email: stringRequired({
      english: 'email',
      length: 255,
      portuguese: 'e-mail'
    }),
    name: stringRequired({
      english: 'name',
      length: 255,
      portuguese: 'nome'
    }),
    password: stringRequired({
      english: 'password',
      portuguese: 'senha'
    })
  })
});
