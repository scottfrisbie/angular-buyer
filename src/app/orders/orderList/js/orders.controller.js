angular.module('orderCloud')
    .controller('OrdersCtrl', OrdersController)
;

function OrdersController($state, $filter, $ocMedia, ocParameters, ocOrders, ocReporting, OrderList, Parameters, GroupAssignments, CanSeeAllOrders, Stores) {
    var vm = this;
    vm.list = OrderList;
    vm.groups = GroupAssignments;
    vm.stores = Stores;
    vm.tab = $state.params.tab;
    vm.parameters = Parameters;
    vm.userGroups = [];
    vm.canSeeAllOrders = CanSeeAllOrders;
    //need this here to display in uib-datepicker (as date obj) but short date (string) in url
    vm.fromDate = Parameters.fromDate;
    vm.toDate = Parameters.toDate;

    vm.orderStatuses = [
        {Value: 'Open', Name: 'Open'},
        {Value: 'AwaitingApproval', Name: 'Awaiting Approval'},
        {Value: 'Completed', Name: 'Completed'},
        {Value: 'Declined', Name: 'Declined'}
    ];

    _.each(vm.groups, function(group) {
        vm.userGroups.push( {
            Name: group.Name,
            Value: group.ID
        });
    });

    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') === 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;
    vm.filtersApplied = vm.parameters.fromDate || vm.parameters.toDate || ($ocMedia('max-width:767px') && vm.sortSelection); //Check if filters are applied, Sort by is a filter on mobile devices
    vm.showFilters = vm.filtersApplied;
    vm.searchResults = Parameters.search && Parameters.search.length > 0; //Check if search was used

    /*       
        Filter / Search / Sort / Pagination functions               
    */
    vm.filter = filter; //Reload the state with new parameters
    vm.today = Date.now();
    vm.clearFrom = clearFrom; //clears from parameters and resets page
    vm.clearTo = clearTo; //clears to parameter and resets page
    vm.search = search; //Reload the state with new search parameter & reset the 
    vm.clearSearch = clearSearch; //Clear the search parameter, reload the state & reset the page
    vm.updateSort = updateSort;  //Conditionally set, reverse, remove the sortBy parameter & reload the state
    vm.reverseSort = reverseSort; //Used on mobile devices
    vm.pageChanged = pageChanged; //Reload the state with the incremented page parameter
    vm.loadMore = loadMore; //Load the next page of results with all of the same parameters, used on mobile

    vm.formatDate = formatDate;
    vm.selectTab = selectTab;
    vm.goToOrder = goToOrder;
    vm.downloadReport = downloadReport;

    function downloadReport(){
        return ocReporting.ExportOrders(vm.list.Items, vm.stores);
    }

    function selectTab(tab){
        vm.parameters.tab = tab;
        vm.parameters.group = null;
        vm.parameters.status = null;
        vm.parameters.from = null;
        vm.parameters.to = null;
        vm.filter(true);
    }

    function goToOrder(order){
        if(vm.parameters.tab === 'approvals') {
            $state.go('orderDetail.approvals', {orderid: order.ID, buyerid: order.FromCompanyID});
        } else {
            $state.go('orderDetail', {orderid: order.ID, buyerid: order.FromCompanyID});
        }
    }

    function filter(resetPage) {
        formatDate();
        $state.go('.', ocParameters.Create(vm.parameters, resetPage));
    }

    function clearFrom(){
        vm.parameters.from = null;
        vm.fromDate = null;
        vm.filter(true);
    }

    function clearTo(){
        vm.parameters.to = null;
        vm.toDate = null;
        vm.filter(true);
    }

    function formatDate(){
        //formats date as string to display in url
        if(vm.fromDate) vm.parameters.from = $filter('date')(angular.copy(vm.fromDate), 'MM-dd-yyyy');
        if(vm.toDate) vm.parameters.to = $filter('date')(angular.copy(vm.toDate), 'MM-dd-yyyy');
    }
    
    function search() {
        vm.filter(true);
    }
    
    function clearSearch() {
        vm.parameters.search = null;
        vm.filter(true);
    }

    function updateSort(value) {
        value ? angular.noop() : value = vm.sortSelection;
        switch(vm.parameters.sortBy) {
            case value:
                vm.parameters.sortBy = '!' + value;
                break;
            case '!' + value:
                vm.parameters.sortBy = null;
                break;
            default:
                vm.parameters.sortBy = value;
        }
        vm.filter(false);
    }

    function reverseSort() {
        Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
        vm.filter(false);
    }

    function pageChanged() {
        $state.go('.', {page:vm.list.Meta.Page});
    }

    function loadMore() {
        return ocOrders.List(vm.parameters)
            .then(function(data){
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
        });
    }
}