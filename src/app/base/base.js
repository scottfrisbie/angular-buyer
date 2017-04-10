angular.module('orderCloud')
    .config(BaseConfig)
    .controller('BaseCtrl', BaseController)
    .factory('NewOrder', NewOrderService)
;

function BaseConfig($stateProvider) {
    $stateProvider.state('base', {
        url: '',
        abstract: true,
        views: {
            '': {
                templateUrl: 'base/templates/base.tpl.html',
                controller: 'BaseCtrl',
                controllerAs: 'base'
            },
            'nav@base': {
                'templateUrl': 'base/templates/navigation.tpl.html'
            }
        },
        resolve: {
            Buyer: function(OrderCloud){
                return OrderCloud.Buyers.List(null, 1, 1)
                    .then(function(buyerList){
                        var buyer = buyerList.Items[0];
                        OrderCloud.BuyerID.Set(buyer.ID);
                        OrderCloud.CatalogID.Set(buyer.DefaultCatalogID);
                        return buyer;
                    });
            },
            Catalog: function(OrderCloud, Buyer){
                return OrderCloud.Catalogs.Get(Buyer.DefaultCatalogID);
            },
            CurrentUser: function($q, $state, OrderCloud) {
                return OrderCloud.Me.Get();
            },
            ExistingOrder: function($q, OrderCloud, CurrentUser, Catalog) {
                return OrderCloud.Me.ListOutgoingOrders(null, 1, 1, null, "!DateCreated", {Status:"Unsubmitted"})
                    .then(function(data) {
                        return data.Items[0];
                    });
            },
            CurrentOrder: function(ExistingOrder, NewOrder) {
                if (!ExistingOrder) {
                    return NewOrder.Create({});
                } else {
                    return ExistingOrder;
                }
            },
            AnonymousUser: function($q, OrderCloud, CurrentUser) {
                CurrentUser.Anonymous = angular.isDefined(JSON.parse(atob(OrderCloud.Auth.ReadToken().split('.')[1])).orderid);
            }
        }
    });
}

function BaseController($rootScope, $state, ProductSearch, CurrentUser, CurrentOrder,  OrderCloud) {
    var vm = this;
    vm.currentUser = CurrentUser;
    vm.currentOrder = CurrentOrder;

    vm.mobileSearch = function() {
        ProductSearch.Open()
            .then(function(data) {
                if (data.productID) {
                    $state.go('productDetail', {productid: data.productID});
                } else {
                    $state.go('productSearchResults', {searchTerm: data.searchTerm});
                }
            });
    };

    $rootScope.$on('OC:UpdateOrder', function(event, OrderID, message) {
        vm.orderLoading = {
            message: message
        };
        vm.orderLoading.promise = OrderCloud.Orders.Get(OrderID)
            .then(function(data) {
                vm.currentOrder = data;
            });
    });
}

function NewOrderService($q, OrderCloud) {
    var service = {
        Create: _create
    };

    function _create() {
        var deferred = $q.defer();
        var order = {};

        //ShippingAddressID
        OrderCloud.Me.ListAddresses(null, 1, 100, null, null, {Shipping: true})
            .then(function(shippingAddresses) {
                if (shippingAddresses.Items.length) order.ShippingAddressID = shippingAddresses.Items[0].ID;
                setBillingAddress();
            });

        //BillingAddressID
        function setBillingAddress() {
            OrderCloud.Me.ListAddresses(null, 1, 100, null, null, {Billing: true})
                .then(function(billingAddresses) {
                    if (billingAddresses.Items.length) order.BillingAddressID = billingAddresses.Items[0].ID;
                    createOrder();
                });
        }

        function createOrder() {
            order.xp = {
                ExpeditedShipping: "ground",
                sellerOrderID: 0
            };
            OrderCloud.Orders.Create(order)
                .then(function(order) {
                    var attempt = 0;
                    generateOrderNumber(order); //generates an order number in the form WXXXXXXX
                    
                    function generateOrderNumber(order){
                        var orderNumber = Math.floor((1000000 + Math.random() * 9000000)); //random # length 7 digits
                        OrderCloud.Orders.Patch(order.ID, {ID: 'W' + orderNumber})
                            .then(function(newOrder){
                                deferred.resolve(newOrder);
                            })
                            .catch(function(error){
                                if(attempt > 3) {
                                    deferred.resolve();
                                } else {
                                    //there was a conflict, generate a new random # and try again
                                    attempt++;
                                    generateOrderNumber(); 
                                }
                            });
                        }
                });
        }

        

        return deferred.promise;
    }

    return service;
}
