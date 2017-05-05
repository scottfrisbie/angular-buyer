angular.module('orderCloud')
	.controller('CheckoutPaymentCtrl', CheckoutPaymentController)
;

function CheckoutPaymentController($exceptionHandler, $rootScope, OrderCloudSDK, AddressSelectModal) {
	var vm = this;
    vm.changeBillingAddress = changeBillingAddress;

    function changeBillingAddress(order) {
        AddressSelectModal.Open('billing')
            .then(function(address) {
               order.BillingAddressID = address.ID;
                saveBillingAddress(order);
            });
    }

    function saveBillingAddress(order) {
        if (order && order.BillingAddressID) {
            OrderCloudSDK.Orders.Patch('outgoing', order.ID, {BillingAddressID: order.BillingAddressID})
                .then(function(updatedOrder) {
                    $rootScope.$broadcast('OC:OrderBillAddressUpdated', updatedOrder);
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                });
        }
    }
}