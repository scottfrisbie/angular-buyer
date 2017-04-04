angular.module('orderCloud')
	.config(checkoutPaymentConfig)
	.controller('CheckoutPaymentCtrl', CheckoutPaymentController)
    .factory('CheckoutPaymentService', CheckoutPaymentService)
;

function checkoutPaymentConfig($stateProvider) {
	$stateProvider
		.state('checkout.payment', {
			url: '/payment',
			templateUrl: 'checkout/payment/templates/checkout.payment.tpl.html',
			controller: 'CheckoutPaymentCtrl',
			controllerAs: 'checkoutPayment',
            resolve: {
                InitializeTaxes: function(TaxIntegration, CurrentOrder, OrderCloud, $rootScope){
                    return OrderCloud.LineItems.List(CurrentOrder.ID, null, null, 100)
                        .then(function(LineItemList){
                            return TaxIntegration.Get(CurrentOrder.BillingAddress, LineItemList)
                                .then(function(data){
                                    return OrderCloud.Orders.Patch(CurrentOrder.ID, {TaxCost: data.Data.TotalTax})
                                        .then(function(){
                                            $rootScope.$broadcast('OC:UpdateOrder', CurrentOrder.ID);
                                        });
                                });
                        });
				}
            }
		})
    ;
}

function CheckoutPaymentController(rebateCode) {
	var vm = this;

    vm.rebateCode = rebateCode;
}

function CheckoutPaymentService($q, OrderCloud) {
    var service = {
        PaymentsExceedTotal: _paymentsExceedTotal,
        RemoveAllPayments: _removeAllPayments
    };

    function _paymentsExceedTotal(payments, orderTotal) {
        var paymentTotal = 0;
        angular.forEach(payments.Items, function(payment) {
            paymentTotal += payment.Amount;
        });

        return paymentTotal.toFixed(2) > orderTotal.toFixed(2);
    }

    function _removeAllPayments(payments, order) {
        var deferred = $q.defer();

        var queue = [];
        angular.forEach(payments.Items, function(payment) {
            queue.push(OrderCloud.Payments.Delete(order.ID, payment.ID));
        });

        $q.all(queue).then(function() {
            deferred.resolve();
        });

        return deferred.promise;
    }

    return service;
}
