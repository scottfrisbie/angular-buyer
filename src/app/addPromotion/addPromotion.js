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

function AddRebate(OrderCloud, $rootScope) {
    var service = {
        ApplyPromo: _apply
    };

    function _apply(order) {
        return OrderCloud.Promotions.List(null, null, null, null, null, {ID: 'OnePercentRebate'})
            .then(function(promos) {
                var promo = promos.Items[0];
                return OrderCloud.Orders.AddPromotion(order.ID, promo.Code)
                    .then(function() {
                        $rootScope.$broadcast('OC:UpdateOrder', order.ID);
                    })
            })
    }

    return service;
}