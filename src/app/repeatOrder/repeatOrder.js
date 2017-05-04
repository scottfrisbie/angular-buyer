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

        function getLineItems(){
            return RepeatOrderFactory.GetValidLineItems(vm.originalOrderId);
        }

        vm.loading = getLineItems()
            .then(function(lineitems){
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
                            return lineitems;
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
                        var validIds = _.pluck(productList, 'ProductID');
                        var invalidIds = _.without(productIds, validIds);
                        return {valid: validIds, invalid: invalidIds};
                    });
            });

            function getValidProducts(ids, products){
                var validProducts = products || []; 
                var chunk = ids.splice(0, 25); //keep small so query params dont get overloaded;
                return OrderCloudSDK.Me.ListProducts({filters: {ProductID: chunk.join('|')}})
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