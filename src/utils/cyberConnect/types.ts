export interface FollowListInfoArgs {
    address: string;
    namespace?: string;
    network?: string;
    alias?: string,
    followingFirst?: number;
    followingAfter?: string;
    followerFirst?: number;
    followerAfter?: string;
    type?: string,
  }
  
  export interface SearchUserInfoArgs {
    fromAddr: string;
    toAddr: string;
    namespace?: string;
    network?: string;
    type?: string,
  }
  
  export interface BasicUserInfo {
    ens: string;
    address: string;
    avatar: string;
  }
  
  export interface FollowListInfo {
    pageInfo: {
      endCursor: string;
      hasNextPage: boolean;
    };
    list: BasicUserInfo[];
  }
  
  export interface FollowListInfoResp {
    followingCount: number;
    followerCount: number;
    followings: FollowListInfo;
    followers: FollowListInfo;
    like?: string,
    liked?: string,
    report?: string,
    reported?: string, 
    type?: ConnectionType,
  }
  
  export interface SearchUserInfoResp {
    connections: {
      followStatus: {
        isFollowing: boolean;
        isFollowed: boolean;
      };
      type: ConnectionType;
    }[];
    identity: {
      ens: string;
      address: string;
      avatar: string;
    };
  }
  
  export enum Network {
    ETH = 'ETH',
    SOLANA = 'SOLANA',
  }