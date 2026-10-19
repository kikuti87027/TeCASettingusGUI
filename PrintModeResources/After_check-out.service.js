'use strict';
//【ZUNO_TECA-375】対策済み
// ★修正：サービス宣言の末尾に「StorageService」を正しく追加
app.factory('CheckOutService', function($q, $location, $timeout, uiGridConstants, CommonService, Const, StorageService) {

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

					// ポップアップブロック回避用（CAD連携時のみウィンドウを開く）
					var win = data.cad ? CommonService.windowOpen($scope) : null;
					CommonService.httpModal($scope, Action + "/check-out", param, true,
						function (resolveData) {
							// ========================================================
							// 1. サイズ1KBの「隠れエラーJSON」対策（厳密なエラー判定）
							// ========================================================
							var isRealError = false;
							var parsedJson = null;

							if (resolveData && resolveData.byteLength < 5000) {
								var uintArray = new Uint8Array(resolveData);
								// 先頭が '{' (ASCII: 123) の場合のみJSONパースを試みる
								if (uintArray.length > 0 && uintArray[0] === 123) {
									try {
										var text = new TextDecoder("utf-8").decode(uintArray);
										parsedJson = JSON.parse(text);
										// ★ code または errorInfo を持っている場合のみ「エラー」と判定する
										if (parsedJson && (parsedJson.errorInfo || parsedJson.code)) {
											isRealError = true;
										}
									} catch (e) {
										isRealError = false;
									}
								}
							}

							// 本物のエラーの場合のみエラーダイアログを表示して中断
							if (isRealError && parsedJson) {
								dtlInfo.errorInfo = parsedJson.errorInfo || parsedJson;
								CommonService.errorProcess($scope, parsedJson, Const.SOSA_LOG_GAMEN_KBN_CHECK_OUT, Const.SOSA_LOG_SOSA_KBN_CHECK_OUT, dtlInfo);
								if (win != null) win.close();
								return; // 中断
							}

							// ========================================================
							// 2. 正常なバイナリデータの場合のダウンロード処理
							// ========================================================
							var fileName = "";
							if (data.cad || $scope.checkoutInfo.data.length === 1) {
								fileName = cadFileName; // 単体ファイル名
							} else {
								fileName = "download_" + CommonService.formatDate.format(new Date(), "yyyyMMddhhmmss") + ".zip";
							}

							var blob = new Blob([resolveData], { type: "application/octet-stream" });
							if (window.navigator && window.navigator.msSaveOrOpenBlob) {
								window.navigator.msSaveOrOpenBlob(blob, fileName);
							} else {
								var fileURL = URL.createObjectURL(blob);
								var anchor = document.createElement('a');
								anchor.href = fileURL;
								anchor.download = fileName;
								document.body.appendChild(anchor);
								anchor.click();
								document.body.removeChild(anchor);
								URL.revokeObjectURL(fileURL);
							}

							if (win != null) win.close();

							if (data.cad) {
								var skipGuide = StorageService.getData('skipAppLaunchGuide');
								if (!skipGuide) {
									var template = "app/guide-modal/guide-modal.html";
									var controller = "GuideModalController";
									CommonService.openModal($scope, template, controller);
								}
								$scope.close();
							} else {
								var promiseRes = CommonService.dispMessage($scope, "I00001", ["checkOut"]);
								promiseRes.then(function (result) {
									$scope.close();
								});
							}

							CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_CHECK_OUT, Const.SOSA_LOG_SOSA_KBN_CHECK_OUT, dtlInfo);
						},

					//-------------------------------

						function(rejectData, state) {
							// 失敗処理
							var reader = new FileReader();
							reader.onload = function(re) {
								var errorJson = {};
								try {
									errorJson = JSON.parse(re.target.result);
								} catch(e) {}
								dtlInfo.errorInfo = errorJson.errorInfo || {};
								CommonService.errorProcess($scope, errorJson, Const.SOSA_LOG_GAMEN_KBN_CHECK_OUT, Const.SOSA_LOG_SOSA_KBN_CHECK_OUT, dtlInfo);
							};
							var blob = new Blob([rejectData], { type: "text/plain" });
							reader.readAsText(blob);

							if (win != null) win.close();
						},
						{ responseType: 'arraybuffer' }
					);
				}
			);
		},
	}
});