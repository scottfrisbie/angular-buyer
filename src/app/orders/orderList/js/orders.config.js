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
            url: '/orders?from&to&search&page&pageSize&searchOn&sortBy&tab?status',
            resolve: {
                Parameters: function($stateParams, ocParameters){
                    return ocParameters.Get($stateParams);
                },
                GroupAssignments: function(OrderCloud) {
                    return OrderCloud.Me.ListUserGroups()
                        .then(function(userGroups) {
                            return userGroups
                        });
                },
                OrderList: function(Parameters, CurrentUser, ocOrders, Buyer) {
                    return ocOrders.List(Parameters, CurrentUser, Buyer);
                }
            }
        });
}