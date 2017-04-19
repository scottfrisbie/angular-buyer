angular.module('orderCloud')
    .config(OrdersConfig)
;

function OrdersConfig($stateProvider) {
    $stateProvider
        .state('orders', {
            parent: 'account',
            templateUrl: 'orders/orderList/templates/orders.html',
            controller: 'OrdersCtrl',
            controllerAs: 'orders',
            data: {
                pageTitle: 'Orders'
            },
            url: '/orders?group&from&to&search&page&pageSize&searchOn&sortBy&tab?status',
            resolve: {
                Parameters: function($stateParams, ocParameters){
                    return ocParameters.Get($stateParams);
                },
                OrderList: function(Parameters, CurrentUser, ocOrders, Buyer) {
                    if (Parameters.status === undefined) Parameters.status = '!Unsubmitted';
                    return ocOrders.List(Parameters, CurrentUser, Buyer);

                },
                GroupAssignments: function($q, OrderCloud) {
                    return OrderCloudSDK.Me.ListAddresses()
                        .then(function(addresses) {
                            return OrderCloudSDK.Me.ListUserGroups()
                                .then(function(userGroups) {
                                    var userGroupsArr = [];
                                    _.each(addresses.Items, function(address) {
                                        userGroupsArr.push(_.findWhere(userGroups.Items, {ID: address.CompanyName}));
                                    });
                                    return _.compact(userGroupsArr);
                                });
                        });
                }
            }
        });
}