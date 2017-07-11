angular.module('orderCloud')
    .config(ProductConfig)
    .controller('ProductDetailCtrl', ProductDetailController)
;

function ProductConfig($stateProvider) {
    $stateProvider
        .state('productDetail', {
            parent: 'base',
            url: '/product/:productid',
            templateUrl: 'productDetail/templates/productDetail.tpl.html',
            controller: 'ProductDetailCtrl',
            controllerAs: 'productDetail',
            resolve: {
                Product: function ($stateParams, OrderCloudSDK) {
                    return OrderCloudSDK.Me.GetProduct($stateParams.productid);
                }
            }
        });
}


function ProductDetailController($exceptionHandler, Product, CurrentOrder, ocLineItems, toastr, LineItemsList) {
    var vm = this;
    vm.currentOrder = CurrentOrder;
    vm.item = Product;
    vm.lineItemsList = LineItemsList;
    vm.finalPriceBreak = null;

    vm.addToCart = function() {
        ocLineItems.AddItem(vm.currentOrder, vm.item, vm.lineItemsList)
            .then(function(){
                toastr.success('Product added to cart', 'Success')
            })
            .catch(function(error){
               $exceptionHandler(error);
            });
    };

    vm.findPrice = function(qty){
        angular.forEach(vm.item.PriceSchedule.PriceBreaks, function(priceBreak) {
            if (priceBreak.Quantity <= qty)
                vm.finalPriceBreak = angular.copy(priceBreak);
        });

        return vm.finalPriceBreak.Price * qty;
    };
}

