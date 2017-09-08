angular.module('orderCloud')
    .factory('ocApprovals', ocApprovals)
;

function ocApprovals(OrderCloudSDK, $exceptionHandler, $uibModal, $state){
    var service = {
        List: _list,
        UpdateApprovalStatus: _updateApprovalStatus
    };

    function _list(orderID, buyerID, page) {

        return OrderCloudSDK.Orders.ListApprovals('outgoing', orderID, {page: page})
            .then(function(data) {
                return getApprovalRules(data);
            });

        function getApprovalRules(data) {
            var approvalRuleIDs = _.pluck(data.Items, 'ApprovalRuleID');
            return OrderCloudSDK.ApprovalRules.List(buyerID, {pageSize: 100, filters: {ID: approvalRuleIDs.join('|')}})
                .then(function(approvalRuleData) {
                    angular.forEach(data.Items, function(approval) {
                        approval.ApprovalRule = _.findWhere(approvalRuleData.Items, {ID: approval.ApprovalRuleID});
                    });
                    return data;
                })
                .catch(function(err) {
                    return $exceptionHandler(err);
                });
        }
    }

    function _updateApprovalStatus(orderID, intent){
        return $uibModal.open({
            templateUrl: 'orders/orderApprovals/templates/approve.modal.html',
            controller: 'ApprovalModalCtrl',
            controllerAs: 'approvalModal',
            size: 'md',
            resolve: {
                OrderID: function() {
                    return orderID;
                },
                Intent: function(){
                    return intent;
                }
            }
        }).result
            .then(function(){
                $state.reload();
            });
    }

    return service;
}