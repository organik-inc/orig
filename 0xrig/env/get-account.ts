import { PK } from '../../api/config';
import { getAddressFromSigner } from '../../api/ethers.service';
import { getAuthenticationToken } from '../../api/state';
import { rig0x, prettyJSON } from '../../api/helpers';

export const run = async (address = getAddressFromSigner()) => {
  if (getAuthenticationToken()) {
    console.log('login: already logged in');
    return;
  }
  rig0x('0xRig:result', {address});
  return {address, PK};
};

(async () => {
    await run();
})();
