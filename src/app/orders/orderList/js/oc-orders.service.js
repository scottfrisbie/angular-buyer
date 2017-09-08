angular.module('orderCloud')
    .factory('ocOrders', ocOrdersService)
;

function ocOrdersService(OrderCloudSDK, toastr, $log){
    var service = {
        List: _list
    };
    
    function _list(Parameters, CurrentUser){
        var parameters = angular.copy(Parameters);

        //exclude unsubmitted orders from list
        //parameters.filters = {Status: '!Unsubmitted'};  //TODO: replace this line with below once api can reverse filter enums (EX-1166)
        parameters.filters = {Status: 'Open|AwaitingApproval|Canceled|Completed|Declined'};

        if(parameters.status){
            angular.extend(parameters.filters, {Status: parameters.status});
        }

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
                var options = {
                    filters: {
                        CompanyName: parameters.group
                    }
                };
                return OrderCloudSDK.Me.ListAddresses(options)
                    .then(function(addresses) {
                        var shippingAddress = addresses.Items[0];
                        if(!shippingAddress) {
                            $log.error('Unable to find an address with CompanyName: ' + parameters.group + '. There must be an address.CompanyName corresponding to this userGroup.ID (' + parameters.group + ')');
                            return toastr.error('Store not configured correctly - please alert an administrator');
                        }
                        angular.extend(parameters.filters, {ShippingAddressID: shippingAddress.ID});
                        return OrderCloudSDK.Orders.List('Outgoing', parameters);
                    });
            } else {
                return [];
            }
        }

        // list orders with generated parameters
        if(parameters.tab === 'approvals') {
            return OrderCloudSDK.Me.ListApprovableOrders(parameters);
        } else if(parameters.tab === 'all') {
            return OrderCloudSDK.Orders.List('outgoing', parameters);
        } else {
            return OrderCloudSDK.Me.ListOrders(parameters);
        }
    }

    return service;
}