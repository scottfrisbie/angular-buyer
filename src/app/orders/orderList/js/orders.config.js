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
                GroupAssignments: function(OrderCloud) {
                    return OrderCloud.Me.ListUserGroups();
                },
                OrderList: function(Parameters, CurrentUser, ocOrders, Buyer) {
                    if (Parameters.status === undefined) Parameters.status = '!Unsubmitted';
                    if (Parameters.group) {
                        return ocOrders.List(Parameters, CurrentUser, Buyer, Parameters.group);
                    } else {
                        return ocOrders.List(Parameters, CurrentUser, Buyer);
                    }
                }
            }
        });
}