angular.module('orderCloud')
    .config(CartConfig)
    .controller('CartCtrl', CartController)
;

function CartConfig($stateProvider) {
    $stateProvider
        .state('cart', {
            parent: 'base',
            url: '/cart',
            templateUrl: 'cart/templates/cart.tpl.html',
            controller: 'CartCtrl',
            controllerAs: 'cart',
            data: {
                pageTitle: "Shopping Cart"
            },
            resolve: {
                LineItemsList: function(OrderCloudSDK, CurrentOrder) {
                    return OrderCloudSDK.LineItems.List('outgoing', CurrentOrder.ID);
                },
                CurrentPromotions: function(CurrentOrder, OrderCloudSDK, AddRebate) {
                    return AddRebate.ApplyPromo(CurrentOrder)
                        .then(function(){
                            return OrderCloudSDK.Orders.ListPromotions('outgoing', CurrentOrder.ID);
                        });
                }
            }
        });
}

function CartController($rootScope, $state, toastr, OrderCloudSDK, LineItemsList, CurrentPromotions, CurrentOrder, ocConfirm, AddRebate, rebateCode) {
    var vm = this;
    vm.lineItems = LineItemsList;
    vm.promotions = CurrentPromotions.Meta ? CurrentPromotions.Items : CurrentPromotions;
    vm.rebateCode = rebateCode;

    vm.updatePromo = updatePromo;
    vm.removeItem = removeItem;
    vm.removePromotion = removePromotion;
    vm.cancelOrder = cancelOrder;

    function updatePromo(){
        return AddRebate.ApplyPromo(CurrentOrder);
    }

    function removeItem(order, scope) {
        vm.lineLoading = [];
        vm.lineLoading[scope.$index] = OrderCloudSDK.LineItems.Delete('outgoing', order.ID, scope.lineItem.ID)
            .then(function () {
                var index = _.pluck(vm.lineItems, 'ID').indexOf(scope.lineItem.ID);
                vm.lineItems.Items.splice(index, 1);
                $rootScope.$broadcast('OC:UpdateOrder', order.ID);
                return AddRebate.ApplyPromo(order)
                    .then(function() {
                        $rootScope.$broadcast('OC:UpdateOrder', order.ID);
                        toastr.success('Line Item Removed');
                    });
            });
    }

    //TODO: missing unit tests
    function removePromotion(order, scope) {
        OrderCloudSDK.Orders.RemovePromotion('outgoing', order.ID, scope.promotion.Code)
            .then(function() {
                $rootScope.$broadcast('OC:UpdateOrder', order.ID);
                vm.promotions.splice(scope.$index, 1);
            });
    }

    function cancelOrder(order){
        return ocConfirm.Confirm({
                message:'Are you sure you want to cancel this order?',
                confirmText: 'Yes, cancel order',
                type: 'delete'})
            .then(function() {
                return OrderCloudSDK.Orders.RemovePromotion('outgoing', order.ID, vm.rebateCode)
                    .then(function() {
                        $rootScope.$broadcast('OC:UpdatePromotions', order.ID);
                        return OrderCloudSDK.Orders.Delete('outgoing', order.ID)
                            .then(function(){
                                $state.go("home",{}, {reload:'base'})
                            });
                    })
            });
    }

    //TODO: missing unit tests
    $rootScope.$on('OC:UpdatePromotions', function(event, orderid) {
        return OrderCloudSDK.Orders.ListPromotions('outgoing', orderid)
            .then(function(data) {
                if (data.Meta) {
                    vm.promotions = data.Items;
                } else {
                    vm.promotions = data;
                }
            });
    });
}
