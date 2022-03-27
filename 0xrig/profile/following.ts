import { gql } from '@apollo/client/core';
import { apolloClient } from '../../api/apollo-client';
import { getAddressFromSigner } from '../../api/ethers.service';
import { PROFILE_ID, W } from '../../api/config';
import { prettyJSON, rig0x } from '../../api/helpers';

const GET_FOLLOWING = `
  query($request: FollowingRequest!) {
    following(request: $request) { 
			    items {
            profile {
              id
              name
              bio
              location
              website
              twitterUrl
              handle
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
                    width
                    height
                    mimeType
                  }
                  medium {
                    url
                    width
                    height
                    mimeType
                  }
                  small {
                    url
                    width
                    height
                    mimeType
                  }
                }
              }
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
                    width
                    height
                    mimeType
                  }
                  small {
                    width
                    url
                    height
                    mimeType
                  }
                  medium {
                    url
                    width
                    height
                    mimeType
                  }
                }
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
                      name
                      symbol
                      decimals
                      address
                    }
                    value
                  }
                  recipient
                }
            }
          }
          totalAmountOfTimesFollowing
        }
       pageInfo {
          prev
          next
          totalCount
       }
		}
  }
`;

const followingRequest = (walletAddress: string) => {
  return apolloClient.query({
    query: gql(GET_FOLLOWING),
    variables: {
      request: {
        address: walletAddress,
        limit: W,
      },
    },
  });
};

export const following = async () => {
  const address = getAddressFromSigner();
  console.log('following: address', address);

  const result = await followingRequest(address);
  prettyJSON('following: result', result.data);
  
  rig0x('0xRig:result', {
        profile: PROFILE_ID,
        limit: W,
        data: result.data
  });
  return result.data;
};

(async () => {
  await following();
})();
