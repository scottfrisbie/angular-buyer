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
                    return OrderCloud.Me.ListAddresses()
                        .then(function(addresses) {
                            var queue = [];
                            _.each(addresses.Items, function(address) {
                                queue.push(function() {
                                    return OrderCloud.Me.ListUserGroups(null, null, null, null, null, {ID: address.CompanyName})
                                        .then(function(userGroup) {
                                            return userGroup.Items[0];
                                        });
                                }());
                            });
                            return $q.all(queue)
                                .then(function(userGroups) {
                                    return _.compact(userGroups)
                                })
                        })
                }
            }
        });
}