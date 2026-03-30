import {User} from './user.model';

export const findUserByEmail = (email: string) => {
  return User.findOne({ email });
};

export const createUser = (data: { email: string; password: string }) => {
  return User.create(data);
};

export const findUserById = (id: string) => {
  return User.findById(id);
};