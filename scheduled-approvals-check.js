var request = require('request');
var q = require('q');
var bo = require('./back-office.config');
var _ = require('underscore');

var _impersonationToken;
var _levelTwoGroupIds;

return getToken()
    .then(function(token){
        return getImpersonationToken(token);
    })
    .then(function(impersonationToken){
        _impersonationToken = impersonationToken['access_token'];
        return getLevelTwoGroups(); 
    })
    .then(function(levelTwoGroups){
        _levelTwoGroupIds = _.pluck(levelTwoGroups.Items, 'ID');
        return getApprovableOrderIDs(); 
    })
    .then(function(approvableOrderIds){
        //return orders that have *only* level 1 approvals
        return getLevelOneApprovables(approvableOrderIds); 
    })
    .then(function(levelOneApprovables){
        return patchAndApprove(levelOneApprovables);
    });

function getLevelTwoGroups(){
    return makeApiCall({
        method: 'get',
        route: '/buyers/caferio/usergroups?pageSize=100&search=Level 2&searchOn=Name'
    });
}

function getApprovableOrderIDs(){
    var now = new Date();
    now.setHours(now.getHours() - 48);
    var fortyEightHoursAgo = now.toISOString();
    return makeApiCall({
        method: 'get',
        route: '/orders/outgoing?pageSize=100&Status=AwaitingApproval&DateSubmitted=<'+ fortyEightHoursAgo
    })
    .then(function(orders){
        return _.pluck(orders.Items, 'ID');
    });
}

function getLevelOneApprovables(orders){
    var queue = [];
    _.each(orders, function(id){
        queue.push(listApprovals(id));
    });
    return q.all(queue)
        .then(function(orderApprovals){
            return _.compact(orderApprovals);
        });

    function listApprovals(orderid){
        return makeApiCall({
            method: 'get',
            route: '/orders/outgoing/' + orderid + '/approvals?pageSize=100'
        })
        .then(function(approvals){
            //only lists of approvals with no level two approvals will be returned
            var allLevelOne = true;
            var ApprovingGroups = [];
            _.each(approvals.Items, function(approval){
                ApprovingGroups.push(approval.ApprovingGroupID);
                if(_levelTwoGroupIds.indexOf(approval.ApprovingGroupID) > -1) allLevelOne = false;
            });
            return allLevelOne ? {ID: orderid, ApprovingGroups: ApprovingGroups} : null;
        });
    }
}

function patchAndApprove(orders){
    var patchQueue = [];
    _.each(orders, function(order){
        patchQueue.push(patchOrderXp(order.ID));
    });
    return q.all(patchQueue)
        .then(function(){
            var approveQueue = [];
            _.each(orders, function(order){
                approveQueue.push(approve(order.ID));
            });
            return q.all(approveQueue);
        });

    function patchOrderXp(orderid){
        return makeApiCall({
            method:'patch',
            route: '/orders/outgoing/' + orderid,
            body: {xp: {Over48:'yes'}}
        });
    }

    function approve(orderid){
        return makeApiCall({
            method: 'post',
            route: '/orders/outgoing/' + orderid + '/approve',
            body: {Comments: 'Approval Auto Escalated to Level 2'}
        });
    }
}

function getImpersonationToken(token){
    var impersonation = {
        ClientID: bo.buyerclientid,
        Roles: ['ApprovalRuleAdmin', 'OrderAdmin', 'UserGroupReader', 'BuyerUserReader', 'UnsubmittedOrderReader']
    };
    return makeApiCall({
        method: 'post',
        route: '/buyers/caferio/users/' + bo.user + '/accesstoken',
        token: token,
        body: impersonation
    });
}

function getToken(){
    var authurl = 'https://auth.ordercloud.io';
    var deferred = q.defer();
    var requestBody = {
        url: authurl + '/oauth/token',
        headers: {
            'Content-Type': 'application/json'
        },
        rejectUnauthorized: false,
        body: 'client_id=' + bo.cid + '&grant_type=client_credentials&client_secret=' + bo.secret + '&scope=BuyerImpersonation'
    };
    request.post(requestBody, 
        function(error, response, body){
            deferred.resolve( JSON.parse(body)['access_token'] );
    });
    return deferred.promise;
}

function makeApiCall(requestObj){
    //requestObj = {method: method, route: route, body: body, token: token}
    var apiurl = 'https://api.ordercloud.io/v1';
    var deferred = q.defer();
    var requestBody = {
        url: apiurl + requestObj.route,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + (requestObj.token || _impersonationToken)
        },
        json: requestObj.body,
        rejectUnauthorized: false
    };
    request[requestObj.method](requestBody,
        function(error, response, body){
            var result = typeof body === 'string' ? JSON.parse(body) : body;
            deferred.resolve(result);
        });
    return deferred.promise;
}