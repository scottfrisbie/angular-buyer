
angular.module('orderCloud')
    .run(OrderCloudAngularSDKConfig)
    .config(OrderCloudSDKAuthAdditions)
;

function OrderCloudAngularSDKConfig(OrderCloudSDK, appname, apiurl, authurl) {
    var cookiePrefix = appname.replace(/ /g, '_').toLowerCase();
    var apiVersion = 'v1';
    OrderCloudSDK.Config(cookiePrefix, apiurl + '/' + apiVersion, authurl);
}

function OrderCloudSDKAuthAdditions($provide) {
    $provide.decorator('OrderCloudSDK', function($delegate, $cookies, $state) {
        function orderCloudAuthLogout() {
            angular.forEach($cookies.getAll(), function(value, key) {
                $cookies.remove(key);
            });
            $state.go('login');
        }
        $delegate.Auth.Logout = orderCloudAuthLogout;
        return $delegate;
    });
}