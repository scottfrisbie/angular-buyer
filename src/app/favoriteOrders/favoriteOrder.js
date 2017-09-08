angular.module('orderCloud')
    .component('ordercloudFavoriteOrder', {
        bindings:{
            currentUser: '<',
            order: '<'
        },
        templateUrl: 'favoriteOrders/templates/favoriteOrder.component.tpl.html',
        controller: FavoriteOrderCtrl
    });

function FavoriteOrderCtrl(OrderCloudSDK, toastr){
    var vm = this;
    vm.$onInit = function(){
        vm.hasFavorites = !!vm.currentUser && !!vm.currentUser.xp && !!vm.currentUser.xp.FavoriteOrders;
        vm.isFavorited = !!vm.hasFavorites && vm.currentUser.xp.FavoriteOrders.indexOf(vm.order.ID) > -1;
    };

    vm.toggleFavoriteOrder = function(){
        if (vm.hasFavorites && vm.isFavorited){
            removeOrder();
        } else if (vm.hasFavorites && !vm.isFavorited) {
            addOrder(vm.currentUser.xp.FavoriteOrders);
        } else {
            addOrder([]);
        }
    };

    function addOrder(existingList) {
        existingList.push(vm.order.ID);
        return OrderCloudSDK.Me.Patch({xp: {FavoriteOrders: existingList}})
            .then(function(){
                vm.isFavorited = true;
                toastr.success('Order added to your favorites', 'Success');
            });
    }

    function removeOrder(){
        var updatedList = _.without(vm.currentUser.xp.FavoriteOrders, vm.order.ID);
        return OrderCloudSDK.Me.Patch({xp: {FavoriteOrders: updatedList}})
            .then(function(){
                vm.isFavorited = false;
                vm.currentUser.xp.FavoriteOrders = updatedList;
                toastr.success('Order removed from your favorites', 'Success');
            });
    }
}