angular.module('orderCloud')
    .config(checkoutShippingConfig)
    .controller('CheckoutShippingCtrl', CheckoutShippingController);

function checkoutShippingConfig($stateProvider) {
    $stateProvider
        .state('checkout.shipping', {
            url: '/shipping',
            templateUrl: 'checkout/shipping/templates/checkout.shipping.tpl.html',
            controller: 'CheckoutShippingCtrl',
            controllerAs: 'checkoutShipping'
        });
}

function CheckoutShippingController($exceptionHandler, $rootScope, OrderCloudSDK, CurrentOrder, CurrentUser, AddressSelectModal, CheckoutConfig, rebateCode) {
    var vm = this;

    vm.rebateCode = rebateCode;
    vm.order = CurrentOrder;
    vm.user = CurrentUser;
    vm.changeShippingAddress = changeShippingAddress;
    vm.saveShipAddress = saveShipAddress;
    vm.toggleShipping = toggleShipping;

    function changeShippingAddress(order) {
        AddressSelectModal.Open('shipping', vm.user)
            .then(function(address) {
                if (address == 'create') {
                    vm.createAddress(order);
                } else {
                    order.ShippingAddressID = address.ID;
                    vm.saveShipAddress(order, address);
                }
            })
    }

    function saveShipAddress(order, address) {
        if (order && order.ShippingAddressID) {
            OrderCloudSDK.Orders.Patch('Outgoing', order.ID, {ShippingAddressID: order.ShippingAddressID, xp: {CustomerNumber: address.CompanyName}})
                .then(function(updatedOrder) {
                    $rootScope.$broadcast('OC:OrderShipAddressUpdated', updatedOrder);
                    vm.getShippingRates(order);
                })
                .catch(function(ex){
                    $exceptionHandler(ex);
                });
        }
    }

    function toggleShipping(opt) {
        OrderCloudSDK.Orders.Patch('Outgoing', vm.order.ID, {xp: {ExpeditedShipping: opt}})
            .then(function(updatedOrder) {
                $rootScope.$broadcast('OC:UpdateOrder', updatedOrder.ID);
            })
    }
}