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
                GroupAssignments: function(OrderCloudSDK, ocUtility) {
                    return ocUtility.ListAll(OrderCloudSDK.Me.ListUserGroups, {pageSize: 100, page: 'page', filters: {ID: '!CanViewAllOrders'}})
                        .then(function(userGroups) {
                            return userGroups.Items;
                    });
                },
                CanSeeAllOrders: function(OrderCloudSDK){
                    return OrderCloudSDK.Me.ListUserGroups({search: 'CanViewAllOrders', searchOn: 'ID', pageSize: 1})
                        .then(function(userGroupList){
                            return userGroupList.Items.length > 0;
                        });
                },
                Stores: function($q, OrderCloudSDK, GroupAssignments, OrderList, Buyer, CanSeeAllOrders){
                    var addressIds = _.uniq(_.pluck(OrderList.Items, 'ShippingAddressID'));
                    return OrderCloudSDK.Addresses.List(Buyer.ID, {filters: {ID: addressIds.join('|')}})
                        .then(function(addressList){
                            var queue = [];
                            if(CanSeeAllOrders){
                                var usergroupIds = _.pluck(addressList.Items, 'CompanyName');
                                queue.push(function(){
                                    return OrderCloudSDK.UserGroups.List(Buyer.ID, {filters: {ID: usergroupIds.join('|')}})
                                        .then(function(group){
                                            return group.Items;
                                        });
                                }());
                            } else {
                                queue.push(GroupAssignments);
                            }
                            return $q.all(queue)
                                .then(function(locations){
                                    var stores = {};
                                    _.each(addressList.Items, function(address){
                                        var group = _.findWhere(locations[0], {ID: address.CompanyName});
                                        if(group){
                                            stores[address.ID] = address;
                                        }
                                    });
                                    return stores;
                                });
                        });
                }
            }
        });
}