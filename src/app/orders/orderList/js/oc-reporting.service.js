angular.module('orderCloud')
    .factory('ocReporting', ocReportingService)
;

function ocReportingService(ocCSVExport, $filter){
    var _formattedOrders = [];

    var service = {
        ExportOrders: _exportOrders
    };

    function _exportOrders(OrderList, Stores){
        //expects array of orders
        buildOrderArray(OrderList, Stores);
        return _downloadOrder();
    }

    function buildOrderArray(orderList, Stores){
        _.each(orderList, function(order){
            _formattedOrders.push(OrderModel(order));
        });

        function OrderModel(order){
            var format = ocCSVExport.FormatData;
            return {
                OrderID: order.ID,
                OrderStatus: order.Status,
                Submitted: format(order.DateSubmitted, 'date'),
                StoreName: Stores[order.ShippingAddressID].AddressName,
                SubmittedBy: order.FromUser.FirstName + ' ' + order.FromUser.LastName,
                Subtotal: format(order.Subtotal || 0, 'currency')
            };
        }
    }

    function _downloadOrder(){
        //maps key names to table headers on csv
        var mapping = {
            'OrderID': 'Order ID',
            'OrderStatus': 'Order Status',
            'Submitted': 'Submitted',
            'StoreName': 'Store Name',
            'SubmittedBy': 'Submitted By',
            'Subtotal': 'Subtotal'
        };
        return ocCSVExport.GenerateCSVContent(_formattedOrders, mapping)
            .then(function(ordercsv) {
                var now = new Date();
                return ocCSVExport.DownloadFile(ordercsv, 'Order Report: ' + $filter('date')(now, 'MMddyyyy') + '.csv');
            });
    }

    return service;
}