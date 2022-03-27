'use strict'
    const daoAddress = ''; // In case we need a SC to interact with.
    // This Address is only for Polygon's Mumbai Testnet.
    var walletAddress = '';
    var chainNetwork = false;
    var encodeKey = false;
    var lensAddress = '';
    var lensProfile = '';
    var selectedProfile = {empty:true}

    /**
     * LIT PROTOCOL
     */

     async function mintNft() {
        document.getElementById('mintingStatus').innerText = "Minting, please wait for the tx to confirm..."
  
        window.chain = 'mumbai'
  
        const {
          txHash,
          tokenId,
          tokenAddress,
          mintingAddress,
          authSig
        } = await LitJsSdk.mintLIT({ chain: window.chain, quantity: 1 })
        window.tokenId = tokenId
        window.tokenAddress = tokenAddress
        window.authSig = authSig
  
        document.getElementById('mintingStatus').innerText = "Minted!  Tx hash is " + txHash
      }
  
      async function provisionAccess() {
        document.getElementById('provisioningStatus').innerText = "Provisioning, please wait..."
        window.accessControlConditions = [
          {
            contractAddress: LitJsSdk.LIT_CHAINS[window.chain].contractAddress,
            standardContractType: 'ERC1155',
            chain: window.chain,
            method: 'balanceOf',
            parameters: [
              ':userAddress',
              window.tokenId.toString()
            ],
            returnValueTest: {
              comparator: '>',
              value: '0'
            }
          }
        ]
        // generate a random path because you can only provision access to a given path once
        const randomUrlPath = "/" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        window.resourceId = {
          baseUrl: '0xrig.com',
          path: `${randomUrlPath}/${encodeKey}`, // this would normally be your url path, like "/webpage.html" for example
          orgId: "0xrig",
          role: "",
          extraData: ""
        }
        await litNodeClient.saveSigningCondition({
          accessControlConditions: window.accessControlConditions,
          chain: window.chain,
          authSig: window.authSig,
          resourceId: window.resourceId
        })
        document.getElementById('provisioningStatus').innerText = "Provisioned!"
      }
  
      async function requestJwt() {
        document.getElementById('requestingStatus').innerText = "Requesting JWT, please wait..."
  
        window.jwt = await litNodeClient.getSignedToken({
          accessControlConditions: window.accessControlConditions,
          chain: window.chain,
          authSig: window.authSig,
          resourceId: window.resourceId
        })
  
        document.getElementById('requestingStatus').innerText = "JWT Obtained!  It is  " + window.jwt
  
      }
  
      async function verifyJwt(jwt=string) {
        // Override for Server Call.
        console.log('API:LIT Verify JWT:', jwt)
        /** */
        var url = `${window.location.href.split("gitpod.io").shift().replace("https://8000","https://3000")}gitpod.io/verify?jwt=${jwt}`
        $.ajax({
                url: url,
                dataType: 'jsonp',
                success: function(jwtObject){
                    if(+!!jwtObject.data.verified){
                        console.log(jwtObject.data)
                    }else{
                        // Not verified.
                    }
                }
        });
        /** */
      }

    const isHex = (inputString = string) =>{
        var re = /[0-9A-Fa-f]{2}/g;
        return re.test(inputString);
    }

    const minify = (walletAddress = string) => {
        return walletAddress.replace(walletAddress.substring(6, 38), '...')
    }

    const cleanHandle = (handle = string) => {
        return handle.replace(/[^a-zA-Z0-9. ]/g, '').trim().replace(" ", ".")
    }

    const decodeMethod = (method=string) => {
        return (method == 'id') ? 'Profile ID' : method == 'handle' ? 'Username Handle' : 'Address Owner';
    }

    const updateProfile = (event, profile = string) =>{
        event.preventDefault();
        console.log(profile)
        $('#selectLoader').show();
        $('#goBackFromSelectProfile').hide();
        console.log('API:Switch Profile by ID:', profile)
        /** */
        var url = `${window.location.href.split("gitpod.io").shift().replace("https://8000","https://3000")}gitpod.io/setProfile?id=${profile}`
        $.ajax({
                url: url,
                dataType: 'jsonp',
                success: function(profile){
                    if(+!!profile.data.results){
                        $('#selectLoader').hide();
                        $('#goBackFromSelectProfile').show();
                        location.reload();
                    }else{
                        // Try Again. API sometimes glitches.
                        console.log('Server is not responding.')
                        $('#selectLoader').hide();
                        $('#goBackFromSelectProfile').show();
                        $('.toastMessage').html("Check your server on port 3000 and try again.")
                        toastbox('toast-danger', 1999)
                    }
                }
        });
        /** */
        return false;
    }

    const updateContactsList = (profiles=object) => {
        console.log('Updating contacts list',profiles);
        var list = document.querySelector("#contactsUL");
        profiles.map((item)=>{
            var liContent = `<a id="select-${item.wallet.defaultProfile.id}" href="#" class="item" style="border-radius: 15px;" onclick="confirmCall(event, {id:'${item.wallet.defaultProfile.id}',avatar:'${ (item.wallet.defaultProfile.picture !== null && item.wallet.defaultProfile.picture !== 'null') ? item.wallet.defaultProfile.picture.original.url : 'https://cdn.discordapp.com/icons/918178320682733648/a_44df9d063ee147ada29f7a18536ce029.webp?size=256'}',name:'${item.wallet.defaultProfile.name}',handle:'${item.wallet.defaultProfile.handle}' } )">
            <div class="icon-box bg-primary">
                <img alt="LENSLogo" src="${ (item.wallet.defaultProfile.picture !== null && item.wallet.defaultProfile.picture !== 'null') ? item.wallet.defaultProfile.picture.original.url : 'https://cdn.discordapp.com/icons/918178320682733648/a_44df9d063ee147ada29f7a18536ce029.webp?size=256'}" class="" style="max-width:35px;border-radius: 20px;">
            </div>
            <div class="in">
                <div>
                    <div class="mb-05"><strong>@${item.wallet.defaultProfile.handle} (${item.wallet.defaultProfile.id})</strong></div>
                    <div class="mb-05"><small>${item.wallet.defaultProfile.stats.totalFollowers} Followers</small></div>
                    <div class="mb-06"><small>${item.wallet.defaultProfile.stats.totalFollowing} Following</small></div>
                </div>
            </div>
        </a>`
            var entry = document.createElement("li");
            entry.className = 'active'
            entry.setAttribute("style", `padding: 5px 0;`);
            entry.insertAdjacentHTML("beforeend", `${liContent}`);
            list.appendChild(entry);
        })
    }

    const updateFollowersList = (profiles=object) => {
        console.log('Updating followers list',profiles);
        $('#followersText').html(`You have ${profiles.length} follower${profiles.length == 1 ? '':'s'}`)
        var list = document.querySelector("#followersProfileUL");
        profiles.map((item)=>{
            var liContent = `<a id="select-${item.wallet.defaultProfile.id}" href="#" class="item" style="border-radius: 15px;">
            <div class="icon-box bg-primary">
                <img alt="LENSLogo" src="${ (item.wallet.defaultProfile.picture !== null && item.wallet.defaultProfile.picture !== 'null') ? item.wallet.defaultProfile.picture.original.url : 'https://cdn.discordapp.com/icons/918178320682733648/a_44df9d063ee147ada29f7a18536ce029.webp?size=256'}" class="" style="max-width:35px;border-radius: 20px;">
            </div>
            <div class="in">
                <div>
                    <div class="mb-05"><strong>@${item.wallet.defaultProfile.handle} (${item.wallet.defaultProfile.id})</strong></div>
                    <div class="mb-05"><small>${item.wallet.defaultProfile.stats.totalFollowers} Followers</small></div>
                    <div class="mb-06"><small>${item.wallet.defaultProfile.stats.totalFollowing} Following</small></div>
                </div>
            </div>
        </a>`
            var entry = document.createElement("li");
            entry.className = 'active'
            entry.setAttribute("style", `padding: 5px 0;`);
            entry.insertAdjacentHTML("beforeend", `${liContent}`);
            list.appendChild(entry);
        })
    }

    const updateFollowingList = (profiles=object) => {
        console.log('Updating following list',profiles);
        $('#followingText').html(`You are following ${profiles.length} profile${profiles.length == 1 ? '':'s'}`)
        var list = document.querySelector("#followingProfileUL");
        profiles.map((item)=>{
            var liContent = `<a id="select-${item.profile.id}" href="#" class="item" style="border-radius: 15px;">
            <div class="icon-box bg-primary">
                <img alt="LENSLogo" src="${ (item.profile.picture !== null && item.profile.picture !== 'null') ? item.profile.picture.original.url : 'https://cdn.discordapp.com/icons/918178320682733648/a_44df9d063ee147ada29f7a18536ce029.webp?size=256'}" class="" style="max-width:35px;border-radius: 20px;">
            </div>
            <div class="in">
                <div>
                    <div class="mb-05"><strong>@${item.profile.handle} (${item.profile.id})</strong></div>
                    <div class="mb-05"><small>${item.profile.stats.totalFollowers} Followers</small></div>
                    <div class="mb-06"><small>${item.profile.stats.totalFollowing} Following</small></div>
                </div>
            </div>
        </a>`
            var entry = document.createElement("li");
            entry.className = 'active'
            entry.setAttribute("style", `padding: 5px 0;`);
            entry.insertAdjacentHTML("beforeend", `${liContent}`);
            list.appendChild(entry);
        })
    }

    const updateSearchProfiles = (profiles=object, method=string) => {
        console.log('Updating profiles list',profiles);
        var list = document.querySelector("#searchProfileUL");
        profiles.map((profile)=>{
            var liContent = `<a id="select-${profile.id}" href="#" class="item" style="border-radius: 15px;" onclick="previewProfile(event, {id:'${profile.id}',avatar:'${ (profile.picture !== null && profile.picture !== 'null') ? profile.picture.original.url : 'https://cdn.discordapp.com/icons/918178320682733648/a_44df9d063ee147ada29f7a18536ce029.webp?size=256'}',name:'${profile.name}',handle:'${profile.handle}' } )">
            <div class="icon-box bg-primary">
                <img alt="LENSLogo" src="${ (profile.picture !== null && profile.picture !== 'null') ? profile.picture.original.url : 'https://cdn.discordapp.com/icons/918178320682733648/a_44df9d063ee147ada29f7a18536ce029.webp?size=256'}" class="" style="max-width:35px;border-radius: 20px;">
            </div>
            <div class="in">
                <div>
                    <div class="mb-05"><strong>@${profile.handle} (${profile.id})</strong></div>
                    <div class="mb-05"><small>Matched by ${decodeMethod(method)}</small></div>
                    <div class="mb-05"><small>${profile.stats.totalFollowers} Followers</small></div>
                    <div class="mb-06"><small>${profile.stats.totalFollowing} Following</small></div>
                </div>
            </div>
        </a>`
            var entry = document.createElement("li");
            entry.className = 'active'
            entry.setAttribute("style", `padding: 5px 0;`);
            entry.insertAdjacentHTML("beforeend", `${liContent}`);
            list.appendChild(entry);
        })
    }

    const updateSelectProfiles = (profiles=object) => {
        console.log('Updating profiles list',profiles);
        var list = document.querySelector("#selectProfileUL");
        profiles.map((profile)=>{
            var liContent = `<a id="select-${profile.id}" href="#" class="item" style="border-radius: 15px;" onclick="updateProfile(event, '${profile.id}')">
            <div class="icon-box bg-primary">
                <img alt="LENSLogo" src="${ (profile.picture !== null && profile.picture !== 'null') ? profile.picture.original.url : 'https://cdn.discordapp.com/icons/918178320682733648/a_44df9d063ee147ada29f7a18536ce029.webp?size=256'}" class="" style="max-width:35px;border-radius: 20px;">
            </div>
            <div class="in">
                <div>
                    <div class="mb-05"><strong>@${profile.handle} (${profile.id})</strong></div>
                </div>
            </div>
        </a>`
            var entry = document.createElement("li");
            entry.className = 'active'
            entry.setAttribute("style", `padding: 5px 0;`);
            entry.insertAdjacentHTML("beforeend", `${liContent}`);
            list.appendChild(entry);
        })
    }

    const launchStream = (event) => {
        event.preventDefault()
        console.log('Opening Stream on a new Tab.')
        $('.loader-wrap').fadeIn('slow');
        const streamKey = $('#streamKey').html()
        setTimeout(()=>{
            $('.loader-wrap').fadeOut('slow');
            window.open(`https://justcast.it/to/${streamKey}`, '_blank');
        }, 1999)
        

        return false
    }

    const confirmCall = (event, profile = object) => {
        event.preventDefault()
        console.log('Calling profile:', profile.id)
        $('#callID').val(profile.id);
        $('#callModalImage').attr("src", profile.avatar);
        $('.callModalName').html(`${profile.id} - @${profile.handle}`);
        $('.callModalText').html(`Do you want to start a call with ${ (profile.name !== null && profile.name !== 'null') ? profile.name : profile.handle }?`);
        $('#callProfileModal').modal('show');
        return false
    }

    const previewProfile = (event, profile = object) => {
        event.preventDefault()
        console.log('Preview profile:', profile.id)
        $('#followID').val(profile.id);
        $('#previewModalImage').attr("src", profile.avatar);
        $('.previewModalName').html(`${profile.id} - @${profile.handle}`);
        $('.previewModalText').html(`Do you want to follow ${ (profile.name !== null && profile.name !== 'null') ? profile.name : profile.handle }?`);
        $('#previewProfileModal').modal('show');
        return false
    }

    const updateProfileInfo = (profile = object) => {
        console.log('Updating profile:', profile)
        
        $('#previewID').html(profile.id)
        $('#previewHandle').html(`@${profile.handle}`)
        
        if(profile.picture !== null && profile.picture !== 'null'){
            $('#previewAvatar').attr("src", profile.picture.original.url);
        }
        if(profile.name !== null && profile.name !== 'null'){
            $('#previewName').html(profile.name)
        }
        if(profile.website !== null && profile.website !== 'null'){
            $('#previewWeb').html(profile.website)
        }
        
        return true
    }

    $(document).ready(function () {
        $('#btn-login').hide();
        $('#btn-logout').hide();
        $('#launch').hide();
        $('.landingPage').hide();
        $('.setupRig').hide();
        $('#InstallMetaMask').hide();
        $('#dapp').hide();
        $('#networkRed').hide();
        $('#networkYellow').hide();
        $('#networkGreen').hide();
        
        // Edit the file "js/moralisKeys.js" with your own Moralis App Keys (https://moralis.io)
        const serverUrl = moralisKeys.serverUrl;
        const appId =  moralisKeys.appId;
        
        Moralis.start({ serverUrl, appId });
        
        ethereum.on('accountsChanged', (accounts) => {
        console.log(account)
        // Handle the new accounts, or lack thereof.
        // "accounts" will always be an array, but it can be empty.
        window.location.reload();
        });

        ethereum.on('chainChanged', (chainId) => {
        const chain = parseInt(chainId.replace("0x","").toString(16), 16)
        console.log(chainId, chain);
        if(chain !== 80001){
            alert('Please connect to Polygon Mumbai Network')
        }else{
            window.location.reload();
        }
        // Handle the new chain.
        // Correctly handling chain changes can be complicated.
        // We recommend reloading the page unless you have good reason not to.
        // window.location.reload();
        });

        async function login() {
          $('.loader-wrap').fadeIn('slow');
          let user = Moralis.User.current();
            if (!user) {
              user = await Moralis.authenticate({ signingMessage: "0xRig DAO is requesting your signature to approve login authorization!\n\nYou will NOT be charged for this interaction." })
                .then(function (user) {
                  console.log("logged in user:", user);
                  walletAddress = user.get("ethAddress");
                  $('#btn-login').hide();
                  $('#btn-logout').show();
                  $('#launch').show();
                  $('.landingPage').hide();
                  $('.setupRig').show();
                })
                .catch(function (error) {
                  console.log(error);
                });
            }else{
                console.log("logged in user::", user);
                walletAddress = user.get("ethAddress");
                console.log(walletAddress);
                $('#btn-login').hide();
                $('#btn-logout').show();
            }
            setTimeout(function () {
                $('.loader-wrap').fadeOut('slow');
            }, 999);
        }
        
        async function logOut() {
            $('.loader-wrap').fadeIn('slow');
            await Moralis.User.logOut();
            setTimeout(function () {
                  console.log("logged out");
                  $('#btn-login').show();
                  $('#btn-logout').hide();
                  $('#launch').hide();
                  $('.landingPage').show();
                  $('.setupRig').hide();
                  $('.loader-wrap').fadeOut('slow');
            }, 999);
        }

        async function launchDapp(event) {
          event.preventDefault();
          chainNetwork = ethereum.networkVersion;
          console.log(chainNetwork);
          if(chainNetwork !== '80001'){
              alert('Connect to Polygon Mumbai')
          }else{
            console.log("launchDapp");
            $('.loader-wrap').fadeIn('slow');
            const network = 0;
            /** */
            // const balance  = await ethereum.request({ method: 'eth_getBalance' , params: [ walletAddress, 'latest' ]})
            ethereum.request({ method: 'eth_getBalance' , params: [ walletAddress, 'latest' ]}).then((balance)=>{
                // // Returns a hex value of Wei
                const wei = parseInt(balance, 16)
                const gwei = (wei / Math.pow(10, 9)) // parse to Gwei
                const eth = (wei / Math.pow(10, 18))// parse to ETH
                $('#balance').text(`BALANCE: ${eth} MATIC`);
                // console.log(wei,gwei,eth, balance)
                /** */
                $('.showAccount').show();
                $('.showAccount').text(`MetaMask: ${minify(walletAddress)}`);
                $('.showProfile').text(`LENS: ?`);
                $('#balance').show();
                console.log('API:Call private Accounts')
                var url = `${window.location.href.split("gitpod.io").shift().replace("https://8000","https://3000")}gitpod.io/account`
                $.ajax({
                        url: url,
                        dataType: 'jsonp',
                        success: function(acc){
                            if(+!!acc.data.results){
                                // Results are OK.
                                lensAddress = acc.data.address
                                lensProfile = acc.data.profile
                                $('.showProfile').text(`LENS: ${minify(lensAddress)}`);
                                console.log('lens', {addr:lensAddress, acc:lensProfile})
                                $('#networkGreen').show();
                                setTimeout(function () {
                                    /** *!*/
                                    $('.splash').hide();
                                    $('#dapp').show();
                                    $('#launch').hide();
                                    $('.landingPage').hide();
                                    $('.setupRig').show();
                                    $('#btn-logout').hide();
                                    $('.loader-wrap').fadeOut('slow');
                                    /** */
                                }, 299);
                            }else{
                                // Account is not setup. (Missing PK).
                                lensAddress = false
                                lensProfile = 'no-pk'
                                $('.showProfile').text(`LENS: {error.1001} Setup your local .env file`);
                                $('#networkRed').show();
                                setTimeout(function () {
                                    /** 
                                     * Allow pass-thru but set variables as false.
                                     * *!*/
                                    $('.splash').hide();
                                    $('#dapp').show();
                                    $('#launch').hide();
                                    $('.landingPage').hide();
                                    $('.setupRig').show();
                                    $('#btn-logout').hide();
                                    $('.loader-wrap').fadeOut('slow');
                                    /** */
                                }, 299);
                            }
                        }
                });
            }).catch(e => {
                console.log("Metamask is not responding", e);
                $('.loader-wrap').fadeOut('slow');
                $('.toastMessage').html(`MetaMask is not available. ${e}`)
                toastbox('toast-danger', 3999)
            });
            
          }
        }

        async function getProfiles(event) {
            event.preventDefault();
            console.log('Work in progress')
            var url = `${window.location.href.split("gitpod.io").shift().replace("https://8000","https://3000")}gitpod.io/`
            $.ajax({
                    url: url,
                    dataType: 'jsonp',
                    success: function(dataWeGotViaJsonp){
                        console.log(dataWeGotViaJsonp)
                    }
            });
        }
        
        async function lensProfileSection(event) {
            event.preventDefault();
            console.log('loading Lens Profile Section')
            if(lensAddress !== false && isHex(lensAddress) && isHex(lensProfile) ){
                $('.loader-wrap').fadeIn('slow');
                // everything is OK.
                // Read Profile.
                console.log('API:Get Profile by ID:', lensProfile)
                var url = `${window.location.href.split("gitpod.io").shift().replace("https://8000","https://3000")}gitpod.io/getProfile?id=${lensProfile}&method=id`
                $.ajax({
                        url: url,
                        dataType: 'jsonp',
                        success: function(profile){
                            if(+!!profile.data.results){
                                selectedProfile = {...profile.data.profiles.items[0], empty:false}
                                $('.loader-wrap').fadeOut('slow');
                                $('#sectionProfile').show();
                                $('#sectionDashboard').hide();
                                $('#sectionLensProfile').show();
                                updateProfileInfo(selectedProfile)
                                window.scrollTo(0, 0);
                            }else{
                                // Try Again. API sometimes glitches.
                                console.log('API timeout, retrying in 2 seconds ...')
                                setTimeout(()=>{
                                    $.ajax({
                                        url: url,
                                        dataType: 'jsonp',
                                        success: function(profile){
                                            if(+!!profile.data.results){
                                                selectedProfile = {...profile.data.profiles.items[0], empty:false}
                                                $('.loader-wrap').fadeOut('slow');
                                                $('#sectionProfile').show();
                                                $('#sectionDashboard').hide();
                                                $('#sectionLensProfile').show();
                                                updateProfileInfo(selectedProfile)
                                                window.scrollTo(0, 0);
                                            }else{
                                                // Something went wrong, twice.
                                                // What should we do?
                                                console.log('Server is not responding.')
                                                $('.loader-wrap').fadeOut('slow');
                                                $('.toastMessage').html("LENS API is not available atm. Try again.")
                                                toastbox('toast-danger', 1999)
                                            }
                                        }
                                    });
                                }, 999)

                            }
                        }
                });

            }else{
                if(isHex(lensAddress) && !isHex(lensProfile) ){
                    // PK is set, lensAddress is valid.
                    // BUT ... No Profile is Set.
                    $('#sectionProfile').show();
                    $('#sectionDashboard').hide();
                }else{
                    // Multiple options.
                    if(isHex(lensAddress)){
                        // PK is set. lensProfile is not set.
                        $('#sectionProfile').show();
                        $('#sectionDashboard').hide();
                    }else{
                        // PK is NOT set.
                        // No Go. SetUp First.
                    }
                }
            }
            // Check if lensAccount is active. (lensProfile check hex)
            // Check if account has any active Profiles.
            // Create new profile.
        }

        async function newProfileSection(event){
            event.preventDefault();
            $('#sectionProfile').hide();
            $('#sectionNewProfile').show();
            window.scrollTo(0, 0);
            return true;
        }

        async function createProfileSubmit(event){
            event.preventDefault();
            var i = 0;
            var handle = $('#newHandle').val().replaceAll(" , ", ",").replaceAll(", ", ",").replaceAll(" ,", ",").split(",");
            if(handle.length >= 1){
                $('#createProfileBtn, #goBackFromNewProfile').hide();
                $('#createLoader').show();
                // map and call every handle.
                if(handle.length <= 1){
                    // Only One
                    $('.toastMessage').html(`Requesting 1 handle: @${handle[0]}. Please wait.`)
                    toastbox('toast-warning', 3999)
                }else{
                    // BULK
                    $('.toastMessage').html(`Requesting ${handle.length} handles. This could take a few seconds.`)
                    toastbox('toast-warning', 4999)
                }
                setTimeout(()=>{
                    handle.map((item, index)=>{
                        i++;
                        // Show PopUp on Creation.
                        setTimeout(()=>{
                            console.log(`API: Request handle:`, cleanHandle(item))
                            var url = `${window.location.href.split("gitpod.io").shift().replace("https://8000","https://3000")}gitpod.io/newLENS?at=${cleanHandle(item)}`
                            $.ajax({
                                    url: url,
                                    dataType: 'jsonp',
                                    success: function(profile){
                                        console.log(profile)
                                        if(+!!profile.data.results){
                                            // New Account created.
                                            if(profile.data.error !== false && profile.data.error !== undefined){
                                                $('.toastMessage').html(`Error: @${cleanHandle(item)} ${profile.data.error}`)
                                                toastbox('toast-danger', 2999)
                                            }else{
                                                $('.toastMessage').html(`Created: @${cleanHandle(item)}`)
                                                toastbox('toast-success', 1999)
                                            }
                                            if(index >= handle.length-1){
                                                console.log('Request Completed')
                                                setTimeout(()=>{
                                                    $('#createProfileBtn, #goBackFromNewProfile').show();
                                                    $('#createLoader').hide();
                                                }, 999)
                                            }
                                        }else{
                                            // Try Again. API sometimes glitches.
                                            console.log('API timeout, retrying in 2 seconds ...')
                                            setTimeout(()=>{
                                                $.ajax({
                                                    url: url,
                                                    dataType: 'jsonp',
                                                    success: function(profile){
                                                        console.log(profile)
                                                        if(+!!profile.data.results){
                                                            // New Account created.
                                                            if(profile.data.error !== false && profile.data.error !== undefined){
                                                                $('.toastMessage').html(`Error: @${cleanHandle(item)} ${profile.data.error}`)
                                                                toastbox('toast-danger', 2999)
                                                            }else{
                                                                $('.toastMessage').html(`Created: @${cleanHandle(item)}`)
                                                                toastbox('toast-success', 1999)
                                                            }
                                                            if(index >= handle.length-1){
                                                                console.log('completed')
                                                                setTimeout(()=>{
                                                                    $('#createProfileBtn, #goBackFromNewProfile').show();
                                                                    $('#createLoader').hide();
                                                                }, 999)
                                                            }
                                                        }else{
                                                            // Something went wrong, twice.
                                                            // What should we do?
                                                            console.log('Server is not responding.')
                                                            $('.toastMessage').html("LENS API error. Try again.")
                                                            toastbox('toast-danger', 1999)
                                                            if(index >= handle.length-1){
                                                                console.log('completed')
                                                                setTimeout(()=>{
                                                                    $('#createProfileBtn, #goBackFromNewProfile').show();
                                                                    $('#createLoader').hide();
                                                                }, 999)
                                                            }
                                                        }
                                                    }
                                                });
                                            }, 999)

                                        }
                                    }
                            });
                            
                        }, 5999*index)
                    })
                }, 1999)
                // Probably confirm first, then run action.
            }else{
                // handle is probably empty.
                $('.toastMessage').html("Enter a new handle")
                toastbox('toast-warning', 1999)
            }
            console.log(`Requested Handle${handle.length>=2?'s':''}`,handle)
            return false;
        }

        async function livepeerSetupSubmit(event){
            event.preventDefault();
            $('#lpSetupLoader').show();
            $('#lpSetupBtn, #goBackFromLPSetup').hide();
            var livepeerInput = $('#livepeerApiKeyInput').val();
            if(searchInput !== ''){
                const methods = isHex(searchInput) ? ['owner','id','handle'] : ['handle'];
                $('.toastMessage').html(`Setting up livepeer for streaming.`)
                toastbox('toast-success', 3999)
                console.log(`API LivePeer Setup`);
                var url = `${window.location.href.split("gitpod.io").shift().replace("https://8000","https://3000")}gitpod.io/livepeerSetup?id=${livepeerInput}`
                $.ajax({
                        url: url,
                        dataType: 'jsonp',
                        success: function(results){
                            console.log(results)
                            if(+!!results.data.results){
                                // Everything is OK.
                                $('#lpSetupBtn, #goBackFromLPSetup').show();
                                $('#lpSetupLoader').hide();
                                navigateToContactsSection(event)
                            }else{
                                // Try Again. API sometimes glitches.
                                console.log('Error setting up LivePeer APIKey ...')
                            }
                        }
                });
                
            }
            
            return true;
        }
        
        async function searchProfileSubmit(event){
            event.preventDefault();
            $('#searchLoader').show();
            $('#searchProfileBtn, #goBackFromSearchProfile').hide();
            var searchInput = cleanHandle($('#searchInput').val());
            if(searchInput !== ''){
                const methods = isHex(searchInput) ? ['owner','id','handle'] : ['handle'];
                if(isHex(searchInput)){
                    $('.toastMessage').html(`Performing a wide search. This could take a moment. "${searchInput}"`)
                    toastbox('toast-success', 3999)
                }else{
                    $('.toastMessage').html(`Searching for a handle: @"${searchInput}"`)
                    toastbox('toast-success', 3999)
                }
                setTimeout(()=>{
                    methods.map((method, index)=>{
                        setTimeout(()=>{
                            console.log(`API Search Profile: ${searchInput}. Method:`, method);
                            var url = `${window.location.href.split("gitpod.io").shift().replace("https://8000","https://3000")}gitpod.io/getProfile?id=${cleanHandle(searchInput)}&method=${method}`
                            $.ajax({
                                    url: url,
                                    dataType: 'jsonp',
                                    success: function(results){
                                        console.log(results)
                                        if(+!!results.data.results){
                                            // Search completed.
                                            if(results.data.profiles.pageInfo.totalCount >= 1){
                                                $('.toastMessage').html(`Found: ${results.data.profiles.pageInfo.totalCount} result${(results.data.profiles.pageInfo.totalCount>=2)?'s':''}. Method ${methods[index]}.`)
                                                toastbox('toast-success', 2999)
                                                // append LI
                                                updateSearchProfiles(results.data.profiles.items, methods[index])
                                            }else{
                                                $('.toastMessage').html(`No Results for method: ${methods[index]}`)
                                                toastbox('toast-warning', 2999)
                                            }
                                            if(index >= methods.length-1){
                                                console.log('Request Completed')
                                                setTimeout(()=>{
                                                    $('#searchProfileBtn, #goBackFromSearchProfile').show();
                                                    $('#searchLoader').hide();
                                                }, 999)
                                            }
                                        }else{
                                            // Try Again. API sometimes glitches.
                                            console.log('API timeout, retrying in 2 seconds ...')
                                            setTimeout(()=>{
                                                $.ajax({
                                                    url: url,
                                                    dataType: 'jsonp',
                                                    success: function(results){
                                                        console.log(results)
                                                        if(+!!results.data.results){
                                                            // Search completed.
                                                            if(results.data.profiles.pageInfo.totalCount >= 1){
                                                                $('.toastMessage').html(`Found: ${results.data.profiles.pageInfo.totalCount} result${(results.data.profiles.pageInfo.totalCount>=2)?'s':''}. Method ${methods[index]}.`)
                                                                toastbox('toast-success', 2999)
                                                                // append LI
                                                                updateSearchProfiles(results.data.profiles.items, methods[index])
                                                            }else{
                                                                $('.toastMessage').html(`No Results for method: ${methods[index]}`)
                                                                toastbox('toast-warning', 2999)
                                                            }
                                                            if(index >= methods.length-1){
                                                                console.log('Request Completed')
                                                                setTimeout(()=>{
                                                                    $('#searchProfileBtn, #goBackFromSearchProfile').show();
                                                                    $('#searchLoader').hide();
                                                                }, 999)
                                                            }
                                                        }else{
                                                            // Something went wrong, twice.
                                                            // What should we do?
                                                            console.log(`Server is not responding. ${methods[index]}`)
                                                            $('.toastMessage').html(`"${searchInput}" is not a: ${methods[index]}`)
                                                            toastbox('toast-danger', 2999)
                                                            if(index >= methods.length-1){
                                                                console.log('Request Completed')
                                                                setTimeout(()=>{
                                                                    $('#searchProfileBtn, #goBackFromSearchProfile').show();
                                                                    $('#searchLoader').hide();
                                                                }, 999)
                                                            }
                                                        }
                                                    }
                                                });
                                            }, 999)

                                        }
                                    }
                            });
                            
                        }, 5999*index)
                })

                        
                }, 2999)
                
            }
            
            return true;
        }

        async function navigateToContactsSection(event){
            event.preventDefault();
            window.scrollTo(0, 0);
            $('.loader-wrap').fadeIn('slow');
            console.log(`API: Call LivePeer Check:`)
            var url = `${window.location.href.split("gitpod.io").shift().replace("https://8000","https://3000")}gitpod.io/livepeer`
            $.ajax({
                    url: url,
                    dataType: 'jsonp',
                    success: function(livepeer){
                        console.log(livepeer)
                        if(+!!livepeer.data.results){
                            // 
                            console.log('LivePeer API KEY is enabled.')
                            console.log(`API: Call followers: ${lensProfile}`)
                            var url = `${window.location.href.split("gitpod.io").shift().replace("https://8000","https://3000")}gitpod.io/followers?limit=50`
                            $.ajax({
                                    url: url,
                                    dataType: 'jsonp',
                                    success: function(follow){
                                        console.log(follow)
                                        if(+!!follow.data.results){
                                            // 
                                            $('.loader-wrap').fadeOut('slow');
                                            $('#contactsText').html(`${follow.data.data.followers.pageInfo.totalCount} contacts`)
                                            $('.toastMessage').html(`You have ${follow.data.data.followers.pageInfo.totalCount} contacts.`)
                                            toastbox('toast-success', 3999)
                                            $('#sectionDashboard, #sectionLivePeerSetup').hide();
                                            $('#sectionContacts').show();
                                            updateContactsList(follow.data.data.followers.items)
                                        }else{
                                            // Try Again. API sometimes glitches.
                                            console.log('API timeout, retrying in 2 seconds ...')
                                            setTimeout(()=>{
                                                $.ajax({
                                                    url: url,
                                                    dataType: 'jsonp',
                                                    success: function(follow){
                                                        console.log(follow)
                                                        if(+!!follow.data.results){
                                                            // 
                                                            $('.loader-wrap').fadeOut('slow');
                                                            $('#contactsText').html(`${follow.data.data.followers.pageInfo.totalCount} contacts`)
                                                            $('.toastMessage').html(`You have ${follow.data.data.followers.pageInfo.totalCount} contacts.`)
                                                            toastbox('toast-success', 3999)
                                                            $('#sectionDashboard, #sectionLivePeerSetup').hide();
                                                            $('#sectionContacts').show();
                                                            updateContactsList(follow.data.data.followers.items)
                                                        }else{
                                                            // Something went wrong, twice.
                                                            // What should we do?
                                                            $('.loader-wrap').fadeOut('slow');
                                                            $('#sectionDashboard').show();
                                                            $('#sectionLivePeerSetup').hide();
                                                            console.log('Server is not responding.')
                                                            $('.toastMessage').html("LENS API error. Try again.")
                                                            toastbox('toast-danger', 1999)
                                                        }
                                                    }
                                                });
                                            }, 999)

                                        }
                                    }
                            });
                        }else{
                            // LivePeer not Set.
                            $('.loader-wrap').fadeOut('slow');
                            console.log('LivePeer API KEY is not set.')
                            $('.toastMessage').html("LivePeer API KEY is not set.")
                            toastbox('toast-warning', 2999)
                            $('#sectionDashboard').hide();
                            $('#sectionLivePeerSetup').show();
                            // Show LivePeer Setup Page.
                        }
                    }
            });

            return true;
        }

        async function navigateToDashboardSection(event){
            event.preventDefault();
            $('#sectionProfile, #sectionContacts, #sectionCalling').hide();
            $('#sectionDashboard').show();
            window.scrollTo(0, 0);
            return true;
        }

        async function navigateToProfileSection(event){
            event.preventDefault();
            $('#newHandle, #searchInput').val("")
            $('#sectionProfile').show();
            $('#sectionSelectProfile, #sectionNewProfile, #sectionSearchProfile, #sectionFollowing, #sectionFollowers').hide();
            window.scrollTo(0, 0);
            return true;
        }

        async function selectProfileSection(event){
            event.preventDefault();
            $('.loader-wrap').fadeIn('slow');
            console.log(`API: Call read all profiles associated with: ${lensAddress}`)
            var url = `${window.location.href.split("gitpod.io").shift().replace("https://8000","https://3000")}gitpod.io/getProfile?id=${lensAddress}&method=owner`
            $.ajax({
                    url: url,
                    dataType: 'jsonp',
                    success: function(profiles){
                        console.log(profiles)
                        if(+!!profiles.data.results){
                            // 
                            updateSelectProfiles(profiles.data.profiles.items)
                            $('.loader-wrap').fadeOut('slow');
                            $('#sectionProfile').hide();
                            $('#sectionSelectProfile').show();
                            window.scrollTo(0, 0);
                        }else{
                            // Try Again. API sometimes glitches.
                            console.log('API timeout, retrying in 2 seconds ...')
                            setTimeout(()=>{
                                $.ajax({
                                    url: url,
                                    dataType: 'jsonp',
                                    success: function(profiles){
                                        console.log(profiles)
                                        if(+!!profiles.data.results){
                                            // 
                                            updateSelectProfiles(profiles.data.profiles.items)
                                            $('.loader-wrap').fadeOut('slow');
                                            $('#sectionProfile').hide();
                                            $('#sectionSelectProfile').show();
                                            window.scrollTo(0, 0);
                                        }else{
                                            // Something went wrong, twice.
                                            // What should we do?
                                            $('.loader-wrap').fadeOut('slow');
                                            console.log('Server is not responding.')
                                            $('.toastMessage').html("LENS API error. Try again.")
                                            toastbox('toast-danger', 1999)
                                        }
                                    }
                                });
                            }, 999)

                        }
                    }
            });
            return true;
        }

        async function exitDapp (event){
            event.preventDefault()
            $('.loader-wrap').fadeIn('slow');
            $('#launch').show();
            $('.landingPage').hide();
            $('.setupRig').show();
            $('#btn-logout').show();
            window.scrollTo(0, 0);
            setTimeout(()=>{
                $('#dapp').hide();
                $('.splash').show();
                $('.loader-wrap').fadeOut('slow');
            }, 999)
            return false;
        }

        async function navigateToFollowingSection(event){
            event.preventDefault()
            $('.loader-wrap').fadeIn('slow');
            console.log(`API: Call following: ${lensProfile}`)
            var url = `${window.location.href.split("gitpod.io").shift().replace("https://8000","https://3000")}gitpod.io/following?limit=50`
            $.ajax({
                    url: url,
                    dataType: 'jsonp',
                    success: function(follow){
                        console.log(follow)
                        if(+!!follow.data.results){
                            // 
                            $('.loader-wrap').fadeOut('slow');
                            $('.toastMessage').html(`You are following ${follow.data.data.following.pageInfo.totalCount} profiles.`)
                            toastbox('toast-success', 3999)
                            $('#sectionProfile').hide();
                            $('#sectionFollowing').show();
                            updateFollowingList(follow.data.data.following.items)
                        }else{
                            // Try Again. API sometimes glitches.
                            console.log('API timeout, retrying in 2 seconds ...')
                            setTimeout(()=>{
                                $.ajax({
                                    url: url,
                                    dataType: 'jsonp',
                                    success: function(follow){
                                        console.log(follow)
                                        if(+!!follow.data.results){
                                            // 
                                            $('.loader-wrap').fadeOut('slow');
                                            $('.toastMessage').html(`You are following ${follow.data.data.following.pageInfo.totalCount} profiles.`)
                                            toastbox('toast-success', 3999)
                                            updateFollowingList(follow.data.data.following.items)
                                            $('#sectionProfile').hide();
                                            $('#sectionFollowing').show();
                                        }else{
                                            // Something went wrong, twice.
                                            // What should we do?
                                            $('.loader-wrap').fadeOut('slow');
                                            console.log('Server is not responding.')
                                            $('.toastMessage').html("LENS API error. Try again.")
                                            toastbox('toast-danger', 1999)
                                        }
                                    }
                                });
                            }, 999)

                        }
                    }
            });
            return false;
        }

        async function navigateToFollowersSection(event){
            event.preventDefault()
            $('.loader-wrap').fadeIn('slow');
            console.log(`API: Call followers: ${lensProfile}`)
            var url = `${window.location.href.split("gitpod.io").shift().replace("https://8000","https://3000")}gitpod.io/followers?limit=50`
            $.ajax({
                    url: url,
                    dataType: 'jsonp',
                    success: function(follow){
                        console.log(follow)
                        if(+!!follow.data.results){
                            // 
                            $('.loader-wrap').fadeOut('slow');
                            $('.toastMessage').html(`You have ${follow.data.data.followers.pageInfo.totalCount} followers.`)
                            toastbox('toast-success', 3999)
                            $('#sectionProfile').hide();
                            $('#sectionFollowers').show();
                            updateFollowersList(follow.data.data.followers.items)
                        }else{
                            // Try Again. API sometimes glitches.
                            console.log('API timeout, retrying in 2 seconds ...')
                            setTimeout(()=>{
                                $.ajax({
                                    url: url,
                                    dataType: 'jsonp',
                                    success: function(follow){
                                        console.log(follow)
                                        if(+!!follow.data.results){
                                            // 
                                            $('.loader-wrap').fadeOut('slow');
                                            $('.toastMessage').html(`You have ${follow.data.data.followers.pageInfo.totalCount} followers.`)
                                            toastbox('toast-success', 3999)
                                            updateFollowersList(follow.data.data.followers.items)
                                            $('#sectionProfile').hide();
                                            $('#sectionFollowers').show();
                                        }else{
                                            // Something went wrong, twice.
                                            // What should we do?
                                            $('.loader-wrap').fadeOut('slow');
                                            console.log('Server is not responding.')
                                            $('.toastMessage').html("LENS API error. Try again.")
                                            toastbox('toast-danger', 1999)
                                        }
                                    }
                                });
                            }, 999)

                        }
                    }
            });
            return false;
        }

        async function navigateToSearchSection(event){
            event.preventDefault()
            $('.loader-wrap').fadeIn('slow');
            setTimeout(()=>{
                window.scrollTo(0, 0);
                $('#sectionProfile').hide();
                $('#sectionSearchProfile').show();
                $('.loader-wrap').fadeOut('slow');
            }, 999)
            return false;
        }

        async function confirmCallSubmit(event){
            event.preventDefault()
            $('#callProfileModal').modal('hide');
            $('.loader-wrap').fadeIn('slow');
            var callID = $('#callID').val();
            // Follow by ID.
            console.log(`API: Call profile: ${callID}`)
            // Read 0xRig Posts from User Profile.
            // Start a Stream.
            // Encode with LIT. (MINT)
            // Generate JWT.
            // Post JWT into User Profile.
            var url = `${window.location.href.split("gitpod.io").shift().replace("https://8000","https://3000")}gitpod.io/stream?id=new`
            $.ajax({
                    url: url,
                    dataType: 'jsonp',
                    success: function(stream){
                        console.log(stream)
                        if(+!!stream.results){
                            // 
                            $('.loader-wrap').fadeOut('slow');
                            // Hide Contacts
                            $('#streamKey').html(stream.data.streamKey)
                            $('#sectionContacts').hide();
                            $('#sectionCalling').show();
                            $('.toastMessage').html("Stream Key Created!")
                            toastbox('toast-success', 2999)
                            // Show Calling Card.
                        }else{
                            // Try Again. API sometimes glitches.
                            console.log('API timeout, retrying in 2 seconds ...')
                            $('.loader-wrap').fadeOut('slow');
                        }
                    }
            });
            return false;
        }

        async function confirmFollowSubmit(event){
            event.preventDefault()
            $('#previewProfileModal').modal('hide');
            $('.loader-wrap').fadeIn('slow');
            var followID = $('#followID').val();
            // Follow by ID.
            console.log(`API: Call follow profile: ${followID}`)
            var url = `${window.location.href.split("gitpod.io").shift().replace("https://8000","https://3000")}gitpod.io/follow?id=${followID}`
            $.ajax({
                    url: url,
                    dataType: 'jsonp',
                    success: function(follow){
                        console.log(follow)
                        if(+!!follow.data.results){
                            // 
                            $('.loader-wrap').fadeOut('slow');
                            $('.toastMessage').html(`You have sent a Follow Request to ${followID}`)
                            toastbox('toast-success', 3999)
                        }else{
                            // Try Again. API sometimes glitches.
                            console.log('API timeout, retrying in 2 seconds ...')
                            setTimeout(()=>{
                                $.ajax({
                                    url: url,
                                    dataType: 'jsonp',
                                    success: function(follow){
                                        console.log(follow)
                                        if(+!!follow.data.results){
                                            // 
                                            $('.loader-wrap').fadeOut('slow');
                                            $('.toastMessage').html(`You have sent a Follow Request to ${followID}`)
                                            toastbox('toast-success', 3999)
                                        }else{
                                            // Something went wrong, twice.
                                            // What should we do?
                                            $('.loader-wrap').fadeOut('slow');
                                            console.log('Server is not responding.')
                                            $('.toastMessage').html("LENS API error. Try again.")
                                            toastbox('toast-danger', 1999)
                                        }
                                    }
                                });
                            }, 999)

                        }
                    }
            });
            return false;
        }

        document.getElementById("btn-login").onclick = login;
        document.getElementById("btn-logout").onclick = logOut;
        document.getElementById("launch").onclick = launchDapp;
        // document.getElementById("getProfiles").onclick = getProfiles;
        document.getElementById("lensProfile").onclick = lensProfileSection;
        document.getElementById("newProfile").onclick = newProfileSection;
        
        document.getElementById("goBack2Dashboard").onclick = navigateToDashboardSection;
        document.getElementById("goBackFromContacts").onclick = navigateToDashboardSection;
        document.getElementById("goBackFromCalling").onclick = navigateToDashboardSection;
        
        document.getElementById("goBackFromSearchProfile").onclick = navigateToProfileSection;
        document.getElementById("goBackFromNewProfile").onclick = navigateToProfileSection;
        document.getElementById("goBackFromSelectProfile").onclick = navigateToProfileSection;
        document.getElementById("goBackFromFollowing").onclick = navigateToProfileSection;
        document.getElementById("goBackFromFollowers").onclick = navigateToProfileSection;
        document.getElementById("selectProfile").onclick = selectProfileSection;
        document.getElementById("searchLENS").onclick = navigateToSearchSection;
        document.getElementById("following").onclick = navigateToFollowingSection;
        document.getElementById("followers").onclick = navigateToFollowersSection;
        
        document.getElementById("createProfileBtn").onclick = createProfileSubmit;
        document.getElementById("searchProfileBtn").onclick = searchProfileSubmit;

        document.getElementById("myContactsBtn").onclick = navigateToContactsSection;

        document.getElementById("confirmFollow").onclick = confirmFollowSubmit;
        document.getElementById("lpSetupBtn").onclick = livepeerSetupSubmit;
        document.getElementById("confirmCallBtn").onclick = confirmCallSubmit;

        document.getElementById("streamLaunchBtn").onclick = launchStream;

        document.getElementById("exit").onclick = exitDapp;

        let user = Moralis.User.current();
          if (!user) {
              console.log('not logged in')
              $('#btn-login').show();
              $('#btn-logout').hide();
          }else{
              $('.loader-wrap').fadeIn('slow');
              walletAddress = user.get("ethAddress");
              console.log(walletAddress);
              setTimeout(function () {
                    console.log('Logged in', user)
                    $('#launch').show();
                    $('.landingPage').hide();
                    $('.setupRig').show();
                    $('#btn-logout').show();
              }, 999);
          }
        
    })

