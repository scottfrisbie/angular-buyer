angular.module('orderCloud')
    .factory('AddRebate', AddRebate)
    .component('ocAddPromotion', {
        templateUrl: 'addPromotion/templates/addPromotion.tpl.html',
        bindings: {
            order: '<'
        },
        controller: AddPromotionComponentCtrl
    });

function AddPromotionComponentCtrl($exceptionHandler, $rootScope, OrderCloud, toastr) {
    this.submit = function(orderID, promoCode) {
        OrderCloud.Orders.AddPromotion(orderID, promoCode)
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

function AddRebate(OrderCloud, $rootScope, buyerid, rebateCode) {
    //This Service is called from the base.js on CurrentOrder
    var service = {
        ApplyPromo: _apply
    };

    function _apply(order) {
        if (order.Total > 0) {
            return OrderCloud.Orders.ListPromotions(order.ID)
                .then(function (promos) {
                        if (promos.Items.length) {
                            return OrderCloud.Orders.RemovePromotion(order.ID, rebateCode, buyerid)
                                .then(function (updatedOrder) {
                                    return OrderCloud.Orders.AddPromotion(updatedOrder.ID, rebateCode, buyerid)
                                        .then(function() {
                                            $rootScope.$broadcast('OC:UpdatePromotions', order.ID);
                                            $rootScope.$broadcast('OC:UpdateOrder', order.ID);
                                        })
                                })
                        } else {
                            return OrderCloud.Orders.AddPromotion(order.ID, rebateCode, buyerid)
                                .then(function (order) {
                                    $rootScope.$broadcast('OC:UpdateOrder', order.ID);
                                })
                        }
                    }
                )

        }
    }
    return service;
}