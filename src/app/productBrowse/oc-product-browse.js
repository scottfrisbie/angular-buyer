angular.module('orderCloud')
    .factory('ocProductBrowse', ocProductBrowseService)
;

function ocProductBrowseService($q, OrderCloudSDK, ocUtility){
    var service = {
        ListCategories: _listCategories,
        GetCategoryTree: _getCategoryTree
    };

    function _listCategories(Catalog){
        var timeLastUpdated = 0;
        if(Catalog.xp && Catalog.xp.CatalogUpdated) timeLastUpdated = Catalog.xp.CatalogUpdated;
        function onCacheEmpty(){
            return ocUtility.ListAll(OrderCloudSDK.Me.ListCategories, {depth:'all'});
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

    return service;
}