import {
  RankingListInfoArgs,
  LikeListInfoArgs,
  VoteListInfoArgs,
  FollowListInfoArgs,
  SearchUserInfoArgs,
  RankingListResp,
  LikeListInfoResp,
  FollowListInfoResp,
  SearchUserInfoResp,
} from "./types";

const endPoint = "https://api.cybertino.io/connect/";

export const likeListInfoSchema = ({
  address,
  namespace,
  network,
  likeFirst,
  likeAfter,
  likedFirst,
  likedAfter,
}: LikeListInfoArgs) => {
  return {
    operationName: "likeListInfo",
    query: `query likeListInfo($address: String!, $namespace: String, $network: Network, $likeFirst: Int, $likeAfter: String, $likedFirst: Int, $likedAfter: String) {
      identity(address: $address, network: $network) {
        like: followingCount(namespace: $namespace, type: LIKE)
        liked: followerCount(namespace: $namespace, type: LIKE)
        likes: followings(namespace: $namespace, first: $likeFirst, after: $likeAfter, type: LIKE) {
          pageInfo {
            endCursor
            hasNextPage
          }
          list {
            address
            ens
            avatar
            namespace
            alias
          }
        }
        likeds: followers(namespace: $namespace, first: $likedFirst, after: $likedAfter, type: LIKE) {
          pageInfo {
            endCursor
            hasNextPage
          }
          list {
            address
            ens
            avatar
            namespace
            alias
          }
        }
      }
    },`,
    variables: {
      address,
      namespace,
      network,
      likeFirst,
      likeAfter,
      likedFirst,
      likedAfter,
    },
  };
};

export const voteListInfoSchema = ({
  address,
  namespace,
  network,
  voteFirst,
  voteAfter,
  votedFirst,
  votedAfter,
}: VoteListInfoArgs) => {
  return {
    operationName: "voteListInfo",
    query: `query voteListInfo($address: String!, $namespace: String, $network: Network, $voteFirst: Int, $voteAfter: String, $votedFirst: Int, $votedAfter: String) {
      identity(address: $address, network: $network) {
        vote: followingCount(namespace: $namespace, type: VOTE)
        voted: followerCount(namespace: $namespace, type: VOTE)
        votes: followings(namespace: $namespace, first: $voteFirst, after: $voteAfter, type: VOTE) {
          pageInfo {
            endCursor
            hasNextPage
          }
          list {
            address
            ens
            avatar
            namespace
            alias
          }
        }
        voteds: followers(namespace: $namespace, first: $votedFirst, after: $votedAfter, type: VOTE) {
          pageInfo {
            endCursor
            hasNextPage
          }
          list {
            address
            ens
            avatar
            namespace
            alias
          }
        }
      }
    },`,
    variables: {
      address,
      namespace,
      network,
      voteFirst,
      voteAfter,
      votedFirst,
      votedAfter,
    },
  };
};

export const followListInfoSchema = ({
  address,
  namespace,
  network,
  followingFirst,
  followingAfter,
  followerFirst,
  followerAfter,
}: FollowListInfoArgs) => {
  return {
    operationName: "followListInfo",
    query: `query followListInfo($address: String!, $namespace: String, $network: Network, $followingFirst: Int, $followingAfter: String, $followerFirst: Int, $followerAfter: String) {
      identity(address: $address, network: $network) {
        followingCount(namespace: $namespace)
        followerCount(namespace: $namespace)
        like: followingCount(namespace: $namespace, type: LIKE)
        liked: followerCount(namespace: $namespace, type: LIKE)
        report: followingCount(namespace: $namespace, type: REPORT)
        reported: followerCount(namespace: $namespace, type: REPORT)
        followings(namespace: $namespace, first: $followingFirst, after: $followingAfter) {
          pageInfo {
            endCursor
            hasNextPage
          }
          list {
            address
            ens
            avatar
            namespace
            alias
          }
        }
        followers(namespace: $namespace, first: $followerFirst, after: $followerAfter) {
          pageInfo {
            endCursor
            hasNextPage
          }
          list {
            address
            ens
            avatar
            namespace
            alias
          }
        }
      }
    }`,
    variables: {
      address,
      namespace,
      network,
      followingFirst,
      followingAfter,
      followerFirst,
      followerAfter,
    },
  };
};

