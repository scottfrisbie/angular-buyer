angular.module('orderCloud')
    .config(ApprovalsConfig)
;

function ApprovalsConfig($stateProvider){
    $stateProvider
        .state('orderDetail.approvals', {
            url: '/approvals',
            templateUrl: 'orders/orderApprovals/templates/orderApprovals.html',
            controller: 'OrderApprovalsCtrl',
            controllerAs: 'orderApprovals',
            data: {
                pageTitle: 'Order Approvals'
            },
            resolve: {
                OrderApprovals: function($stateParams, ocApprovals) {
                    return ocApprovals.List($stateParams.orderid, $stateParams.buyerid);
                },
                CanApprove: function(CurrentUser, $stateParams, OrderCloudSDK){
                    return OrderCloudSDK.Orders.ListEligibleApprovers('outgoing', $stateParams.orderid, {pageSize: 100})
                        .then(function(userList){
                            var userIDs = _.pluck(userList.Items, 'ID');
                            return userIDs.indexOf(CurrentUser.ID) > -1;
                        });
                }
            }
        });
}