angular.module('orderCloud')
    .factory('ocReporting', ocReportingService)
;

function ocReportingService(ocCSVExport, $filter){
    var _formattedOrders = [];

    var service = {
        ExportOrders: _exportOrders
    };

    function _exportOrders(OrderList){
        //expects array of orders
        buildOrderArray(OrderList);
        return _downloadOrder();
    }

    function buildOrderArray(orderList){
        _.each(orderList, function(order){
            _formattedOrders.push(OrderModel(order));
        });

        function OrderModel(order){
            var format = ocCSVExport.FormatData;
            return {
                OrderID: order.ID,
                OrderStatus: order.Status,
                Submitted: format(order.DateCreated, 'date'),
                SubmittedBy: order.FromUserFirstName + ' ' + order.FromUserLastName,
                Subtotal: format(order.Subtotal || 0, 'currency')
            };
        }
    }

    function _downloadOrder(){
        //maps key names to table headers on csv
        var mapping = {
            "OrderID": "Order ID",
            "OrderStatus": "Order Status",
            "Submitted": "Submitted",
            "SubmittedBy": "Submitted By",
            "Subtotal": "Subtotal"
        };
        return ocCSVExport.GenerateCSVContent(_formattedOrders, mapping)
            .then(function(ordercsv) {
                var now = new Date();
                return ocCSVExport.DownloadFile(ordercsv, 'Order Report: ' + $filter('date')(now, 'MMddyyyy') + '.csv');
            });
    }

    return service;
}