export const searchUserInfoSchema = ({
  fromAddr,
  toAddr,
  network,
}: SearchUserInfoArgs) => {
  return {
    operationName: "searchUserInfo",
    query: `query searchUserInfo($fromAddr: String!, $toAddr: String!, $network: Network) {
      identity(address: $toAddr, network: $network) {
        address
        ens
        avatar
      }
      connections(fromAddr: $fromAddr, toAddrList: [$toAddr], network: $network) {
        type
        followStatus {
          isFollowed
          isFollowing
        }
      }
    }`,
    variables: {
      fromAddr,
      toAddr,
      network,
    },
  };
};

export const rankingInfoSchema = ({
  namespace,
  network,
  type,
}: RankingListInfoArgs) => {
  return {
    operationName: 'rankingsInfo',
    query: `query rankingsInfo($namespace: [String!], $network: Network, $type: ConnectionType){
      rankings(first: 10, namespaces: $namespace, network: $network, type: $type) {
        pageInfo {
          hasNextPage
          endCursor
        }
        list {
          address
          followerCount(type:FOLLOW)
          followingCount(type:FOLLOW)
          avatar
        }
      }
    }`,
    variables: {
      namespace,
      network,
      type,
    },
  };
};

export const querySchemas = {
  likeListInfo: likeListInfoSchema,
  voteListInfo: voteListInfoSchema,
  followListInfo: followListInfoSchema,
  searchUserInfo: searchUserInfoSchema,
  rankingsInfo: rankingInfoSchema,
};

export const request = async (url = "", data = {}) => {
  // Default options are marked with *
  const response = await window.fetch(url, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
    },
    referrerPolicy: "no-referrer",
    body: JSON.stringify(data),
  });

  return response.json();
};

export const handleQuery = (
  data: {
    query: string;
    variables: object;
    operationName: string;
  },
  url: string
) => {
  return request(url, data);
};

export const rankingListInfoQuery = async ({
  namespace,
  network,
}: RankingListInfoArgs) => {
  const schema = querySchemas["rankingsInfo"]({
    namespace,
    network,
  });
  const resp = await handleQuery(schema, endPoint);

  return (resp?.data?.rankings as RankingListResp) || null;
};

export const voteListInfoQuery = async ({
  address,
  namespace,
  network,
  voteFirst,
  voteAfter,
  votedFirst,
  votedAfter,
  type,
}: VoteListInfoArgs) => {
  const schema = querySchemas["voteListInfo"]({
    address,
    namespace,
    network,
    voteFirst,
    voteAfter,
    votedFirst,
    votedAfter,
    type,
  });
  const resp = await handleQuery(schema, endPoint);

  return (resp?.data?.identity as LikeListInfoResp) || null;
};

export const likeListInfoQuery = async ({
  address,
  namespace,
  network,
  likeFirst,
  likeAfter,
  likedFirst,
  likedAfter,
  type,
}: LikeListInfoArgs) => {
  const schema = querySchemas["likeListInfo"]({
    address,
    namespace,
    network,
    likeFirst,
    likeAfter,
    likedFirst,
    likedAfter,
    type,
  });
  const resp = await handleQuery(schema, endPoint);

  return (resp?.data?.identity as LikeListInfoResp) || null;
};

export const followListInfoQuery = async ({
  address,
  namespace,
  network,
  followingFirst,
  followingAfter,
  followerFirst,
  followerAfter,
}: FollowListInfoArgs) => {
  const schema = querySchemas["followListInfo"]({
    address,
    namespace,
    network,
    followingFirst,
    followingAfter,
    followerFirst,
    followerAfter,
  });
  const resp = await handleQuery(schema, endPoint);

  return (resp?.data?.identity as FollowListInfoResp) || null;
};

export const searchUserInfoQuery = async ({
  fromAddr,
  toAddr,
  network,
}: SearchUserInfoArgs) => {
  const schema = querySchemas["searchUserInfo"]({
    fromAddr,
    toAddr,
    network,
  });
  const resp = await handleQuery(schema, endPoint);

  return (resp?.data as SearchUserInfoResp) || null;
};