angular.module('orderCloud')
    .config(MyPaymentsConfig)
    .controller('MyPaymentsCtrl', MyPaymentsController)
;

function MyPaymentsConfig($stateProvider) {
    $stateProvider
        .state('myPayments', {
            parent: 'account',
            url: '/payments?page?pageSize',
            templateUrl: 'myPayments/templates/myPayments.tpl.html',
            controller: 'MyPaymentsCtrl',
            controllerAs: 'myPayments',
            data: {
                pageTitle: "Payment Methods"
            },
            resolve: {
                Parameters: function ($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                UserCreditCards: function(OrderCloudSDK, Parameters) {
                    Parameters.filters = {Editable: true} 
                    return OrderCloudSDK.Me.ListCreditCards(Parameters);
                },
                UserSpendingAccounts: function(OrderCloudSDK, Parameters) {
                    Parameters.filters = {RedemptionCode: '!*'} 
                    return OrderCloudSDK.Me.ListSpendingAccounts(Parameters);
                },
                GiftCards: function(OrderCloudSDK, Parameters) {
                    Parameters.filters = {RedemptionCode: '*'} 
                    return OrderCloudSDK.Me.ListSpendingAccounts(Parameters);
                }
            }
        });
}

function MyPaymentsController($q, $state, toastr, $exceptionHandler, ocConfirm, ocAuthNet, MyPaymentCreditCardModal, UserCreditCards, UserSpendingAccounts, GiftCards) {
    var vm = this;
    vm.personalCreditCards =  UserCreditCards;
    vm.personalSpendingAccounts = UserSpendingAccounts;
    vm.giftCards = GiftCards;

    vm.pageChanged = function() {
        $state.go('.', {
            page: vm.personalSpendingAccounts.Meta.Page
        });
    };

    vm.createCreditCard = function(){
        MyPaymentCreditCardModal.Create()
        .then(function(data) {
            toastr.success('Credit Card Created', 'Success');
            vm.personalCreditCards.Items.push(data);
        });
    };

    vm.edit = function(scope){
        MyPaymentCreditCardModal.Edit(scope.creditCard)
            .then(function(data){
                toastr.success('Credit Card Updated', 'Success');
                vm.personalCreditCards.Items[scope.$index] = data;
            });
    };

    vm.delete = function(scope){
        vm.loading = [];
        ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + 'xxxx-xxxx-xxxx-' + scope.creditCard.PartialAccountNumber + '</b>?',
                confirmText: 'Delete credit card',
                type: 'delete'})
            .then(function(){
                vm.loading[scope.$index] = ocAuthNet.DeleteCreditCard(scope.creditCard)
                    .then(function(){
                        toastr.success('Credit Card Deleted', 'Success');
                        vm.personalCreditCards.Items.splice(scope.$index, 1);
                    })
                    .catch(function(error) {
                        $exceptionHandler(error);
                    });
            });
    };
}