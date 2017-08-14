angular.module('orderCloud')
	.config(checkoutConfig)
	.controller('CheckoutCtrl', CheckoutController)
    .factory('AddressSelectModal', AddressSelectModalService)
    .controller('AddressSelectCtrl', AddressSelectController)
    .constant('CheckoutConfig', {
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
                                OrderCloudSDK.Orders.Patch('outgoing', CurrentOrder.ID, {xp: {CustomerNumber: address.CompanyName}})
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
                    return OrderCloudSDK.Orders.ListPromotions('outgoing', CurrentOrder.ID);
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
                    return OrderCloudSDK.Me.ListAddresses({filters: {Shipping: true}});
                },
                SpendingAccount: function(OrderCloudSDK){
                    return OrderCloudSDK.Me.ListSpendingAccounts()
                        .then(function(spendingAccounts){
                            return spendingAccounts.Items[0];
                        });
                }
			}
		})
    ;
}

function CheckoutController($state, $rootScope, $exceptionHandler, toastr, OrderCloudSDK, OrderShipAddress, 
CurrentUserAddresses, CurrentPromotions, OrderBillingAddress, SpendingAccount, CheckoutConfig, 
ocMandrill, Buyer) {

    var vm = this;
    vm.shippingAddress = OrderShipAddress;
    vm.userAddresses = CurrentUserAddresses;
    vm.billingAddress = OrderBillingAddress;
    vm.promotions = CurrentPromotions.Items;
    vm.checkoutConfig = CheckoutConfig;
    vm.currentUserAddresses = CurrentUserAddresses;
    vm.spendingAccount = SpendingAccount;
    vm.buyer = Buyer;

    vm.submitOrder = function(order) {
        vm.orderLoading = OrderCloudSDK.Payments.List('outgoing', order.ID, {filters: {Type: 'SpendingAccount'}})
            .then(function(paymentList){
                var payment = paymentList.Items[0];
                if(payment && payment.SpendingAccountID){
                    return OrderCloudSDK.Me.GetSpendingAccount(payment.SpendingAccountID)
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
        return OrderCloudSDK.UserGroups.Get(vm.buyer.ID, order.xp.CustomerNumber)
            .then(function(userGroup){
                return OrderCloudSDK.UserGroups.ListUserAssignments(vm.buyer.ID, {pageSize: 100, userGroupID: userGroup.xp.LevelBlueGroup})
                    .then(function(userGroupList){
                        var userIDs = _.pluck(userGroupList.Items, 'UserID');
                        return OrderCloudSDK.Users.List(vm.buyer.ID, {pageSize: 100, filters: {ID: userIDs.join('|')}})
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
        return OrderCloudSDK.Orders.Submit('outgoing', order.ID)
            .then(function(orderData) {
                return OrderCloudSDK.Orders.Patch('outgoing', orderData.ID, {xp: {POID: order.xp.POID}})
                    .then(function() {
                        $state.go('confirmation', {orderid:orderData.ID}, {reload:'base'});
                        return toastr.success('Your order has been submitted', 'Success');
                    })
                    .catch(function(ex) {
                        $exceptionHandler(ex);
                    });
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    }
    
    $rootScope.$on('OC:OrderShipAddressUpdated', function(event, order) {
        return OrderCloudSDK.Me.GetAddress(order.ShippingAddressID)
            .then(function(address){
                vm.shippingAddress = address;
            });
    });

    $rootScope.$on('OC:OrderBillAddressUpdated', function(event, order){
        return OrderCloudSDK.Me.GetAddress(order.BillingAddressID)
            .then(function(address){
                vm.billingAddress = address;
            });
    });

    vm.removePromotion = function(order, promotion) {
        return OrderCloudSDK.Orders.RemovePromotion('outgoing', order.ID, promotion.Code)
            .then(function() {
                $rootScope.$broadcast('OC:UpdatePromotions', order.ID);
            });
    };

    $rootScope.$on('OC:UpdatePromotions', function(event, orderid) {
        OrderCloudSDK.Orders.ListPromotions('outgoing', orderid)
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

function AddressSelectModalService($uibModal, OrderCloudSDK) {
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
                Addresses: function() {
                    var options = {
                        filters: type === 'shipping' ? {Shipping: true} : {Billing: true}
                    }
                    return OrderCloudSDK.Me.ListAddresses(options);
                }
            }
        }).result;
    }

    return service;
}

function AddressSelectController($state, $uibModalInstance, Addresses, OrderCloudSDK) {
    var vm = this;
    vm.addresses = Addresses;

    vm.pageChanged = function() {
        var options = {
            page: vm.addresses.Meta.Page,
            filters: vm.addresses.Items[0].Shipping ? {Shipping: true} : {Billing: true}
        }
        return OrderCloudSDK.Me.ListAddresses(options)
            .then(function(newAddresses) {
                vm.addresses = newAddresses;
            });
    };

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