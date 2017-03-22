angular.module('orderCloud')
    .factory('ShippingAddresses', ShippingAddresses)
;

function ShippingAddresses($q, OrderCloud) {
    var service = {
        GetAddresses: _getAddresses
    };

    function _getAddresses(CurrentUser) {
        var addressArray = [];
        var locationIDs = CurrentUser.xp.Locations;
        _.each(locationIDs, function(locationID) {
            addressArray.push(OrderCloud.Me.ListAddresses(null, null, null, null, null, {CompanyName: locationID})
                .then(function(address){
                    return address.Items[0];
                })
                .catch(function(ex) {
                    console.log(ex);
                })
            )
        });
        return $q.all(addressArray);
    }
    return service;
}