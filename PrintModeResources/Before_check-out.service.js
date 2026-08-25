'use strict';

app.factory('CheckOutService', function($q, $location, $timeout, uiGridConstants, CommonService, Const) {

	// 画面別通信先
	var Action = '/api/check-out';

	var setGridOptions = function($scope) {
		//--------------//
		// 一覧基本設定 //
		//--------------//
		$scope.gridOptions = {
			enableSorting: true,
			enableColumnMenus: false,
			enableHorizontalScrollbar: uiGridConstants.scrollbars.ALWAYS,
			columnDefs: [],
			data: [],
			onRegisterApi: function(gridApi) {
				$scope.gridApi = gridApi;
			}
		};
	};

	var setGridColumnDefs = function($scope) {
		//--------------//
		// 一覧項目設定 //
		//--------------//
		$scope.gridOptions.columnDefs = [
			// [列：エラーエリア]
			{ name: 'error', displayName: "", width: '33', cellClass: 'error-area text-center', pinnedLeft: true, 
				cellTemplate:'<span ng-show="row.entity.status" ng-class="{\'1\': \'text-danger fa fa-exclamation-circle\', \'2\': \'text-warning fa fa-exclamation-triangle\'}[row.entity.status]" ng-title="row.entity.errorMessage" tooltip></span>'},
			{ name: 'fileName', displayName: $scope.title.fileName, headerCellClass: 'text-center'},
			{ name: 'fileNo', displayName: $scope.title.zumenNo, headerCellClass: 'text-center'}
		];
	};

	// ファイル状態を確認
	var initCheckOut = function($scope) {
		var deferred = $q.defer();

		var param = {
			langKey: CommonService.getLanguageKey($scope),
			data: $scope.selectData
		};
		CommonService.httpModal($scope, Action, param, true,
			function(resolveData) {
				// 成功処理
				if (!CommonService.isError(resolveData)) {
					deferred.resolve(resolveData);
				} else {
					// 失敗処理
					CommonService.errorProcess($scope, resolveData);
					deferred.reject();
				}
			},
			function(rejectData, state) {
				// 失敗処理
				CommonService.systemError($scope, state);
			}
		);

		return deferred.promise;
	};

	// 一覧更新
	var updateList = function($scope) {
		$scope.gridOptions.data = $scope.checkoutInfo.data;
		// エラーメッセージ生成
		angular.forEach($scope.checkoutInfo.data, function(line) {
			if (line.message && line.message.length > 0) {
				line.status = Const.STATUS_ERROR; 
				line.errorMessage = line.message.join("<br />");
			}
		});
	};

	return {
		init: function($scope) {
			//----------//
			// 初期処理 //
			//----------//
			// 一覧基本設定
			setGridOptions($scope);

			// 一覧項目設定
			setGridColumnDefs($scope);

			// ファイル状態確認
			var promise = initCheckOut($scope);
			promise.then(
				function(result) {
					// 一覧更新
					$scope.checkoutInfo.data = result;
					// タイトル設定
					$scope.title.fileName = result[0].fileNameTitle;
					$scope.title.zumenNo = result[0].fileNoTitle;
					setGridColumnDefs($scope);
					// 一覧更新
					updateList($scope);
				}
			);
		},
		check: function($scope) {
			$scope.check = {};
			// コメントチェック -> 制限なしに変更
			/*if ($scope.checkoutInfo.comment.length > 1000) {
				$scope.check.comment = CommonService.getMessage($scope, "W00006", ["1000"]);
			}*/
			return Object.keys($scope.check).length == 0;
		},
		checkOut: function($scope) {
			var promise = CommonService.dispMessage($scope, "Q00001", ["checkOut"]);
			promise.then(
				function(result) {
					var data = {};
					data.cad = $scope.checkOutMode == Const.CHECK_OUT_MODE_APPLINK;
					data.comment = $scope.checkoutInfo.comment;
					data.viewable = $scope.checkoutInfo.etsuran;
					data.downloadable = $scope.checkoutInfo.download;
					data.file = [];
					var cadFileName = null;
					angular.forEach($scope.checkoutInfo.data, function(obj) {
						var file = {};
						file.id = obj.id;
						file.updateTimestamp = obj.updateTimestamp;
						this.file.push(file);
						cadFileName = obj.fileName;
					}, data);

					var param = {
						langKey: CommonService.getLanguageKey($scope),
						data: data,
						cadFileName: cadFileName
					};
					var dtlInfo = {
						fileId: []
					};
					angular.forEach(param.data.file, function(obj) {
						dtlInfo.fileId.push(obj.id);
					});
					CommonService.httpModal($scope, Action + "/check-out", param, true,
						function(resolveData) {
							// 成功処理
							if (data.cad) {
								// CAD連携あり
								var reader = new FileReader();
								reader.onload = function(re) {
									var json = JSON.parse(re.target.result);
									$scope.jnlp = CommonService.getJnlpFile(json.fileName, Const.JWS_START_MODE_EXEC);
									if (!CommonService.isIE()) {
										$timeout(function() {
											$('#app-run')[0].click();
										}, 500);
									}
									var promiseRes = CommonService.dispMessage($scope, "I00001", ["checkOut"]);
									promiseRes.then(
										function(result) {
											$scope.close();
											if (CommonService.isIE()) {
												$('#app-run')[0].click();
											}
										},
										function(result) {
											$scope.close();
											if (CommonService.isIE()) {
												$('#app-run')[0].click();
											}
										}
									);
								};
								var blob = new Blob([resolveData], { type: "text/plain" });
								reader.readAsText(blob);
							} else {
								// CAD連携なし
								var fileName = "download_" + CommonService.formatDate.format(new Date(), "yyyyMMddhhmmss") + ".zip";
								CommonService.linkDownload($scope, resolveData, fileName, null, function(scope) {
									var promiseRes = CommonService.dispMessage(scope, "I00001", ["checkOut"]);
									promiseRes.then(
										function(result) {
											scope.close();
										}
									);
								});
							}
							// システム操作ログ登録（成功）
							CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_CHECK_OUT, Const.SOSA_LOG_SOSA_KBN_CHECK_OUT, dtlInfo);
						},
						function(rejectData, state) {
							// 失敗処理
							var reader = new FileReader();
							reader.onload = function(re) {
								var errorJson = {};
								errorJson = JSON.parse(re.target.result);
								if (!errorJson.errorInfo) {
									errorJson = {};
									errorJson.errorInfo = JSON.parse(re.target.result);
								}
								dtlInfo.errorInfo = errorJson.errorInfo;
								CommonService.errorProcess($scope, errorJson, Const.SOSA_LOG_GAMEN_KBN_CHECK_OUT, Const.SOSA_LOG_SOSA_KBN_CHECK_OUT, dtlInfo);
							};
							var blob = new Blob([rejectData], { type: "text/plain" });
							reader.readAsText(blob);
						},
						{responseType: 'arraybuffer'}
					);
				}
			);
		},
	}
});
