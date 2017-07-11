angular.module('orderCloud')
    .factory('ocLineItems', LineItemFactory)
;

function LineItemFactory($rootScope, $q, $uibModal, $exceptionHandler, OrderCloudSDK) {
    return {
        SpecConvert: _specConvert,
        AddItem: _addItem,
        GetProductInfo: _getProductInfo,
        CustomShipping: _customShipping,
        UpdateShipping: _updateShipping,
        ListAll: _listAll
    };

    function _specConvert(specs) {
        var results = [];
        angular.forEach(specs, function (spec) {
            var spec_to_push = {SpecID: spec.ID};
            if (spec.Options.length > 0) {
                if (spec.DefaultOptionID) {
                    spec_to_push.OptionID = spec.DefaultOptionID;
                }
                if (spec.OptionID) {
                    spec_to_push.OptionID = spec.OptionID;
                }
                if (spec.Value) {
                    spec_to_push.Value = spec.Value;
                }
            }
            else {
                spec_to_push.Value = spec.Value || spec.DefaultValue || null;
            }
            results.push(spec_to_push);
        });
        return results;
    }

    function _addItem(order, product, lineItems){
        var deferred = $q.defer();

        var existingLI = _.findWhere(lineItems.Items, {ProductID: product.ID});

        var li = {
            ProductID: product.ID,
            Quantity: existingLI ? product.Quantity + existingLI.Quantity : product.Quantity,
            Specs: _specConvert(product.Specs),
            ShippingAddressID: order.ShippingAddressID
        };
        
        if (existingLI) {
            OrderCloudSDK.LineItems.Patch('outgoing', order.ID, existingLI.ID, li)
                .then(function(lineItem) {
                    updateOrder(lineItem);
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                    deferred.reject(ex);
                })
        } else {
            OrderCloudSDK.LineItems.Create('outgoing', order.ID, li)
                .then(function(lineItem) {
                    updateOrder(lineItem);
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                    deferred.reject(ex);
                })
        }

        function updateOrder(lineItem) {
            $rootScope.$broadcast('OC:UpdateOrder', order.ID, 'Updating Order');
            product.Quantity = 1;
            deferred.resolve();
        };

        return deferred.promise;
    }

    function _getProductInfo(LineItems) {
        var li = LineItems.Items || LineItems;
        var productIDs = _.uniq(_.pluck(li, 'ProductID'));
        var dfd = $q.defer();
        var queue = [];
        angular.forEach(productIDs, function (productid) {
            queue.push(OrderCloudSDK.Me.GetProduct(productid));
        });
        $q.all(queue)
            .then(function (results) {
                angular.forEach(li, function (item) {
                    item.Product = angular.copy(_.where(results, {ID: item.ProductID})[0]);
                });
                dfd.resolve(li);
            });
        return dfd.promise;
    }

    function _customShipping(Order, LineItem) {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'common/lineitems/templates/shipping.tpl.html',
            controller: 'LineItemModalCtrl',
            controllerAs: 'liModal',
            size: 'lg'
        });

        modalInstance.result
            .then(function (address) {
                address.ID = Math.floor(Math.random() * 1000000).toString();
                OrderCloudSDK.LineItems.SetShippingAddress('outgoing', Order.ID, LineItem.ID, address)
                    .then(function () {
                        $rootScope.$broadcast('LineItemAddressUpdated', LineItem.ID, address);
                    });
            });
    }

    function _updateShipping(Order, LineItem, AddressID) {
        OrderCloudSDK.Addresses.Get(AddressID)
            .then(function (address) {
                OrderCloudSDK.LineItems.SetShippingAddress('outgoing', Order.ID, LineItem.ID, address);
                $rootScope.$broadcast('LineItemAddressUpdated', LineItem.ID, address);
            });
    }

    function _listAll(orderID) {
        var li;
        var dfd = $q.defer();
        var queue = [];
        OrderCloudSDK.LineItems.List('outgoing', orderID, null, 1, 100)
            .then(function (data) {
                li = data;
                if (data.Meta.TotalPages > data.Meta.Page) {
                    var page = data.Meta.Page;
                    while (page < data.Meta.TotalPages) {
                        page += 1;
                        queue.push(OrderCloudSDK.LineItems.List('outgoing', orderID, null, page, 100));
                    }
                }
                $q.all(queue)
                    .then(function (results) {
                        angular.forEach(results, function (result) {
                            li.Items = [].concat(li.Items, result.Items);
                            li.Meta = result.Meta;
                        });
                        dfd.resolve(li.Items);
                    });
            });
        return dfd.promise;
    }
}