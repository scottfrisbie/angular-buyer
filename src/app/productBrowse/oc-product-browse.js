angular.module('orderCloud')
    .factory('ocProductBrowse', ocProductBrowseService)
;

function ocProductBrowseService($q, OrderCloud, ocUtility){
    var service = {
        ListProducts: _listProducts,
        ListCategories: _listCategories,
        GetCategoryTree: _getCategoryTree
    };


    function _listProducts(parameters, CurrentUser){
        var Parameters = _formatProductParams(parameters, CurrentUser);
        if(Parameters.search || Parameters.pageSize || Parameters.searchOn || Parameters.sortBy || Parameters.favorites) {
            //only cache simple product-lists, don't cache if any of the above parameters exist
            return _ocProductListCall(Parameters);
        } else {
            var cacheKey = (Parameters.page || 1).toString() + (Parameters.categoryid || 'NOCAT').toString();
            function onCacheEmpty(){
                return _ocProductListCall(Parameters);
            }
            return ocUtility.GetCache(cacheKey, onCacheEmpty);
        }

        function _ocProductListCall(Parameters){
            return OrderCloud.Me.ListProducts(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.categoryid);
        }
    }

    function _listCategories(Catalog){
        var timeLastUpdated = 0;
        if(Catalog.xp && Catalog.xp.CatalogUpdated) timeLastUpdated = Catalog.xp.CatalogUpdated;
        function onCacheEmpty(){
            return ocUtility.ListAll(OrderCloud.Me.ListCategories, null, 'page', 100, null, null, null, 'all');
        }
        return ocUtility.GetCache('CategoryList', onCacheEmpty, timeLastUpdated);
    }

    function _getCategoryTree(CategoryList, Catalog){
        var timeLastUpdated = 0;
        if(Catalog.xp && Catalog.xp.CatalogUpdated) timeLastUpdated = Catalog.xp.CatalogUpdated;
        function onCacheEmpty(){
            return _buildTree(CategoryList);
        }
       return ocUtility.GetCache('CategoryTree', onCacheEmpty, timeLastUpdated);
    }

    function _buildTree(CategoryList){
        var result = [];
        angular.forEach(_.where(CategoryList.Items, {ParentID: null}), function(node) {
            result.push(getnode(node));
        });
        function getnode(node) {
            var children = _.where(CategoryList.Items, {ParentID: node.ID});
            if (children.length > 0) {
                node.children = children;
                angular.forEach(children, function(child) {
                    return getnode(child);
                });
            } else {
                node.children = [];
            }
            return node;
        }
        return $q.when(result);
    }

    function _formatProductParams(Parameters, CurrentUser){
        var filters = {};

        if (Parameters.favorites && CurrentUser.xp.FavoriteProducts) {
            angular.extend(filters, {ID:CurrentUser.xp.FavoriteProducts.join('|')});
        } 

        Parameters.filters = filters;
        return Parameters;
    }

    return service;
}