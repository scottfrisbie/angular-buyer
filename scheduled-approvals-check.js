var request = require('request');
var q = require('q');
var mandrill = require('mandrill-api/mandrill');
var mandrillConfig = require('./mandrill.config');
var bo = require('./back-office.config');
var _ = require('underscore');

var _token;
var _levelTwoGroups;
var _levelTwoGroupIds;
var _levelOneApprovables;

return getToken()
    .then(function(token){
        return getImpersonationToken(token);
    })
    .then(function(impersonationToken){
        _token = impersonationToken['access_token'];
        return getLevelTwoGroups(); 
    })
    .then(function(levelTwoGroups){
        _levelTwoGroups = levelTwoGroups;
        _levelTwoGroupIds = _.pluck(levelTwoGroups, 'ID');
        return getApprovableOrderIDs(); 
    })
    .then(function(approvableOrderIds){
        //return orders that have *only* level 1 approvals
        return getLevelOneApprovables(approvableOrderIds); 
    })
    .then(function(levelOneApprovables){
        _levelOneApprovables = levelOneApprovables;
        return patchAndApprove(levelOneApprovables);
    })
    .then(function(){
        return getEmailAddresses();
    })
    .then(function(approvals){
        return sendEmails(approvals);
    });

function getLevelTwoGroups(){
    return makeApiCall({
        method: 'get',
        route: '/buyers/caferio/usergroups?pageSize=100&search=Level 2&searchOn=Name',
        token: _token
    })
    .then(function(userGroupList){
        var queue = [];
        _.each(userGroupList.Items, function(group){
            queue.push(getUsers(group));
        });
        return q.all(queue);

        function getUsers(group){
            return makeApiCall({
                method: 'get',
                route: '/buyers/caferio/users?pageSize=100&userGroupID=' + group.ID,
                token: _token
            })
            .then(function(userList){
                var users = userList.Items;
                var emails = _.pluck(users, 'Email');
                group.Users = users;
                group.Emails = emails;
                return group;
            });
        }
    });
}

function getApprovableOrderIDs(){
    var now = new Date();
    now.setHours(now.getHours() - 48);
    var fortyEightHoursAgo = now.toISOString();
    return makeApiCall({
        method: 'get',
        route: '/orders/outgoing?pageSize=100&Status=AwaitingApproval&DateSubmitted=<'+ fortyEightHoursAgo,
        token: _token
    })
    .then(function(orders){
        return _.pluck(orders.Items, 'ID');
    });
}

function getLevelOneApprovables(orders){
    var deferred = q.defer();
    var queue = [];
    orders.forEach(function(id){
        queue.push(listApprovals(id));
    });
    q.all(queue)
        .then(function(orderApprovals){
            deferred.resolve(_.compact(orderApprovals));
        });
    return deferred.promise;

    function listApprovals(orderid){
        return makeApiCall({
            method: 'get',
            route: '/orders/outgoing/' + orderid + '/approvals?pageSize=100',
            token: _token
        })
        .then(function(approvals){
            //only lists of approvals with no level two approvals will be returned
            var allLevelOne = true;
            var ApprovingGroups = [];
            approvals.Items.forEach(function(approval){
                ApprovingGroups.push(approval.ApprovingGroupID);
                if(_levelTwoGroupIds.indexOf(approval.ApprovingGroupID) > -1) allLevelOne = false;
            });
            return allLevelOne ? {ID: orderid, ApprovingGroups: ApprovingGroups} : null;
        });
    }
}

function patchAndApprove(orders){
    var patchQueue = [];
    orders.forEach(function(order){
        patchQueue.push(patchOrderXp(order.ID));
    });
    return q.all(patchQueue)
        .then(function(){
            var approveQueue = [];
            orders.forEach(function(order){
                approveQueue.push(approve(order.ID));
            });
            return q.all(approveQueue);
        });

    function patchOrderXp(orderid){
        return makeApiCall({
            method:'patch',
            route: '/orders/outgoing/' + orderid,
            body: {xp: {Over48:'yes'}},
            token: _token
        });
    }

    function approve(orderid){
        return makeApiCall({
            method: 'post',
            route: '/orders/outgoing/' + orderid + '/approve',
            token: _token,
            body: {Comments: 'Approval auto escalated to Level 2'}
        });
    }
}

function getEmailAddresses(){
    var queue = [];
    _.each(_levelOneApprovables, function(orderApproval){
        queue.push(getLevelTwoEmailAddresses(orderApproval));
    });

    return q.all(queue);

    function getLevelTwoEmailAddresses(orderApproval){
        var levelOneID = orderApproval.ApprovingGroups[0];
        return makeApiCall({
            method: 'get',
            route: '/buyers/caferio/usergroups/' + levelOneID,
            token: _token
        })
        .then(function(levelOneGroup){
            var levelTwoID = levelOneGroup.xp['Level2GroupID'];
            var levelTwoGroup = _.findWhere(_levelTwoGroups, {ID: levelTwoID});
            orderApproval.Emails = levelTwoGroup.Emails;
            return orderApproval;
        });
    }
}

function sendEmails(approvals){
    var queue = [];
    var ApprovedOrders = [];
    _.each(approvals, function(approval){
        var recipients = [];
        ApprovedOrders.push(approvals.ID);
        _.each(approval.Emails, function(email){
            recipients.push({email: email, type: 'to'});
        });
        queue.push(sendMandrillEmail(recipients, [{ORDERNUMBER: approval.ID}, {ApprovingGroups: approval.ApprovingGroups.join(',')}]));
    });
    return q.all(queue)
        .then(function(){
            //diagnostic - checking to make sure emails send
            return sendMandrillEmail({email: 'cramirez@four51.com', type: 'to'}, [{ORDERNUMBER: ApprovedOrders.join(',')}]);
        });
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
    //TODO: remove qa once testing is complete
    var authurl = 'https://qaauth.ordercloud.io';
    var deferred = q.defer();
    var requestBody = {
        url: authurl + "/oauth/token",
        headers: {
            "Content-Type": "application/json"
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
    //TODO: remove qa once testing is complete
    var apiurl = 'https://qaapi.ordercloud.io/v1';
    var deferred = q.defer();
    var requestBody = {
        url: apiurl + requestObj.route,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + requestObj.token
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

function sendMandrillEmail(recipients, mergeVars) {
    var deferred = q.defer();

    var mandrill_client = new mandrill.Mandrill(mandrillConfig.apiKey);
    var template_content = [{name: 'main', content: 'content'}];
    var message = {
        to: recipients,
        global_merge_vars: mergeVars
    };

    mandrill_client.messages.sendTemplate({template_name: 'approval-escalated', template_content: template_content, message: message},
        function(result) {
            console.log(result);
        },
        function(error) {
            console.log(error);
        }
    );

    return deferred.promise;
}