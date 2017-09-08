angular.module('orderCloud')
    .factory('MyAddressesModal', MyAddressesModalFactory)
    .controller('CreateAddressModalCtrl', CreateAddressModalController)
    .controller('EditAddressModalCtrl', EditAddressModalController)
;

function MyAddressesModalFactory($uibModal) {
    return {
        Create: _create,
        Edit: _edit
    };

    function _create() {
        return $uibModal.open({
            templateUrl: 'myAddresses/templates/myAddresses.create.modal.tpl.html',
            controller: 'CreateAddressModalCtrl',
            controllerAs: 'createAddress',
            size: 'md'
        }).result;
    }

    function _edit(address) {
        var addressCopy = angular.copy(address);
        return $uibModal.open({
            templateUrl: 'myAddresses/templates/myAddresses.edit.modal.tpl.html',
            controller: 'EditAddressModalCtrl',
            controllerAs: 'editAddress',
            size: 'md',
            resolve: {
                SelectedAddress: function() {
                    return addressCopy;
                }
            }
        }).result;
    }
}

function CreateAddressModalController($q, $exceptionHandler, $uibModalInstance, OrderCloudSDK, ocGeography) {
    var vm = this;
    vm.countries = ocGeography.Countries;
    vm.states = ocGeography.States;
    vm.address = {
        //defaults selected country to US
        Country: 'US',
        //default shipping/billing to true for personal addresses
        Shipping:true,
        Billing: true
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };

    vm.submit = function() {
        vm.loading = {
            message:'Creating Address'
        };
        vm.loading.promise = OrderCloudSDK.Me.CreateAddress(vm.address)
            .then(function(address) {
                $uibModalInstance.close(address);
            })
            .catch(function(error) {
                $exceptionHandler(error);
            });
    };
}

function EditAddressModalController($exceptionHandler, $uibModalInstance, OrderCloudSDK, ocGeography, SelectedAddress) {
    var vm = this;
    vm.countries = ocGeography.Countries;
    vm.states = ocGeography.States;
    vm.address = SelectedAddress;
    vm.addressID = angular.copy(SelectedAddress.ID);

    //default shipping/billing to true for personal addresses
    vm.address.Shipping = true;
    vm.address.Billing = true;

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };

    vm.submit = function() {
        vm.loading = {
            message:'Saving Address'
        };
        vm.loading.promise = OrderCloudSDK.Me.UpdateAddress(vm.addressID, vm.address)
            .then(function(address) {
                $uibModalInstance.close(address);
            })
            .catch(function(error) {
                $exceptionHandler(error);
            });
    };
}