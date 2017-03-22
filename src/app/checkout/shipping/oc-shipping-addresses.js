angular.module('orderCloud')
    .factory('ShippingAddresses', ShippingAddresses)
;

function ShippingAddresses($q, OrderCloud, buyerid) {
    var service = {
        GetAddresses: _getAddresses
    };

    function _getAddresses(CurrentUser) {
        var addressArray = [];
        var locationIDs = CurrentUser.xp.Locations;
        _.each(locationIDs, function(locationID) {
            addressArray.push(OrderCloud.Addresses.List(null, null, null, null, null, {CompanyName: locationID}, buyerid)
                .then(function(address){
                    return address.Items[0];
                }))
        });
        $q.all(addressArray)
            .then(function(data) {
                return data;
            })
    }
    return service;
}