angular.module('orderCloud')
    .factory('ocProducts', ocProductsService)
;

function ocProductsService(OrderCloud, $localForage, appname){
    var cacheKey;
    var service = {
        List: _list
    };


    function _list(parameters, CurrentUser){
        var Parameters = _formatParams(parameters, CurrentUser);
        return _getCache(Parameters);
    }

    function _formatParams(Parameters, CurrentUser){
        var filters = {};

        if (Parameters.favorites && CurrentUser.xp.FavoriteProducts) {
            angular.extend(filters, {ID:CurrentUser.xp.FavoriteProducts.join('|')});
        } 

        Parameters.filters = filters;
        return Parameters;
    }

    function _getCache(Parameters){
        if(Parameters.search || Parameters.pageSize || Parameters.searchOn || Parameters.sortBy || Parameters.favorites) {
            //only cach simple product-lists, don't cache if any of the above parameters exist
            return OrderCloud.Me.ListProducts(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.categoryid);
        } else {
            cacheKey = appname + (Parameters.page || 1).toString() + (Parameters.categoryid || 'NOCAT').toString();
            return $localForage.getItem(cacheKey).then(function(results){
                if(results) {
                    return results;
                } else {
                    return getCachedProducts();
                }
            });
        }

        function getCachedProducts(){
            return OrderCloud.Me.ListProducts(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.categoryid)
                .then(function(productList){
                    return $localForage.setItem(cacheKey, productList)
                        .then(function() {
                            return productList;
					});
                });
        }
    }

    return service;
}