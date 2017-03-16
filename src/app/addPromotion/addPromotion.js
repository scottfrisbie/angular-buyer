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

function AddRebate(OrderCloud, $rootScope, $exceptionHandler, toastr) {
    //This Service is called from the base.js on CurrentOrder
    var service = {
        ApplyPromo: _apply
    };

    function _apply(order, catalogid, buyerid) {
        if(order.Total > 0) {
            return OrderCloud.Catalogs.Get(catalogid)
                .then(function(catalog) {
                    _.each(catalog.xp.AutoAppliedPromos, function(promo) {
                        OrderCloud.Promotions.List(null, null, null, null, null, {ID: promo})
                            .then(function(promotions) {
                                if(promotions.Items.length > 1) {
                                    _.each(promotions.Items, function(promotion) {
                                        return OrderCloud.Orders.AddPromotion(order.ID, promotion.Code)
                                    })
                                } else {
                                    return OrderCloud.Orders.AddPromotion(order.ID, promotions.Items[0].Code)
                                }
                                $rootScope.$broadcast('OC:UpdateOrder', order.ID);
                            })
                            .catch(function(ex) {
                                if(ex.status === 400) {
                                    if(order.PromotionDiscount !== order.Subtotal * .01) {
                                        return OrderCloud.Promotions.List(null, null, null, null, null, {ID: promo})
                                            .then(function(promotions) {
                                                _.each(promotions.Items, function(promo) {
                                                    return OrderCloud.Orders.RemovePromotion(order.ID, promo.Code, buyerid)
                                                        .then(function(newOrderData){
                                                            _apply(newOrderData, catalogid, buyerid);
                                                        })
                                                })
                                            })
                                    } else {
                                        angular.noop();
                                    }
                                } else {
                                    toastr.error('1% online order rebate not applied', 'Error');
                                    $exceptionHandler(ex);
                                }
                            })
                    })
                });
        } else {
            return order;
        }
    }
    return service;
}