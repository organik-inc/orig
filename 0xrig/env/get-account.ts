import { PK, PROFILE_ID } from '../../api/config';
import { getAddressFromSigner } from '../../api/ethers.service';
import { getAuthenticationToken } from '../../api/state';
import { rig0x, prettyJSON } from '../../api/helpers';

export const run = async (address = getAddressFromSigner()) => {
  if (getAuthenticationToken()) {
    console.log('login: already logged in');
    return;
  }
  rig0x('0xRig:result', {address, profile: PROFILE_ID});
  return {address, profile: PROFILE_ID};
};

(async () => {
    await run();
})();
