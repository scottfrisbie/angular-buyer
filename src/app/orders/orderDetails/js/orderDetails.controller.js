angular.module('orderCloud')
    .controller('OrderDetailsCtrl', OrderDetailsController)
;

function OrderDetailsController($stateParams, Shipments, OrderCloudSDK, SelectedOrder, OrderLineItems, IsMyOrder) {
    var vm = this;
    vm.order = SelectedOrder;
    vm.lineItems = OrderLineItems;
    vm.shipments = Shipments;
    vm.isMyOrder = IsMyOrder;

    vm.pageChanged = function() {
        return OrderCloudSDK.LineItems.List('outgoing', $stateParams.orderid, null, vm.lineItems.Meta.Page, vm.lineItems.Meta.PageSize, null, null, null, $stateParams.buyerid)
            .then(function(data) {
                vm.lineItems = data;
            });
    };

    vm.loadMore = function() {
        vm.lineItems.Meta.Page++;
        return OrderCloudSDK.LineItems.List('outgoing', $stateParams.orderid, null, vm.lineItems.Meta.Page, vm.lineItems.Meta.PageSize, null, null, null, $stateParams.buyerid)
            .then(function(data) {
                vm.lineItems.Items = vm.lineItems.Items.concat(data.Items);
                vm.lineItem.Meta = data.Meta;
            });
    };
}