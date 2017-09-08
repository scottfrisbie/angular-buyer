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
				// FeaturedProducts: function(OrderCloudSDK){
				// 	var params = {
				// 		pageSize: 100,
				// 		filters: {
				// 			'xp.Featured': true
				// 		}
				// 	};
				// 	return OrderCloudSDK.Me.ListProducts(params);
				// },
				FeaturedCategories: function(OrderCloudSDK){
					var params = {
						pageSize: 100,
						depth: 'all',
						filters: {
							'xp.Featured': true
						}
					};
					return OrderCloudSDK.Me.ListCategories(params);
				}
			}
		})
	;
}

function HomeController(FeaturedCategories) {
	var vm = this;
	// vm.productList = FeaturedProducts;
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
