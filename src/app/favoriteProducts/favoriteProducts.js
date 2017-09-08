angular.module('orderCloud')
    .config(FavoriteProductsConfig)
    .directive('ordercloudFavoriteProduct', FavoriteProductDirective)
    .controller('FavoriteProductsCtrl', FavoriteProductsController)
    .controller('FavoriteProductCtrl', FavoriteProductController)
;

function FavoriteProductsConfig($stateProvider){
    $stateProvider
        .state('favoriteProducts', {
            parent: 'account',
            templateUrl: 'favoriteProducts/templates/favoriteProducts.tpl.html',
            url: '/favorite-products?search?page?pageSize?searchOn?sortBy?filters?depth',
            controller: 'FavoriteProductsCtrl',
            controllerAs: 'favoriteProducts',
            data: {
                pageTitle: "Favorite Products"
            },
            resolve: {
                Parameters: function ($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                FavoriteProducts: function(OrderCloudSDK, Parameters, CurrentUser){
                    if (CurrentUser.xp && CurrentUser.xp.FavoriteProducts.length) {
                        Parameters.filters = {ID: CurrentUser.xp.FavoriteProducts.join('|')}
                        return OrderCloudSDK.Me.ListProducts(Parameters);
                    } else {
                        return null;
                    }
                }
            }
        });
}

function FavoriteProductsController(ocParameters, OrderCloudSDK, $state, $ocMedia, Parameters, CurrentUser, FavoriteProducts){
    var vm = this;
    vm.currentUser = CurrentUser;
    vm.list = FavoriteProducts;
    vm.parameters = Parameters;

    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //Filtering and Search Functionality
    //check if filters are applied
    vm.filtersApplied = vm.parameters.filters || ($ocMedia('max-width: 767px') && vm.sortSelection);
    vm.showFilters = vm.filtersApplied;


    //reload the state with new filters
    vm.filter = function(resetPage) {
        $state.go('.', ocParameters.Create(vm.parameters, resetPage));
    };

    //clear the relevant filters, reload the state & reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        $ocMedia('max-width: 767px') ? vm.parameters.sortBy = null : angular.noop();
        vm.filter(true);
    };

    vm.updateSort = function(value) {
        value ? angular.noop() : value = vm.sortSelection;
        switch (vm.parameters.sortBy) {
            case value:
                vm.parameters.sortBy = '!' + value;
                break;
            case '!' + value:
                vm.parameters.sortBy = null;
                break;
            default:
                vm.parameters.sortBy = value;
        }
        vm.filter(false);
    };

    vm.reverseSort = function() {
        Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
        vm.filter(false);
    };

    //reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {
            page: vm.list.Meta.Page
        });
    };

    //load the next page of results with all the same parameters
    vm.loadMore = function() {
        return OrderCloudSDK.Me.ListProducts(Parameters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function FavoriteProductDirective(){
    return {
        scope: {
            currentUser: '=',
            product: '='
        },
        restrict: 'E',
        templateUrl: 'favoriteProducts/templates/ordercloud-favorite-product.tpl.html',
        controller: 'FavoriteProductCtrl',
        controllerAs: 'favoriteProduct'
    };
}

function FavoriteProductController($scope, OrderCloudSDK, toastr){
    var vm = this;
    vm.checkHasFavorites = checkHasFavorites;
    vm.toggleFavoriteProduct = toggleFavoriteProduct;
    vm.addProduct = addProduct;
    vm.removeProduct = removeProduct;

    vm.checkHasFavorites();
    vm.isFavorited = vm.hasFavorites && $scope.currentUser.xp.FavoriteProducts.indexOf($scope.product.ID) > -1;

    function toggleFavoriteProduct(){
        if (vm.hasFavorites){
            if (vm.isFavorited){
                removeProduct();
            } else {
                addProduct($scope.currentUser.xp.FavoriteProducts);
            }
        } else {
            addProduct([]);
        }
    }

    function checkHasFavorites(){
        if($scope.currentUser && $scope.currentUser.xp && $scope.currentUser.xp.FavoriteProducts){
            vm.hasFavorites = true;
        }
        else{
            if($scope.currentUser && $scope.currentUser.xp){
                $scope.currentUser.xp.FavoriteProducts = [];
            }else{
                $scope.currentUser.xp ={};
                $scope.currentUser.xp.FavoriteProducts = [];
            }
            return OrderCloudSDK.Me.Patch( {xp:$scope.currentUser.xp})
                .then(function(){
                    vm.hasFavorites = true;
                })
                .catch(function(ex){
                    console.log(ex);
                });
        }
    }

    function addProduct(existingList){
        existingList.push($scope.product.ID);
        return OrderCloudSDK.Me.Patch({xp: {FavoriteProducts: existingList}})
            .then(function(data){
                vm.hasFavorites = data.xp && data.xp.FavoriteProducts;
                vm.isFavorited = true;
                return toastr.success($scope.product.Name + ' was added to your favorites');
            });
    }

    function removeProduct(){
        var updatedList = _.without($scope.currentUser.xp.FavoriteProducts, $scope.product.ID);
        return OrderCloudSDK.Me.Patch({xp: {FavoriteProducts: updatedList}})
            .then(function(){
                vm.isFavorited = false;
                $scope.currentUser.xp.FavoriteProducts = updatedList;
                return toastr.success($scope.product.Name + ' was removed from your favorites');
            });
    }

}

