angular.module('orderCloud')
    .config(OrderDetailConfig)
;

function OrderDetailConfig($stateProvider){
    $stateProvider
        .state('orderDetail', {
            url: '/order/:orderid',
            parent: 'account',
            templateUrl: 'orders/orderDetails/templates/orderDetails.html',
            controller: 'OrderDetailsCtrl',
            controllerAs: 'orderDetails',
             data: {
                pageTitle: 'Order'
            },
            resolve: {
                SelectedOrder: function($stateParams, ocOrderDetails){
                    return ocOrderDetails.Get($stateParams.orderid);
                },
                OrderLineItems: function($stateParams, OrderCloudSDK){
                    return OrderCloudSDK.LineItems.List('outgoing', $stateParams.orderid);
                },
                Shipments: function($stateParams, OrderCloudSDK){
                    return OrderCloudSDK.Shipments.List({orderID: $stateParams.orderid});
                }
            }
        });
}