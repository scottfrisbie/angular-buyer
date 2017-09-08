angular.module('orderCloud')
	.config(LocalForage)
;

function LocalForage($localForageProvider) {
	$localForageProvider.config({
		version: 1.0,
		name: 'OrderCloudSDK',
		storeName: 'four51',
		description: 'Four51 OrderCloudSDK Local Storage'
	});
}