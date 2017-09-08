angular.module('orderCloud')
	//Single Payment, Multiple Types
	.directive('ocPayment', OrderCloudPaymentDirective)
;

function OrderCloudPaymentDirective() {
	return {
		restrict:'E',
		scope: {
			order: '=',
			payment: '=?',
			paymentIndex: '=?',
			excludeOptions: '=?',
			spendingacct: '=?'
		},
		templateUrl: 'checkout/payment/directives/templates/payment.html',
		controller: 'PaymentCtrl',
		controllerAs: 'ocPayment'
	}
}