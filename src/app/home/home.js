angular.module('orderCloud')
	.config(HomeConfig)
	.controller('HomeCtrl', HomeController)
;

function HomeConfig($stateProvider) {
	$stateProvider
		.state('home', {
			parent: 'base',
			url: '/home',
			templateUrl: 'home/templates/home.tpl.html',
			controller: 'HomeCtrl',
			controllerAs: 'home',
			data: {
				pageTitle: 'Home'
			},
			resolve: {
				FeaturedProducts: function(OrderCloudSDK){
					return OrderCloudSDK.Me.ListProducts(null, null, 100, null, null, {'xp.Featured': true});
				},
				FeaturedCategories: function(OrderCloudSDK){
					return OrderCloudSDK.Me.ListCategories(null, 1, 100, null, null, {'xp.Featured': true}, 'all');
				}
			}
		})
	;
}

function HomeController(FeaturedProducts, FeaturedCategories) {
	var vm = this;
	vm.productList = FeaturedProducts;
	vm.categoryList = FeaturedCategories;

	//settings used by slider
	vm.responsive = [
		{
			breakpoint: 1500,
			settings: {
				slidesToShow: 4
			}
		},
		{
			breakpoint: 992,
			settings: {
				slidesToShow: 3
			}
		},
		{
			breakpoint: 768,
			settings: {
				slidesToShow: 1
			}
		}                            
	];
}
