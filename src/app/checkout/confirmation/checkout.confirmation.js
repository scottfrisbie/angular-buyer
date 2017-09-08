angular.module('orderCloud')
	.config(checkoutConfirmationConfig)
	.controller('CheckoutConfirmationCtrl', CheckoutConfirmationController);

function checkoutConfirmationConfig($stateProvider) {
	$stateProvider
		.state('confirmation', {
			parent: 'base',
			url: '/confirmation/:orderid',
			templateUrl: 'checkout/confirmation/templates/checkout.confirmation.tpl.html',
			controller: 'CheckoutConfirmationCtrl',
			controllerAs: 'checkoutConfirmation',
			resolve: {
				SubmittedOrder: function($stateParams, OrderCloudSDK) {
					return OrderCloudSDK.Orders.Get('outgoing', $stateParams.orderid);
				},
				OrderShipAddress: function(SubmittedOrder, OrderCloudSDK){
					return OrderCloudSDK.Me.GetAddress(SubmittedOrder.ShippingAddressID);
				},
				OrderPromotions: function(SubmittedOrder, OrderCloudSDK) {
					return OrderCloudSDK.Orders.ListPromotions('outgoing', SubmittedOrder.ID);
				},
				OrderBillingAddress: function(SubmittedOrder, OrderCloudSDK){
					return OrderCloudSDK.Me.GetAddress(SubmittedOrder.BillingAddressID);
				},
				OrderPayments: function($q, SubmittedOrder, OrderCloudSDK) {
					var deferred = $q.defer();
					OrderCloudSDK.Payments.List('outgoing', SubmittedOrder.ID)
						.then(function(data) {
							var queue = [];
							angular.forEach(data.Items, function(payment, index) {
								if (payment.Type === 'CreditCard' && payment.CreditCardID) {
									queue.push((function() {
										var d = $q.defer();
										OrderCloudSDK.Me.GetCreditCard(payment.CreditCardID)
											.then(function(cc) {
												data.Items[index].Details = cc;
												d.resolve();
											});
										return d.promise;
									})());
								} else if (payment.Type === 'SpendingAccount' && payment.SpendingAccountID) {
									queue.push((function() {
										var d = $q.defer();
										OrderCloudSDK.Me.GetSpendingAccount(payment.SpendingAccountID)
											.then(function(cc) {
												data.Items[index].Details = cc;
												d.resolve();
											});
										return d.promise;
									})());
								}
							});
							$q.all(queue)
								.then(function() {
									deferred.resolve(data);
								})
						});

					return deferred.promise;
				},
				LineItemsList: function(SubmittedOrder, OrderCloudSDK) {
					return OrderCloudSDK.LineItems.List('outgoing', SubmittedOrder.ID);
				}
			}
		});
}

function CheckoutConfirmationController(SubmittedOrder, OrderShipAddress, OrderPromotions, OrderBillingAddress, OrderPayments, LineItemsList, rebateCode) {
	var vm = this;
	vm.order = SubmittedOrder;
	vm.shippingAddress = OrderShipAddress;
	vm.promotions = OrderPromotions.Items;
	vm.billingAddress = OrderBillingAddress;
	vm.payments = OrderPayments.Items;
	vm.lineItems = LineItemsList;
	vm.rebateCode = rebateCode;
}