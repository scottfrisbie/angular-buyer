angular.module('orderCloud')
    .controller('SelectPaymentAccountModalCtrl', SelectPaymentAccountModalController)
;

function SelectPaymentAccountModalController($exceptionHandler, $uibModalInstance, OrderCloudSDK, ocCheckoutPaymentService, Accounts, Payment, Order) {
    var vm = this;
    vm.accounts = Accounts;
    vm.payment = angular.copy(Payment);

    vm.pageChanged = function() {
        var options = {
            page: vm.accounts.Meta.Page
        }
        return OrderCloudSDK.Me.ListSpendingAccounts(options)
            .then(function(newAccounts) {
                vm.accounts = newAccounts;
            });
    };

    vm.submit = function(account) {
        if ((vm.payment.Type == 'SpendingAccount' && (Payment.SpendingAccountID == account.ID)) || (vm.payment.Type == 'CreditCard' && (Payment.CreditCardID == account.ID))) {
            $uibModalInstance.dismiss();
        } else {
            vm.payment[vm.payment.Type == 'SpendingAccount' ? 'SpendingAccountID' : 'CreditCardID'] = account.ID;
            ocCheckoutPaymentService.Save(vm.payment, Order, account)
                .then(function(payment) {
                    $uibModalInstance.close(payment);
                });
        }
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}