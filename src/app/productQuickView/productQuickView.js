angular.module('orderCloud')
	.service('ProductQuickView', ProductQuickViewService)
	.controller('ProductQuickViewCtrl', ProductQuickViewController)
	.component('ordercloudProductQuickView', {
		bindings: {
			product: '<',
			currentOrder: '<',
			lineItems: '<'
		},
		template: '<i class="fa fa-eye text-primary" ng-click="$ctrl.quickView($ctrl.currentOrder, $ctrl.product)"></i>',
		controller: function(ProductQuickView){
			this.quickView = function(currentorder, product, lineItems){
				ProductQuickView.Open(currentorder, product, lineItems);
			};
		}
	})
;

function ProductQuickViewService($uibModal) {
	var service = {
		Open: _open
	};

	function _open(currentOrder, product, lineItems) {
		return $uibModal.open({
			backdrop:'static',
			templateUrl: 'productQuickView/templates/productQuickView.modal.html',
			controller: 'ProductQuickViewCtrl',
			controllerAs: 'productQuickView',
			size: 'lg',
			animation: false,
			resolve: {
				SelectedProduct: function() {
					return product;
				},
				CurrentOrder: function() {
					return currentOrder;
				},
				LineItemsList: function() {
					return lineItems;
				}
			}
		}).result
	}

	return service;
}

function ProductQuickViewController(toastr, $uibModalInstance, SelectedProduct, CurrentOrder, ocLineItems, LineItemsList) {
	var vm = this;
	vm.currentOrder = CurrentOrder;
	vm.item = SelectedProduct;
	vm.lineItemsList = LineItemsList;

	vm.addToCart = function() {
		ocLineItems.AddItem(vm.currentOrder, vm.item, vm.lineItemsList)
			.then(function(){
				toastr.success('Product added to cart', 'Success');
				$uibModalInstance.close();
			});
	};

	vm.findPrice = function(qty){
		var finalPriceBreak = null;
		angular.forEach(vm.item.PriceSchedule.PriceBreaks, function(priceBreak) {
			if (priceBreak.Quantity <= qty)
				finalPriceBreak = angular.copy(priceBreak);
		});

		return finalPriceBreak.Price * qty;
	};

	vm.cancel = function() {
		$uibModalInstance.dismiss();
	};
}