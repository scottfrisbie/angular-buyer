angular.module('orderCloud')
    .factory('ocMandrill', ocMandrillService)
;

function ocMandrillService($resource, devapiurl, $filter) {
    var service = {
        NegativeBalance: _negativeBalance
    };

    function _negativeBalance(userList, order) {
        var body = {
            Recipients: [],
            Order: {
                ID: order.ID,
                // Balance: order.Balance,
                Balance: 'MockBalance',
                DateSubmitted: $filter('date')(order.DateCreated),
                FirstName: order.FromUserFirstName,
                LastName: order.FromUserLastName,
                Total: order.Total
            }
        };

        _.each(userList.Items, function(user){
            body.Recipients.push({email: user.Email, type: 'to'});
        });
        console.log('body', angular.copy(body));

        return $resource(devapiurl + '/mandrill/negativebalance', {}, {send: {method: 'POST'}}).send(body).$promise;
    }

    return service;
}