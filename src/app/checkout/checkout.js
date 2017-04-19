angular.module('orderCloud')
	.config(checkoutConfig)
	.controller('CheckoutCtrl', CheckoutController)
    .factory('AddressSelectModal', AddressSelectModalService)
    .controller('AddressSelectCtrl', AddressSelectController)
    .constant('CheckoutConfig', {
        ShippingRates: true,
        TaxRates: false,
        AvailablePaymentMethods: ['PurchaseOrder', 'CreditCard', 'SpendingAccount']
    })
;

function checkoutConfig($urlRouterProvider, $stateProvider) {
    $urlRouterProvider.when('/checkout', '/checkout/shipping');
	$stateProvider
		.state('checkout', {
            abstract:true,
			parent: 'base',
			url: '/checkout',
			templateUrl: 'checkout/templates/checkout.tpl.html',
			controller: 'CheckoutCtrl',
			controllerAs: 'checkout',
			resolve: {
                OrderShipAddress: function($q, OrderCloudSDK, CurrentOrder){
                    var deferred = $q.defer();
                    if (CurrentOrder.ShippingAddressID) {
                        OrderCloudSDK.Me.GetAddress(CurrentOrder.ShippingAddressID)
                            .then(function(address) {
                                OrderCloudSDK.Orders.Patch('Outgoing', CurrentOrder.ID, {xp: {CustomerNumber: address.CompanyName}})
                                    .then(function(){
                                        deferred.resolve(address);
                                    });
                            })
                            .catch(function(ex) {
                                deferred.resolve(null);
                            });
                    }
                    else {
                        deferred.resolve(null);
                    }

                    return deferred.promise;
                },
                CurrentPromotions: function(CurrentOrder, OrderCloudSDK) {
                    return OrderCloudSDK.Orders.ListPromotions('Outgoing', CurrentOrder.ID);
                },
                OrderBillingAddress: function($q, OrderCloudSDK, CurrentOrder){
                    var deferred = $q.defer();

                    if (CurrentOrder.BillingAddressID) {
                        OrderCloudSDK.Me.GetAddress(CurrentOrder.BillingAddressID)
                            .then(function(address) {
                                deferred.resolve(address);
                            })
                            .catch(function(ex) {
                                deferred.resolve(null);
                            });
                    }
                    else {
                        deferred.resolve(null);
                    }
                    return deferred.promise;
                },
                CurrentUserAddresses: function(OrderCloudSDK) {
                    return OrderCloudSDK.Me.ListAddresses(null, null, null, null, null, {Shipping: true});
                }
			}
		})
    ;
}

function CheckoutController($state, $exceptionHandler, $rootScope, toastr, OrderCloudSDK, OrderShipAddress, CurrentUserAddresses, CurrentPromotions, OrderBillingAddress, CheckoutConfig, ocMandrill) {

    var vm = this;
    vm.shippingAddress = OrderShipAddress;
    vm.userAddresses = CurrentUserAddresses;
    vm.billingAddress = OrderBillingAddress;
    vm.promotions = CurrentPromotions.Items;
    vm.checkoutConfig = CheckoutConfig;
    vm.currentUserAddresses = CurrentUserAddresses;

    vm.submitOrder = function(order){
        vm.orderLoading = OrderCloudSDK.Payments.List(order.ID, null, null, null, null, null, {Type: 'SpendingAccount'})
            .then(function(paymentList){
                var payment = paymentList.Items[0];
                if(payment && payment.SpendingAccountID){
                    return OrderCloudSDK.SpendingAccounts.Get(payment.SpendingAccountID)
                        .then(function(budget){
                            if( budget && budget.Balance < 0){
                                //send email alerting negative balance
                                order.BudgetBalance = budget.Balance;
                                order.BugetBalanceName = budget.Name;
                                return submitAndAlert(order);
                            } else {
                                return finalSubmit(order);
                            }
                        });
                } else {
                    return finalSubmit(order);
                }
            });
    };

    function submitAndAlert(order){
        return OrderCloudSDK.UserGroups.Get(order.xp.CustomerNumber)
            .then(function(userGroup){
                return OrderCloudSDK.UserGroups.ListUserAssignments(userGroup.xp.LevelBlueGroup, null, null, 100)
                    .then(function(userGroupList){
                        var userIDs = _.pluck(userGroupList.Items, 'UserID');
                        return OrderCloudSDK.Users.List(null, null, null, 100, null, null, {ID: userIDs.join('|')})
                            .then(function(userList){
                                return ocMandrill.NegativeBalance(userList, order)
                                    .then(function(){
                                        return finalSubmit(order);
                                    });
                            });
                    });
            });
    }

    function finalSubmit(order) {
        return OrderCloudSDK.Orders.Submit('Outgoing', order.ID)
            .then(function(order) {
                $state.go('confirmation', {orderid:order.ID}, {reload:'base'});
                return toastr.success('Your order has been submitted', 'Success');
            })
            .catch(function(ex) {
                return toastr.error('Your order did not submit successfully.', 'Error');
            });
    }
    
    $rootScope.$on('OC:OrderShipAddressUpdated', function(event, order) {
        OrderCloudSDK.Me.GetAddress(order.ShippingAddressID)
            .then(function(address){
                vm.shippingAddress = address;
            });
    });

    $rootScope.$on('OC:OrderBillAddressUpdated', function(event, order){
        OrderCloudSDK.Me.GetAddress(order.BillingAddressID)
            .then(function(address){
                vm.billingAddress = address;
            });
    });

    vm.removePromotion = function(order, promotion) {
        OrderCloudSDK.Orders.RemovePromotion('Outgoing', order.ID, promotion.Code)
            .then(function() {
                $rootScope.$broadcast('OC:UpdatePromotions', order.ID);
            })
    };

    $rootScope.$on('OC:UpdatePromotions', function(event, orderid) {
        OrderCloudSDK.Orders.ListPromotions('Outgoing', orderid)
            .then(function(data) {
                if (data.Meta) {
                    vm.promotions = data.Items;
                } else {
                    vm.promotions = data;
                }
                $rootScope.$broadcast('OC:UpdateOrder', orderid);
            })
    });
}

function AddressSelectModalService($uibModal) {
    var service = {
        Open: _open
    };

    function _open(type) {
        return $uibModal.open({
            templateUrl: 'checkout/templates/addressSelect.modal.tpl.html',
            controller: 'AddressSelectCtrl',
            controllerAs: 'addressSelect',
            backdrop: 'static',
            size: 'md',
            resolve: {
                Addresses: function(OrderCloudSDK) {
                    if (type == 'shipping') {
                        return OrderCloudSDK.Me.ListAddresses(null, 1, 100, null, null, {Shipping: true});
                    } else if (type == 'billing') {
                        return OrderCloudSDK.Me.ListAddresses(null, 1, 100, null, null, {Billing: true});
                    } else {
                        return OrderCloudSDK.Me.ListAddresses(null, 1, 100);
                    }
                }
            }
        }).result;
    }

    return service;
}

function AddressSelectController($uibModalInstance, Addresses) {
    var vm = this;
    vm.addresses = Addresses.Items;

    vm.select = function (address) {
        $uibModalInstance.close(address);
    };

    vm.createAddress = function() {
        $uibModalInstance.close('create');
    };

    vm.cancel = function () {
        $uibModalInstance.dismiss();
    };
}