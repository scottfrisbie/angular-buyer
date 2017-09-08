angular.module('orderCloud')
    .config(MyAddressesConfig)
    .controller('MyAddressesCtrl', MyAddressesController)
;

function MyAddressesConfig($stateProvider) {
    $stateProvider
        .state('myAddresses', {
            parent: 'account',
            url: '/addresses?page?pageSize?',
            templateUrl: 'myAddresses/templates/myAddresses.tpl.html',
            controller: 'MyAddressesCtrl',
            controllerAs: 'myAddresses',
            data: {
                pageTitle: "Personal Addresses"
            },
            resolve: {
                Parameters: function ($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                ShippingAddresses: function(OrderCloudSDK, Parameters) {
                    Parameters.filters = {
                        Shipping: true
                    }
                    return OrderCloudSDK.Me.ListAddresses(Parameters);
                },
                BillingAddresses: function(OrderCloudSDK, Parameters) {
                    Parameters.filters = {
                        Billing: true
                    }
                    Parameters.page = 1;
                    return OrderCloudSDK.Me.ListAddresses(Parameters);
                }
            }
        });
}

function MyAddressesController($state, toastr, OrderCloudSDK, ocConfirm, MyAddressesModal, ShippingAddresses, BillingAddresses) {
    var vm = this;
    vm.shippingAddresses = ShippingAddresses;
    vm.billingAddresses = BillingAddresses;

    vm.pageChanged = function() {
        $state.go('.', {
            page: vm.shippingAddresses.Meta.Page
        });
    };

    vm.create = function() {
        MyAddressesModal.Create()
            .then(function(data) {
                toastr.success('Address Created', 'Success');
                vm.shippingAddresses.Items.push(data);
            });
    };

    vm.edit = function(scope){
        MyAddressesModal.Edit(scope.address)
            .then(function(data) {
                toastr.success('Address Saved', 'Success');
                vm.list.Items[scope.$index] = data;
            });
    };

    vm.delete = function(scope) {
        vm.loading = [];
        ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + (scope.address.AddressName ? scope.address.AddressName : scope.address.ID) + '</b>?',
                confirmText: 'Delete address',
                type: 'delete'})
            .then(function() {
                vm.loading[scope.$index] = OrderCloudSDK.Me.DeleteAddress(scope.address.ID)
                    .then(function() {
                        toastr.success('Address Deleted', 'Success');
                        vm.shippingAddresses.Items.splice(scope.$index, 1);
                    })
            })
            .catch(function() {

            });
    };

}