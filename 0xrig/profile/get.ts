import { W } from '../../api/config';
import { gql } from '@apollo/client/core';
import { apolloClient } from '../../api/apollo-client';
import { login } from '../../api/authentication/login';
import { argsBespokeInit } from '../../api/config';
import { getAddressFromSigner } from '../../api/ethers.service';
import { rig0x, prettyJSON } from '../../api/helpers';

const GET_PROFILES = `
  query($request: ProfileQueryRequest!) {
    profiles(request: $request) {
      items {
        id
        name
        bio
        location
        website
        twitterUrl
        picture {
          ... on NftImage {
            contractAddress
            tokenId
            uri
            verified
          }
          ... on MediaSet {
            original {
              url
              mimeType
            }
          }
          __typename
        }
        handle
        coverPicture {
          ... on NftImage {
            contractAddress
            tokenId
            uri
            verified
          }
          ... on MediaSet {
            original {
              url
              mimeType
            }
          }
          __typename
        }
        ownedBy
        depatcher {
          address
          canUseRelay
        }
        stats {
          totalFollowers
          totalFollowing
          totalPosts
          totalComments
          totalMirrors
          totalPublications
          totalCollects
        }
        followModule {
          ... on FeeFollowModuleSettings {
            type
            amount {
              asset {
                symbol
                name
                decimals
                address
              }
              value
            }
            recipient
          }
          __typename
        }
      }
      pageInfo {
        prev
        next
        totalCount
      }
    }
  }
`;

export interface ProfilesRequest {
  profileIds?: string[];
  ownedBy?: string;
  handles?: string[];
  whoMirroredPublicationId?: string;
}

const getProfilesRequest = (request: ProfilesRequest) => {
  return apolloClient.query({
    query: gql(GET_PROFILES),
    variables: {
      request,
    },
  });
};

export const profiles = async (request?: ProfilesRequest) => {
  const address = getAddressFromSigner();
  console.log('profiles: address', address);

  await login(address);

  if (!request) {
    if(W !== 'self'){
        var w = JSON.parse(W!);
        request = w;
    }else{
        request = { ownedBy: address };
    }
  }
  /** */
  // only showing one example to query but you can see from request
  // above you can query many
  const profilesFromProfileIds = await getProfilesRequest(request!);

  // console.log(JSON.parse(profilesFromProfileIds.data))
  rig0x('0xRig:result', profilesFromProfileIds.data);
  // console.log(result)
  // prettyJSON('', profilesFromProfileIds.data);

  return profilesFromProfileIds.data;
  /** */
};

(async () => {
  if (argsBespokeInit()) {
    await profiles();
  }
})();