///////////////////////////////////////////////////////////////////////////
// Loader
$(document).ready(function () {
    setTimeout(() => {
        $("#loader").fadeToggle(250);
    }, 800); // hide delay when page load
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// Go Back
$(".goBack").click(function () {
    window.history.go(-1);
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// Tooltip
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// Input
$(".clear-input").click(function () {
    $(this).parent(".input-wrapper").find(".form-control").focus();
    $(this).parent(".input-wrapper").find(".form-control").val("");
    $(this).parent(".input-wrapper").removeClass("not-empty");
});
// active
$(".form-group .form-control").focus(function () {
    $(this).parent(".input-wrapper").addClass("active");
}).blur(function () {
    $(this).parent(".input-wrapper").removeClass("active");
})
// empty check
$(".form-group .form-control").keyup(function () {
    var inputCheck = $(this).val().length;
    if (inputCheck > 0) {
        $(this).parent(".input-wrapper").addClass("not-empty");
    }
    else {
        $(this).parent(".input-wrapper").removeClass("not-empty");
    }
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// Searchbox Toggle
$(".toggle-searchbox").click(function () {
    $("#search").fadeToggle(200);
    $("#search .form-control").focus();
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// Owl Carousel
$('.carousel-full').owlCarousel({
    loop:true,
    margin:8,
    nav:false,
    items: 1,
    dots: false,
});
$('.carousel-single').owlCarousel({
    stagePadding: 30,
    loop:true,
    margin:16,
    nav:false,
    items: 1,
    dots: false,
});
$('.carousel-multiple').owlCarousel({
    stagePadding: 32,
    loop:true,
    margin:16,
    nav:false,
    items: 2,
    dots: false,
});
$('.carousel-small').owlCarousel({
    stagePadding: 32,
    loop:true,
    margin:8,
    nav:false,
    items: 4,
    dots: false,
});
$('.carousel-slider').owlCarousel({
    loop:true,
    margin:8,
    nav:false,
    items: 1,
    dots: true,
});
///////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////
$('.custom-file-upload input[type="file"]').each(function () {
    // Refs
    var $fileUpload = $(this),
        $filelabel = $fileUpload.next('label'),
        $filelabelText = $filelabel.find('span'),
        filelabelDefault = $filelabelText.text();
    $fileUpload.on('change', function (event) {
        var name = $fileUpload.val().split('\\').pop(),
            tmppath = URL.createObjectURL(event.target.files[0]);
        if (name) {
            $filelabel
                .addClass('file-uploaded')
                .css('background-image', 'url(' + tmppath + ')');
            $filelabelText.text(name);
        } else {
            $filelabel.removeClass('file-uploaded');
            $filelabelText.text(filelabelDefault);
        }
    });
});
///////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////
// Notification
// trigger notification
function notification(target, time) {
    var a = "#" + target;
    $(".notification-box").removeClass("show");
    setTimeout(() => {
        $(a).addClass("show");
    }, 300);
    if (time) {
        time = time + 300;
        setTimeout(() => {
            $(".notification-box").removeClass("show");
        }, time);
    }
};
// close button notification
$(".notification-box .close-button").click(function (event) {
    event.preventDefault();
    $(".notification-box.show").removeClass("show");
});
// tap to close notification
$(".notification-box.tap-to-close .notification-dialog").click(function () {
    $(".notification-box.show").removeClass("show");
});
///////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////
// Toast
// trigger toast
function toastbox(target, time) {
    var a = "#" + target;
    $(".toast-box").removeClass("show");
    setTimeout(() => {
        $(a).addClass("show");
    }, 100);
    if (time) {
        time = time + 100;
        setTimeout(() => {
            $(".toast-box").removeClass("show");
        }, time);
    }
};
// close button toast
$(".toast-box .close-button").click(function (event) {
    event.preventDefault();
    $(".toast-box.show").removeClass("show");
});
// tap to close toast
$(".toast-box.tap-to-close").click(function () {
    $(this).removeClass("show");
});
///////////////////////////////////////////////////////////////////////////