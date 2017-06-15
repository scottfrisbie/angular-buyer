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
                    return ocOrders.List(Parameters, CurrentUser, Buyer);

                },
                GroupAssignments: function(OrderCloudSDK) {
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
                },
                CanSeeAllOrders: function(OrderCloudSDK){
                    return OrderCloudSDK.Me.ListUserGroups({search: 'CanViewAllOrders', searchOn: 'ID', pageSize: 1})
                        .then(function(userGroupList){
                            return userGroupList.Items.length > 0;
                        });
                }
            }
        });
}