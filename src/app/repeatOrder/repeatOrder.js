angular.module('orderCloud')
    .factory('RepeatOrderFactory', RepeatOrderFactory)
    .controller('RepeatOrderCtrl', RepeatOrderCtrl)
    .controller('RepeatOrderModalCtrl', RepeatOrderModalCtrl)
    .component('ordercloudRepeatOrder', {
        templateUrl: 'repeatOrder/templates/repeatOrder.component.html',
        controller: RepeatOrderCtrl,
        bindings: {
            currentOrderId: '<',
            originalOrderId: '<'
        }
    });

function RepeatOrderCtrl(toastr, RepeatOrderFactory, $uibModal) {
    var vm = this;

    vm.$onInit = function() {
        if (vm.orderid === 'undefined') toastr.error('repeat order component is not configured correctly. orderid is a required attribute', 'Error');
    };

    vm.openReorderModal = function(){

        var lineItems = function getLineItems(){
            return RepeatOrderFactory.GetValidLineItems(vm.originalOrderId);
        };

        vm.loading = lineItems()
            .then(function(lineItems){
                $uibModal.open({
                    templateUrl: 'repeatOrder/templates/repeatOrder.modal.html',
                    controller:  RepeatOrderModalCtrl,
                    controllerAs: 'repeatModal',
                    size: 'md',
                    resolve: {
                        OrderID: function() {
                            return vm.currentOrderId;
                        },
                        LineItems: function() {
                            return lineItems;
                        }
                    }
                });
            })
    };
}

function RepeatOrderModalCtrl(LineItems, OrderID, $uibModalInstance, $state, RepeatOrderFactory){
    var vm = this;
    vm.orderid = OrderID;
    vm.invalidLI = LineItems.invalid;
    vm.validLI = LineItems.valid;

    vm.cancel = function(){
        $uibModalInstance.dismiss();
    };

    vm.submit = function(){
        RepeatOrderFactory.AddLineItemsToCart(vm.validLI, vm.orderid)
            .then(function(){
                $uibModalInstance.close();
                $state.go('cart', {}, {reload: true});
            });
    };
}

function RepeatOrderFactory($q, toastr, $exceptionHandler, OrderCloudSDK, ocUtility) {
    return {
        GetValidLineItems: getValidLineItems,
        AddLineItemsToCart: addLineItemsToCart
    };

    function getValidLineItems(originalOrderID) {
        return ocUtility.ListAll(OrderCloudSDK.LineItems.List, 'outgoing', originalOrderID, {})
            .then(function(li){
                var productIds = _.pluck(li.Items, 'ProductID');
                return getValidProducts(productIds)
                    .then(function(productList){
                        var validLI = [];
                        var invalidLI = [];
                        var validProductIDs = _.pluck(productList, 'ID');
                        _.each(li.Items, function(lineItem){
                            if(validProductIDs.indexOf(lineItem.ProductID) > -1){
                                validLI.push(lineItem)
                            } else {
                                invalidLI.push(lineItem);
                            }
                        });
                        return {valid: validLI, invalid: invalidLI};
                    });
            });

            function getValidProducts(ids, products){
                var validProducts = products || []; 
                var chunk = ids.splice(0, 25); //keep small so query params dont get overloaded;
                return OrderCloudSDK.Me.ListProducts({filters: {ID: chunk.join('|')}})
                    .then(function(productList){
                        validProducts = validProducts.concat(productList.Items);
                        if(ids.length) {
                            return getValidProducts(ids, validProducts);
                        } else {
                            return validProducts;
                        }
                    });
            }
    }


    function addLineItemsToCart(validLI, orderID) {
        var queue = [];
        var dfd = $q.defer();
        angular.forEach(validLI, function(li){
            var lineItemToAdd = {
                ProductID: li.ProductID,
                Quantity: li.Quantity,
                Specs: li.Specs
            };
            queue.push(OrderCloudSDK.LineItems.Create('outgoing', orderID, lineItemToAdd));
        });
        $q.all(queue)
            .then(function(){
                dfd.resolve();
                toastr.success('Product(s) Add to Cart', 'Success');
            })
            .catch(function(error){
                $exceptionHandler(error);
                dfd.reject(error);
            });
        return dfd.promise;
    }
}