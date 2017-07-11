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

function ocProductCard($rootScope, $scope, $exceptionHandler, toastr, OrderCloudSDK, ocLineItems){
    var vm = this;

    $scope.$watch(function(){
        return vm.product.Quantity;
    }, function(newVal){
        vm.findPrice(newVal);
    });

    vm.addToCart = function(OCProductForm) {
        ocLineItems.AddItem(vm.currentOrder, vm.product, vm.lineItemsList)
			.then(function(){
				toastr.success('Product added to cart', 'Success');
				$uibModalInstance.close();
			})
            .catch(function(error){
               $exceptionHandler(error);
            });
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