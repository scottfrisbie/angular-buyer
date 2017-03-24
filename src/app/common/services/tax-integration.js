angular.module('orderCloud')
    .factory('TaxIntegration', TaxIntegrationService)
;

function TaxIntegrationService($resource, $http, devapiurl){
    var service = {
        Get: _get,
        callApi: _callApi
    };

    function _get(BillingAddress, LineItemList){
        var body = {};
        body.Customer = {};
        var ship = LineItemList.Items[0].ShippingAddress;

        body.Customer.ShipToAddress = {
            AddressLine1: ship.Street1,
            AddressLine2: ship.Street2 || '',
            City: ship.City,
            State: ship.State,
            Country: ship.Country,
            PostalCode: ship.Zip
        };

        body.Customer.BillToAddress = {
            AddressLine1: BillingAddress.Street1,
			AddressLine2: BillingAddress.Street2 || '',
			City: BillingAddress.City,
			State: BillingAddress.State,
			Country: BillingAddress.Country,
			PostalCode: BillingAddress.Zip
        };
        
        body.LineItems = [];

        var count = 0;
        _.each(LineItemList.Items, function(li){
            count++;
            LineItemModel(li, count);
        });

        function LineItemModel(li, count){
            var model = {
                LineNumber: count,
                ProductID: li.ProductID,
                Quantity: li.Quantity,
                UnitPrice: li.UnitPrice
            };
            body.LineItems.push(model);
        }
        var something = {
	"Customer": {
		"ShipToAddress": {
			"AddressLine1": "1600 Amphitheatre Pkwy",
			"AddressLine2": "",
			"City": "Mountain View",
			"State": "CA",
			"Country": "US",
			"PostalCode": "94043"
		},
		"BillToAddress": {
			"AddressLine1": "3825 Walnut Street",
			"AddressLine2": "",
			"City": "Boulder",
			"State": "CO",
			"Country": "US",
			"PostalCode": "80301"
		}
	},
	"LineItems": [
    {
      "LineNumber": 1,
      "ProductID": "5555",
      "Quantity": 1.0,
      "UnitPrice": 9.99
    },
    {
      "LineNumber": 2,
      "ProductID": "7777",
      "Quantity": 2.0,
      "UnitPrice": 9.99
    }
	]
}
        return _callApi(body);
    }

    function _callApi(body){
        return $resource(devapiurl + '/etundra-tax/list', {}, {parse: {method: 'POST'}}).parse({File: body}).$promise;
    }
    

    return service;
}