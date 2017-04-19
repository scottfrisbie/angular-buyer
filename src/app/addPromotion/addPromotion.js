angular.module('orderCloud')
    .factory('AddRebate', AddRebate)
    .component('ocAddPromotion', {
        templateUrl: 'addPromotion/templates/addPromotion.tpl.html',
        bindings: {
            order: '<'
        },
        controller: AddPromotionComponentCtrl
    });

function AddPromotionComponentCtrl($exceptionHandler, $rootScope, OrderCloudSDK, toastr) {
    this.submit = function(orderID, promoCode) {
        OrderCloudSDK.Orders.AddPromotion('Outgoing', orderID, promoCode)
            .then(function(promo) {
                $rootScope.$broadcast('OC:UpdatePromotions', orderID);
                $rootScope.$broadcast('OC:UpdateOrder', orderID);
                toastr.success('Promo code '+ promo.Code + ' added!', 'Success');
            })
            .catch(function(err) {
                $exceptionHandler(err);
            });
    };
}

function AddRebate(OrderCloudSDK, $rootScope, rebateCode, $q) {
    //This Service is called from the base.js on CurrentOrder
    var service = {
        ApplyPromo: _apply
    };

    function _apply(order) {
        if (order.Total > 0) {
            return OrderCloudSDK.Orders.ListPromotions('Outgoing', order.ID)
                .then(function (promos) {
                        if (promos.Items.length) {
                            return OrderCloudSDK.Orders.RemovePromotion('Outgoing', order.ID, rebateCode)
                                .then(function (updatedOrder) {
                                    return OrderCloudSDK.Orders.AddPromotion('Outgoing', updatedOrder.ID, rebateCode)
                                        .then(function() {
                                            $rootScope.$broadcast('OC:UpdatePromotions', order.ID);
                                            $rootScope.$broadcast('OC:UpdateOrder', order.ID);
                                            return order;
                                        });
                                });
                        } else {
                            return OrderCloudSDK.Orders.AddPromotion('Outgoing', order.ID, rebateCode)
                                .then(function () {
                                    return OrderCloudSDK.Orders.Patch('Outgoing', order.ID, order)
                                        .then(function(orderData) {
                                            $rootScope.$broadcast('OC:UpdateOrder', orderData.ID);
                                            return orderData;
                                        });
                                });
                        }
                    }
                );

        } else {
            return $q.when(order);
        }
    }
    return service;
}