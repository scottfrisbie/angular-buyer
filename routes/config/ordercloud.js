var OrderCloudSDK = require('ordercloud-javascript-sdk');
var ocClient = OrderCloudSDK.ApiClient.instance;

OrderCloudSDK.SetToken = function(token){
    ocClient.authentications['oauth2'].accessToken = token;
};

module.exports = OrderCloudSDK;