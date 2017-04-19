angular.module('orderCloud')
    .factory('ocOrders', ocOrdersService)
;

function ocOrdersService(OrderCloudSDK, toastr){
    var service = {
        List: _list
    };
    
    function _list(Parameters, CurrentUser, Buyer){
        var parameters = angular.copy(Parameters);

        //exclude unsubmitted orders from list
        parameters.filters = {Status: '!Unsubmitted'};

        //set outgoing params to iso8601 format as expected by api
        //set returning params to date object as expected by uib-datepicker
        if(parameters.from) {
            var fromDateObj = new Date(parameters.from);
            Parameters.fromDate = fromDateObj;
            parameters.from = (fromDateObj).toISOString();
        }
        if(parameters.to) {
            var toDateObj = new Date(parameters.to);
            Parameters.toDate = toDateObj;
            parameters.to = (toDateObj).toISOString();
        }

        // DateSubmitted calculated with from/to parameters
        if(parameters.from && parameters.to) {
            parameters.filters.DateSubmitted = [('>' + parameters.from), ('<' + parameters.to)];
        } else if(parameters.from && !parameters.to) {
            parameters.filters.DateSubmitted = [('>' + parameters.from)];
        } else if (!parameters.from && parameters.to) {
            parameters.filters.DateSubmitted = [('<' + parameters.to)];
        }

        if(parameters.tab === 'favorites') {
            if(CurrentUser.xp && CurrentUser.xp.FavoriteOrders) {
                angular.extend(parameters.filters, {ID: CurrentUser.xp.FavoriteOrders.join('|')});
            }
        }

        if(parameters.tab === 'grouporders') {
            if(parameters.group) {
                return OrderCloudSDK.Me.ListAddresses(null, null, null, null, null, {CompanyName: parameters.group})
                    .then(function(address) {
                        var shippingAddressID = address.Items[0].ID;
                        return OrderCloudSDK.Me.ListOutgoingOrders(parameters.search, parameters.page, parameters.pageSize || 12, parameters.searchOn, parameters.sortBy, {ShippingAddressID: shippingAddressID, Status: parameters.status}, parameters.from, parameters.to)
                    });
            } else {
                return [];
            }
        }

        if(parameters.status){
            angular.extend(parameters.filters, {Status: parameters.status});
        }

        // list orders with generated parameters
        var listType = parameters.tab === 'approvals' ? 'ListIncomingOrders' : 'ListOutgoingOrders';
        return OrderCloudSDK.Me[listType](parameters.search, parameters.page, parameters.pageSize || 12, parameters.searchOn, parameters.sortBy, parameters.filters);
    }

    return service;
}