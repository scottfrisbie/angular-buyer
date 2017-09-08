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
                },
                IsMyOrder: function (OrderCloudSDK, $stateParams){
                    //display reorder and favorite order buttons if this is currently authenticated user's order
                    return OrderCloudSDK.Me.ListOrders({search: $stateParams.orderid, searchOn: 'ID', pageSize: 1})
                        .then(function(orderList){
                            return orderList.Items.length > 0;
                        });
                }
            }
        });
}