'use strict'
    const daoAddress = ''; // In case we need a SC to interact with.
    // This Address is only for Polygon's Mumbai Testnet.
    var walletAddress = '';
    var chainNetwork = false;
    var lensAddress = '';
    var lensProfile = '';
    var selectedProfile = {empty:true}

    const isHex = (inputString = string) =>{
        var re = /[0-9A-Fa-f]{2}/g;
        return re.test(inputString);
    }

    const minify = (walletAddress = string) => {
        return walletAddress.replace(walletAddress.substring(6, 38), '...')
    }

    const cleanHandle = (handle = string) => {
        return handle.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(" ", "-")
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

    const updateSelectProfiles = (profiles=object) => {
        console.log('Updating profiles list',profiles);
        var list = document.querySelector("#selectProfileUL");
        profiles.map((profile)=>{
            var liContent = `<a id="select-${profile.id}" href="#" class="item" style="border-radius: 15px;" onclick="updateProfile(event, '${profile.id}')">
            <div class="icon-box bg-primary">
                <img alt="LENSLogo" src="${profile.picture !== null ? profile.picture.original.url : 'https://cdn.discordapp.com/icons/918178320682733648/a_44df9d063ee147ada29f7a18536ce029.webp?size=256'}" class="" style="max-width:35px;border-radius: 20px;">
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

    const updateProfileInfo = (profile = object) => {
        console.log('Updating profile:', profile)
        
        $('#previewID').html(profile.id)
        $('#previewHandle').html(`@${profile.handle}`)
        
        if(profile.picture !== null){
            $('#previewAvatar').attr("src", profile.picture.original.url);
        }
        if(profile.name !== null){
            $('#previewName').src(profile.name)
        }
        if(profile.website !== null){
            $('#previewWeb').src(profile.website)
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

        async function navigateToDashboardSection(event){
            event.preventDefault();
            $('#sectionProfile').hide();
            $('#sectionDashboard').show();
            window.scrollTo(0, 0);
            return true;
        }

        async function navigateToProfileSection(event){
            event.preventDefault();
            $('#sectionProfile').show();
            $('#sectionNewProfile').hide();
            $('#sectionSelectProfile').hide();
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

        document.getElementById("btn-login").onclick = login;
        document.getElementById("btn-logout").onclick = logOut;
        document.getElementById("launch").onclick = launchDapp;
        // document.getElementById("getProfiles").onclick = getProfiles;
        document.getElementById("lensProfile").onclick = lensProfileSection;
        document.getElementById("newProfile").onclick = newProfileSection;
        document.getElementById("createProfileBtn").onclick = createProfileSubmit;
        document.getElementById("goBack2Dashboard").onclick = navigateToDashboardSection;
        document.getElementById("goBackFromNewProfile").onclick = navigateToProfileSection;
        document.getElementById("goBackFromSelectProfile").onclick = navigateToProfileSection;
        document.getElementById("selectProfile").onclick = selectProfileSection;

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