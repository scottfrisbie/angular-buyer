angular.module('orderCloud')
    .component('ocProductCard', {
        templateUrl: 'common/directives/oc-product-card/oc-product-card.html',
        controller: ocProductCard,
        controllerAs: 'productCard',
        bindings: {
            product: '<',
            currentOrder: '=',
            currentUser: '<',
            lineItemsList: '<'
        }
    });

function ocProductCard($rootScope, $scope, $exceptionHandler, toastr, OrderCloudSDK){
    var vm = this;

    $scope.$watch(function(){
        return vm.product.Quantity;
    }, function(newVal){
        vm.findPrice(newVal);
    });

    vm.addToCart = function(OCProductForm) {
        var existingLI = _.findWhere(vm.lineItemsList.Items, {ProductID: vm.product.ID});
        var li = {
            ProductID: vm.product.ID,
            Quantity: existingLI ? vm.product.Quantity + existingLI.Quantity : vm.product.Quantity
        };
        if (existingLI) {
            return OrderCloudSDK.LineItems.Patch('outgoing', vm.currentOrder.ID, existingLI.ID, li)
                .then(function(lineItem) {
                    updateOrder(lineItem);
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                })
        } else {
            return OrderCloudSDK.LineItems.Create('outgoing', vm.currentOrder.ID, li)
                .then(function(lineItem) {
                    updateOrder(lineItem);
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                })
        }
        function updateOrder(lineItem) {
            $rootScope.$broadcast('OC:UpdateOrder', vm.currentOrder.ID, 'Updating Order');
            vm.product.Quantity = 1;
            toastr.success('Product added to cart', 'Success');
        };
    };

    vm.findPrice = function(qty){
        if(qty){
            var finalPriceBreak;
            angular.forEach(vm.product.PriceSchedule.PriceBreaks, function(priceBreak) {
                if (priceBreak.Quantity <= qty)
                    finalPriceBreak = angular.copy(priceBreak);
            });
            vm.calculatedPrice = finalPriceBreak.Price * qty;
        }
    };
}