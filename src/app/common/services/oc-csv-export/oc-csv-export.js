angular.module('orderCloud')
    .factory('ocCSVExport', ocCSVExport)
;

/**
 * * * * * * * *
 * ocCSVExport *
 * * * * * * * *
 * A service to export JSON data as a CSV
 *
 *
 * Methods
 * * * * * *
 *
 * GenerateCSVContent
 * A method to convert JSON data to CSV format
 *
 * @jsonData {array} An array of objects. The keys from the first item will be used as column headers. All subsequent object keys must match.
 * @mapping {object} Key/Value pairs where Key = Key within your data and Value = column name as you want displayed in export
 * @delimiter {string} (optional) A string of desired column delimiter. Default: ,
 *
 * Example:
 *
 * ocCSVExport.GenerateCSVContent(
 *      [{"Name": "Jimmy", "Age": 14, "Team": "A"}, {"Name": "Johnny", "Age": 15, "Team": "A"}, {"Name": "Timmy", "Age": 10, "Team": "B"}, {"Name": "Tommy", "Age": 17, "Team": "C"}],
 *      {"Name": "Name", "Age": "Age", "Team": "Team Name"}
 * )
 *
 * =>
 *
 * Name,Age,Team Name
 * Jimmy,14,A
 * Johnny,15,A
 * Timmy,10,B
 * Tommy,17,C
 *
 * * * * * *
 */

function ocCSVExport($q, $filter) {
    var service = {
        GenerateCSVContent: _generateCSVContent,
        DownloadFile: _downloadFile,
        FormatData: _formatData
    };

    function _generateCSVContent(jsonData, mapping, delimiter) {
        var deferred = $q.defer();

        validateData(jsonData, mapping, deferred);

        var csvContent = buildCsvData(jsonData, mapping, delimiter);

        deferred.resolve(csvContent);

        return deferred.promise;
    }

    function _downloadFile(content, fileName) {
        var name = angular.isDefined(fileName) ? (fileName.indexOf('.csv') > -1 ? fileName : fileName + '.csv') : 'export.csv';
        var csv = 'data:text/csv;charset=utf-8,' + content;
        var data = encodeURI(csv);
        var link = document.createElement('a');
        link.setAttribute('href', data);
        link.setAttribute('download', name);
        link.click();
    }

    function _formatData(string, format) {
        /*
         encloses string in double quotes to escape commas which
         will otherwise interfere with structure of the csv table.
         formats are provided for convenience but not necessary.
         */
        var csv = '';
        switch(format) {
            case 'date':
                csv =  '\"' + $filter('date')(string) + '\"';
                break;
            case 'currency':
                csv = '\"' + $filter('currency')(string) + '\"';
                break;
            case 'address':
                csv = $filter('address')(string, 'csv');
                break;
            default:
                csv = '\"' + string + '\"';
        }
        return csv;
    }

    function validateData(data, mapping, defer) {
        if (!data) {
            defer.reject({Message: 'Data is a required param', Data: data});
        }
        if (data.constructor != Array) {
            defer.reject({Message: 'Data must be an array', Data: data});
            return;
        }
        if (!data.length) {
            defer.reject({Message: 'Data must provide at least one item', Data: data});
            return;
        }
        if (typeof data[0] != 'object') {
            defer.reject({Message: 'All items within Data must be objects', Data: data});
            return;
        }

        if (!mapping) {
            defer.reject({Message: 'Mapping is a required param', Data: mapping});
        }
        if (mapping.constructor != Object) {
            defer.reject({Message: 'Mapping must be an object', Data: mapping});
        }
        if (!_.keys(mapping).length) {
            defer.reject({Message: 'Mapping must have at least one key/value pair', Data: mapping});
        }
    }

    function buildCsvData(data, mapping, delimiter) {
        var rows = [];
        var keys = _.keys(mapping);
        var columns = _.values(mapping);
        rows.push(columns.join(delimiter || ','));
        angular.forEach(data, function(item) {
            var row = [];
            angular.forEach(keys, function(key) {
                 row.push(item[key]);
            });
            rows.push(row.join(delimiter || ','));
        });
        return rows.join('\n');
    }

    return service;
}