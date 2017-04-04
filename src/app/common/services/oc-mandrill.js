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
                BudgetBalance: $filter('currency')(order.BudgetBalance),
                DateSubmitted: $filter('date')(order.DateCreated),
                FirstName: order.FromUserFirstName,
                LastName: order.FromUserLastName,
                UserID: order.FromUserID,
                Total: $filter('currency')(order.Total)
            }
        };

        _.each(userList.Items, function(user){
            body.Recipients.push({email: user.Email, type: 'to'});
        });
        return $resource(devapiurl + '/mandrill/negativebalance', {}, {send: {method: 'POST'}}).send(body).$promise;
    }

    return service;
}