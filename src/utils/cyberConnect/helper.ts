import { BasicUserInfo } from './types';

export const formatAddress = (address: string) => {
  const len = address.length;
  return address.substr(0, 5) + '...' + address.substring(len - 4, len);
};

export const isValidAddr = (address: string) => {
  const re = /^0x[a-fA-F0-9]{40}$/;
  return address.match(re);
};

export const removeDuplicate = (arr: BasicUserInfo[]) => {
  return arr.filter(
    (user, index, self) =>
      index === self.findIndex((t) => t.address === user.address)
  );
};
