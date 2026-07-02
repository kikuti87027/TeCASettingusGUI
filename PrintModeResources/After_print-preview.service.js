// 2026-7-1 クライアント印刷ドライバ対応
// ファイルごと差し替えで対応すること
//
'use strict';

app.factory('PrintPreviewService', function($q, $http, $location, $translate, $sessionStorage, $rootScope, $timeout, CommonService, Const, StorageService) {

	// 画面別通信先
	var ACTION = '/api/print-preview';
	var ACTION_BASE_IMAGE = ACTION + '/get-pdf-image';
	var ACTION_OUIN_IMAGE = ACTION + "/image";
	var ACTION_OUIN_TEXT = ACTION + "/ouin-text";
	var ACTION_PRINT = ACTION + "/print";

	// 一覧基本設定
	var setGridOptions = function($scope) {
		// ファイルリスト設定
		$scope.fileList_gridOptions = {
			enableRowSelection: true,
			enableRowHeaderSelection: false,
			enableHiding: false,
			enableColumnMenus: false,
			enableExpandAll: false,
			multiSelect: false,
			modifierKeysToMultiSelect: false,
			noUnselect: true,
			columnDefs: [],
			data: [],
			onRegisterApi: function(gridApi) {
				$scope.gridApi = gridApi;
				// 行選択処理イベント
				gridApi.selection.on.rowSelectionChanged($scope, function(row) {
					// デフォルトモードに変更
					$scope.modeDefault();
					// 現在表示ファイル番号を設定
					$scope.currentFile = row.entity.fileNo;
					// ファイル情報エリア（明細部）設定
					setFilePageSizeInfo($scope);
					// PDFページ画像更新
					setRaphaelData($scope, $scope.pdfData[$scope.currentFile].dispPage);
				});
			}
		};
	}

	// 一覧項目設定
	var setGridColumnDefs = function($scope) {
		// エラーは必ず表示
		$scope.fileList_gridOptions.columnDefs.push({ id: -1, name: 'error', displayName: '', width: '33', cellClass: 'error-area text-center',
			cellTemplate:'<span ng-show="row.entity.status" ng-class="{\'1\': \'text-danger fa fa-exclamation-circle\', \'2\': \'text-warning fa fa-exclamation-triangle\'}[row.entity.status]" ng-title="row.entity.errorMessage" tooltip></span>'});

		angular.forEach($scope.zokuseiList, function(column, index) {
			// [列：属性項目（ファイル名, 図面番号）]
			var columnDef = { id: index, name: 'zokuseiList[' + index + '].label', displayName: column.name, enableCellEdit: false };
			$scope.fileList_gridOptions.columnDefs.push(angular.copy(columnDef));
		});
	}

	// 印刷プレビュー 事前処理
	var getPrePrintPreview = function($scope) {
		var param = {
			data: $scope.paramFileInfo,
			id: $scope.paramOinId,
			langKey: CommonService.getLanguageKey($scope)
		};
		CommonService.httpModal($scope, ACTION, param, true,
			function(resolveData) {
				// 成功処理
				if (!CommonService.isError(resolveData)) {
					// 初期処理
					$scope.init = true;
					// ファイルエリアを閉じる
					$scope.status.isOpen = false;
					// 現在のファイルを設定（初期値）
					$scope.currentFile = 0;

					// 用紙サイズドロップダウンの生成
					$scope.m_yoshi_size = [];
					// 『原稿サイズ』を先頭に追加
					$scope.m_yoshi_size.push({id: 0, name: $translate.instant('original_size'), dispName: $translate.instant('original_size')});
					// 用紙サイズマスタ情報を追加
					angular.forEach(resolveData.yoshiSize, function(column) {
						// ドロップダウン表示用名称の設定
						column.dispName = column.name + '(' + column.tampen + '×' + column.chohen + ')';
						$scope.m_yoshi_size.push(column);
					});

					// ファイル情報エリア明細リストヘッダー情報の設定
					$scope.zokuseiList = resolveData.zokusei;
					// ファイル情報エリア明細リスト項目の設定
					setGridColumnDefs($scope);

					// ファイル情報の設定
					$scope.pdfData = [];
					angular.forEach(resolveData.file, function(fileData, index) {
						var file = fileData.fileInfo;
						// ファイル番号の設定（インデックス）
						file.fileNo = index;
						// 版管理IDの設定
						file.hanKanriId = $scope.paramFileInfo[index].hanKanriId;
						// ファイル名の設定
						file.fileName = file.zokuseiList[0].label;
						// 図面番号の設定
						file.zumenNo = file.zokuseiList[1].label;
						// 全ページ数の設定
						file.totalPageCount = fileData.totalPageCount;
						// 表示ページ番号の設定
						file.dispPage = 1;
						// 自動押印情報を設定
						file.ouinInfo = fileData.pdfEdit;
						// 対応ページ・全ページフラグを設定
						file.allPage = true;
						// ページ情報の設定
						file.pageInfo = {};
						// 押印情報
						file.rectangle = [];
						for (var lp = 0; lp < file.totalPageCount; lp++) {
							// ページ情報として、押印情報、用紙サイズID、ページサイズ(ピクセル値) をセット
							file.pageInfo[lp] = {
								yoshiSizeId: 0,
								pageSize: {}
							};
						}
						// ユーザパスワードの設定
						file.userPassword = $scope.paramFileInfo[index].userPassword;
						// ファイル情報に追加
						$scope.pdfData.push(file);
					});
					// ファイル情報エリア明細リストデータの設定
					$scope.fileList_gridOptions.data = $scope.pdfData;

					// 最初のファイルを選択
					$scope.gridApi.grid.modifyRows($scope.fileList_gridOptions.data);
					$scope.gridApi.selection.selectRow($scope.fileList_gridOptions.data[$scope.currentFile]);

				} else {
					// 失敗処理
					CommonService.errorProcess($scope, resolveData);
				}
			},
			function(rejectData, state) {
				// 失敗処理
				CommonService.systemError($scope, state);
			}
		);
	};

	var setRaphaelBase = function($scope) {
		var screenWidth = CommonService.getElementInfo('panePdfBody', 'clientWidth');
		var screenHeight = CommonService.getElementInfo('panePdfBody', 'clientHeight');
		$scope.raphael = Raphael('base', screenWidth, screenHeight);
	};

	var getBaseImage = function($scope, page) {
		var deferred = $q.defer();
		if ($scope.baseImage.image) {
			$scope.baseImage.image.remove();
		}
		$scope.baseImage.image = null;
		if (page == 0) {
			// 最終ページ
			page = -1;
		}
		// PDFイメージ取得
		var param = {
			data: {
				hanKanriId: $scope.pdfData[$scope.currentFile].hanKanriId,
				password: $scope.pdfData[$scope.currentFile].userPassword,
				pageNo: page,
				maxPixels: null,
				printPreviewMode: true
			},
			langKey: CommonService.getLanguageKey($scope)
		};

		CommonService.httpModal($scope, ACTION_BASE_IMAGE, param, true,
			function(resolveData) {
				// 成功処理
				var reader = new FileReader();
				reader.onload = function(re) {
					var img = $('<img>');
					img[0].src = re.target.result;
					$timeout(function () {
						// 直後はイメージが取得できない
						$scope.baseImage.image = $scope.raphael.image(re.target.result, 0, 0, img[0].width, img[0].height);
						$scope.baseImage.width = img[0].width;
						$scope.baseImage.height = img[0].height;
						$scope.resizeImage($scope.slider.value);
						var dispPage = $scope.pdfData[$scope.currentFile].dispPage;
						$scope.pdfData[$scope.currentFile].pageInfo[dispPage - 1].pageSize = { width: img[0].width, height: img[0].height };
						$scope.$apply();
						deferred.resolve();
						if (CommonService.isFirefox()) {
							$('image').attr('onmousedown', 'return false');
						}
					}, 500);
				};
				var blob = new Blob([resolveData], {type : 'imapge/png'});
				reader.readAsDataURL(blob);
			},
			function(rejectData, state) {
				CommonService.serverResponseError($scope, rejectData, state);
				deferred.reject();
			},
			{responseType: 'arraybuffer'}
		);
		return deferred.promise;
	};

	// Raphael全要素削除
	var removeRaphaelData = function($scope) {
		angular.forEach($scope.raphaelElements, function(element) {
			elementRemove(element);
		});
		$scope.raphaelElements = [];
	};

	// Raphael要素生成
	var setRaphaelData = function($scope, page) {
		// Raphael要素削除
		removeRaphaelData($scope);

		var promise = getBaseImage($scope, page);
		promise.then(
			function() {
				if ($scope.init) {
					// 初期設定時は取得した自動押印情報を設定する
					angular.forEach($scope.pdfData, function(file) {
						angular.forEach(file.ouinInfo, function(obj, index) {
							// 押印情報にファイル番号を設定
							obj.fileNo = file.fileNo;
							// 押印情報反映処理
							ouin($scope, obj, index);
						});
					});
					$scope.init = false;
				}

				// 押印イメージ取得
				var processItemsDeferred = [];
				angular.forEach($scope.pdfData[$scope.currentFile].rectangle, function(rectangle) {
					angular.forEach(rectangle.oinIchiDtl, function(oinIchiDtl) {
						// 全ページ 及び 対象ページのみを対象とする
						if (oinIchiDtl.pageNo == 0 || oinIchiDtl.pageNo == page) {
							// データタイプが[イメージ] 且つ データソースが設定されていない場合のみ対象とする
							if (oinIchiDtl.type == Const.RAPHAEL_TYPE_IMAGE && CommonService.isEmpty(oinIchiDtl.src)) {
								processItemsDeferred.push(getOuinImage($scope, oinIchiDtl));
							}
						}
					});
				});
				$.when.apply($, processItemsDeferred)
					.then(function() {
						// イメージデータの取得が完了後、同期的に押印情報を設定する。
						$scope.setRectangleIndex = 0;
						createOuinRectangle($scope);
					});
			},
			function() {
				// 呼出し元でエラーダイアログ表示
			}
		);
	};

	var getOuinImage = function($scope, oinIchiDtl) {
		var deferred = $.Deferred();
		// 押印位置生成
		var param = {
			id: oinIchiDtl.kyotsuInId,
			date: new Date().getTime(),
			langKey: CommonService.getLanguageKey($scope)
		};
		if (oinIchiDtl.hyojiNaiyoKbn == Const.OIN_ICHI_KBN_KOJIN_DATE_FALSE || oinIchiDtl.hyojiNaiyoKbn == Const.OIN_ICHI_KBN_KOJIN_DATE_TRUE) {
			// 個人印

			// 個人印（日付有り）の場合のみ、現在の日付を設定
			param.type = 1;
			if (oinIchiDtl.hyojiNaiyoKbn == Const.OIN_ICHI_KBN_KOJIN_DATE_FALSE) {
				param.date = 0;
			}
		} else if (oinIchiDtl.hyojiNaiyoKbn == Const.OIN_ICHI_KBN_KYOTSU_IN) {
			// 共通印
			param.type = 2;
		}

		if (!oinIchiDtl.time) {
			oinIchiDtl.time = param.date;
		}
		// 初期処理時はイメージの取得を行わない
		httpMarkImage($scope, oinIchiDtl, param, setImagePosition, deferred);
		return deferred.promise();
	}

	// 押印情報を同期的に作成
	var createOuinRectangle = function($scope) {
		if (CommonService.parseInt($scope.setRectangleIndex) + 1 > $scope.pdfData[$scope.currentFile].rectangle.length) {
			// インデックスが押印情報の数より大きい場合、処理終了
			return;
		}
		$scope.pdfData[$scope.currentFile].rectangle[$scope.setRectangleIndex].type = Const.RAPHAEL_TYPE_MARK_POSITION;
		$scope.setOuinDtlIndex = 0;
		setOuinDtl($scope);
	}

	// 押印詳細情報を同期的に作成
	var setOuinDtl = function($scope) {
		var obj = $scope.pdfData[$scope.currentFile].rectangle[$scope.setRectangleIndex];
		if ($scope.setOuinDtlIndex >= obj.oinIchiDtl.length) {
			// インデックスが押印詳細情報の数より大きい場合、処理終了し次の押印情報の処理を行う
			$scope.setRectangleIndex += 1;
			createOuinRectangle($scope);
			return;
		}
		var oinIchiDtl = obj.oinIchiDtl[$scope.setOuinDtlIndex];
		if (oinIchiDtl.pageNo == 0 || oinIchiDtl.pageNo == $scope.pdfData[$scope.currentFile].dispPage) {
			// 全ページ 又は 表示ページ の押印情報のみ設定する
			//ファイル番号をセット
			oinIchiDtl.fileNo = obj.fileNo;
			createMarkPosition($scope, obj.id, oinIchiDtl);
		} else {
			// 対象外ページの情報の場合は処理を飛ばす
			$scope.setOuinDtlIndex += 1;
			setOuinDtl($scope);
		}
	};

	// Raphael指定要素削除
	var elementRemove = function(element) {
		if (element) {
			var text = element.data('text');
			if (text) {
				text.remove();
			}
			element.remove();
		}
	};

	var setMaskTextPosition = function($scope, element) {
		var text = element.data('text');
		if (text) {
			var transform = Raphael.parseTransformString(text.transform());
			var rotate = 0;
			if (!CommonService.isEmpty(transform)) {
				angular.forEach(transform, function(trans) {
					if (trans[0] == "r") {
						rotate = trans[1];
					}
				});
			}
			text.transform('');
			var block = text.getBBox(false);
			text.attr('x', element.attr('x'));
			text.attr('y', element.attr('y') + block.height / 2);
			if (rotate != 0) {
				CommonService.setPdfOuinTextRotate(element, rotate);
			}
			// 処理したページNo記憶
			var data = element.data('data');
			data.movePageNo = $scope.pdfData[$scope.currentFile].dispPage;
		}
	};

	var setMaskTextFit = function($scope, element) {
		var text = element.data('text');
		if (!text) {
			return;
		}
		var data = element.data('data');
		if (!data.existWidthHeightFlg) {
			// 幅・高さ未登録
			if (data.rotate == 0) {
				var block = text.getBBox(false);
				data.width = block.width;
				data.height = block.height;
				element.attr({width: data.width, height: data.height});
			}
		} else {
			// 幅・高さ登録済み
			CommonService.setPdfOuinTextFit(data, text, data.hyojiString, element);
		}

		setMaskTextPosition($scope, element);
	};

	var createOuin = function($scope, obj) {
		// 押印位置
		obj.type = Const.RAPHAEL_TYPE_MARK_POSITION;
		angular.forEach(obj.oinIchiDtl, function(oinIchiDtl) {
			//ファイル番号をセット
			oinIchiDtl.fileNo = obj.fileNo;
			createMarkPosition($scope, obj.id, oinIchiDtl);
		});
	};

	// サーバーから印影画像取得
	var httpMarkImage = function($scope, data, param, callbackLoadEnd, deferred) {
		CommonService.httpModal($scope, ACTION_OUIN_IMAGE, param, true,
			function(resolveData) {
				// 成功処理
				var reader = new FileReader();
				reader.onload = function(re) {
					if (re.target.result.length > 5) {
						var img = $('<img>');
						img[0].src = re.target.result;
						$timeout(function () {
							// 直後はイメージが取得できない
							if (angular.isUndefined(data.x)) {
								data.x = 0;
							}
							if (angular.isUndefined(data.y)) {
								data.y = 0;
							}
							if (angular.isUndefined(data.width)) {
								data.width = img[0].width;
							}
							if (angular.isUndefined(data.height)) {
								data.height = img[0].height;
							}
							if (data.sx && data.sy) {
								data.x = data.sx - data.width / 2;
								data.y = data.sy - data.height / 2;
							}
							data.src = re.target.result;
							if (callbackLoadEnd) {
								callbackLoadEnd($scope, data, img);
							}
							if (deferred) {
								deferred.resolve();
							}
						}, 500);
					} else {
						//データが取得出来ない場合
						data.type = Const.RAPHAEL_TYPE_IMAGE;
						if (deferred) {
							deferred.resolve();
						}
					}
				};
				var blob = new Blob([resolveData], {type : 'imapge/png'});
				reader.readAsDataURL(blob);
			},
			function(rejectData, state) {
				CommonService.serverResponseError($scope, rejectData, state);
			},
			{responseType: 'arraybuffer'}
		);
	};

	// 個人印生成
	var createUserMark = function($scope, data, id) {
		//データタイプの設定
		data.type = Const.RAPHAEL_TYPE_IMAGE;
		var time =  new Date().getTime();
		if (id == -Const.OIN_ICHI_KBN_KOJIN_DATE_FALSE) {
			time = 0;
		}
		if (!data.time) {
			data.time = time;
		}
		if (data.src) {
			createImage($scope, data.src, data);
		}
	};

	// 共通印生成
	var createCommonMark = function($scope, data, id) {
		//データタイプの設定
		data.type = Const.RAPHAEL_TYPE_IMAGE;
		if (!data.time) {
			data.time =  new Date().getTime();;
		}
		if (data.src) {
			createImage($scope, data.src, data);
		}
	};

	// 押印位置文字列生成
	var createOuinText = function($scope, id, data) {
		// データタイプの設定
		data.type = Const.RAPHAEL_TYPE_MARK_POSITION;
		if (angular.isUndefined(data.x)) {
			CommonService.setPdfOuinTextInfo(data);
		}
		// テキスト位置設定
		CommonService.setPdfOuinTextPosition($scope, data, data.hyojiString);
		if (!$scope.init) {
			// 初期処理時は矩形データ作成を行わない
			createRect($scope, data);
		}
	};

	// 押印画像位置設定
	var setImagePosition = function($scope, data, img) {

		if (angular.isUndefined(img)) {
			var img = [{
				width: data.width,
				height: data.height
			}];
		}

		// 座標変換
		if (data.positionKijunKbn == Const.POSITION_BASE_RT) {
			// 右上
			data.x = $scope.baseImage.width - img[0].width - data.positionX;
			data.y = data.positionY;
		} else if (data.positionKijunKbn == Const.POSITION_BASE_LB) {
			// 左下
			data.x = data.positionX;
			data.y = $scope.baseImage.height - img[0].height - data.positionY;
		} else if (data.positionKijunKbn == Const.POSITION_BASE_RB) {
			// 右下
			data.x = $scope.baseImage.width - img[0].width - data.positionX;
			data.y = $scope.baseImage.height - img[0].height - data.positionY;
		} else if (data.positionKijunKbn == Const.POSITION_BASE_CT) {
			// 中央
			data.x = $scope.baseImage.width / 2  - img[0].width / 2 + data.positionX;
			data.y = $scope.baseImage.height / 2 - img[0].height / 2 + data.positionY;
		} else {
			// 左上
			data.x = data.positionX;
			data.y = data.positionY;
		}

		data.width = img[0].width;
		data.height = img[0].height;
	};

	// 座標から基準座標設定
	var setBasePosition = function($scope, data) {

		if (!data.positionKijunKbn) {
			// 左上
			data.positionKijunKbn = Const.POSITION_BASE_LT;
			data.positionX = data.x;
			data.positionY = data.y;
			return;
		}

		var page = data.pageNo;
		if (page == 0 && data.movePageNo) {
			page = data.movePageNo;
		}

		var baseImage = $scope.pdfData[data.fileNo].pageInfo[page - 1].pageSize;
		if (!baseImage) {
			return;
		}

		var width = data.width;
		var height = data.height;

		if (data.positionKijunKbn == Const.POSITION_BASE_RT) {
			// 右上
			data.positionX = baseImage.width - (data.x + width);
			data.positionY = data.y;
		} else if (data.positionKijunKbn == Const.POSITION_BASE_LB) {
			// 左下
			data.positionX = data.x;
			data.positionY = baseImage.height - (data.y + height);
		} else if (data.positionKijunKbn == Const.POSITION_BASE_RB) {
			// 右下
			data.positionX = baseImage.width - (data.x + width);
			data.positionY = baseImage.height - (data.y + height);
		} else if (data.positionKijunKbn == Const.POSITION_BASE_CT) {
			// 中央
			data.positionX = data.x - (baseImage.width / 2 - width / 2);
			data.positionY = data.y - (baseImage.height / 2 - height / 2);
		} else {
			// 左上
			data.positionX = data.x;
			data.positionY = data.y;
		}
	}

	// 押印位置生成
	var createMarkPosition = function($scope, id, data) {

		if (data.hyojiNaiyoKbn == Const.OIN_ICHI_KBN_KOJIN_DATE_FALSE) {
			// 個人印(日付なし)
			createUserMark($scope, data, -Const.OIN_ICHI_KBN_KOJIN_DATE_FALSE);
		} else if (data.hyojiNaiyoKbn == Const.OIN_ICHI_KBN_KOJIN_DATE_TRUE) {
			// 個人印(日付あり)
			createUserMark($scope, data, -Const.OIN_ICHI_KBN_KOJIN_DATE_TRUE);
		} else if (data.hyojiNaiyoKbn == Const.OIN_ICHI_KBN_KYOTSU_IN) {
			// 共通印
			createCommonMark($scope, data, data.kyotsuInId);
		} else if (data.hyojiNaiyoKbn == Const.OIN_ICHI_KBN_TEXT) {
			// 文字列
			createOuinText($scope, id, data);
		}
	};

	// 印刷データ生成
	var createPrintData = function($scope) {
		var printData = [];
		angular.forEach($scope.pdfData, function(pdfData) {
			var data = {};
			data.hanKanriId = pdfData.hanKanriId;
			data.userPassword = pdfData.userPassword;
			data.editInfo = [];
			data.yoshiSize = []
			angular.forEach(pdfData.pageInfo, function(pageInfo, i) {
				var page = CommonService.parseInt(i, 0) + 1;

				var yoshiSizeInfo = {
					page: page,
					id: pageInfo.yoshiSizeId
				}
				data.yoshiSize.push(yoshiSizeInfo);
			});
			angular.forEach(pdfData.rectangle, function(rectangle) {
				// 押印位置
				angular.forEach(rectangle.oinIchiDtl, function(oinIchiDtl) {
					data.editInfo.push(createPdfHenshuExt($scope, oinIchiDtl));
				});
			});

			printData.push(data);
		});

		return printData;
	};

	var createPdfHenshuExt = function($scope, rectangle) {
		var pdfHenshuExt = {};
		pdfHenshuExt.henshuKbn = rectangle.type == Const.RAPHAEL_TYPE_IMAGE ? Const.RAPHAEL_TYPE_IMAGE : Const.RAPHAEL_TYPE_RECT;
		pdfHenshuExt.string = rectangle.hyojiString;
		if (rectangle.movePageNo) {
			setBasePosition($scope, rectangle);
		}
		pdfHenshuExt.positionKijunKbn = rectangle.positionKijunKbn;
		pdfHenshuExt.positionX = rectangle.positionX;
		pdfHenshuExt.positionY = rectangle.positionY;
		pdfHenshuExt.width = rectangle.width;
		pdfHenshuExt.height = rectangle.height;
		pdfHenshuExt.pageNo = rectangle.pageNo;
		pdfHenshuExt.fontNameKbn = rectangle.fontNameKbn;
		pdfHenshuExt.fontSize = rectangle.fontSize;
		pdfHenshuExt.fontColorR = rectangle.fontColorR;
		pdfHenshuExt.fontColorG = rectangle.fontColorG;
		pdfHenshuExt.fontColorB = rectangle.fontColorB;
		pdfHenshuExt.kakudo = rectangle.rotate;
		pdfHenshuExt.tokasei = Math.round((1 - rectangle.fillOpacity) * 100);
		pdfHenshuExt.backgroundColorR = rectangle.fillFlag ? rectangle.fillColorR : null;
		pdfHenshuExt.backgroundColorG = rectangle.fillFlag ? rectangle.fillColorG : null;
		pdfHenshuExt.backgroundColorB = rectangle.fillFlag ? rectangle.fillColorB : null;

		pdfHenshuExt.printDate = rectangle.time || null;
		pdfHenshuExt.kyotsuInId = rectangle.kyotsuInId;

		return pdfHenshuExt;
	};

	var setMouseover = function($scope, element) {
		if (element) {
			element.mouseover(function(e) {
				if ($scope.mode == Const.PDF_EDIT_MODE_SELECT) {
					this.attr('cursor', Const.CURSOR_MOVE);
				} else {
					this.attr('cursor', Const.CURSOR_DEFAULT);
				}
				var data = this.data("data");
				if (data && data.type != Const.RAPHAEL_TYPE_IMAGE) {
					// マスキング
					element.attr({
						"stroke-width": 2,
						"stroke": "red"
					});
				} else {
					// テキスト
					var parent = this.data('parent');
					if (parent) {
						parent.attr({
							"stroke-width": 2,
							"stroke": 'red'
						});
					}
				}
			});
			element.mouseout(function(e) {
				var data = this.data("data");
				if (data && data.type != Const.RAPHAEL_TYPE_IMAGE) {
					// マスキング
					element.attr({
						"stroke-width": 0
					});
				} else {
					// テキスト
					var parent = this.data('parent');
					if (parent) {
						parent.attr({
							"stroke-width": 0
						});
					}
				}
			});
		}
	};

	// 印刷
	var print = function($scope) {
		// エラー情報を初期化
		angular.forEach($scope.fileList_gridOptions.data, function(d) {
			d.status = 0;
			d.errorMessage = '';
		});
		var data = createPrintData($scope);
		var param = {
			langKey: CommonService.getLanguageKey($scope),
			data: data
		};
		var dtlInfo = {
			hanKanriId: [],
				oinIchiId: $scope.paramOinId
		};
		for (var idx in data) {
			dtlInfo.hanKanriId.push(data[idx].hanKanriId);
		}

		// iOS の場合新規タブを開く
		var win = CommonService.windowOpen($scope);

		CommonService.httpModal($scope, ACTION_PRINT, param, false,
			function(resolveData) {
				// 成功処理
				if (!CommonService.isError(resolveData)) {
					// システム操作ログ登録（成功）
					CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_PRINT, dtlInfo, $scope.paramSosaDtlKbn);
					
					// サーバーが生成した一時PDFファイルのダウンロードURLを取得
					var pdfUrl = CommonService.getPrintFile(resolveData.fileName);

					// iOS環境およびiOS Chrome（CriOS）の判定
					var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
					var isIOSChrome = /CriOS/i.test(navigator.userAgent);

					// パターン①: iOS Chrome環境（ポップアップブロックおよび画面遷移によるセッション切断の防止）
					if (isIOS && isIOSChrome) {
						if (win != null) {
							win.close();
						}
						var chromeIframe = document.createElement('iframe');
						chromeIframe.style.display = 'none';
						chromeIframe.src = pdfUrl;
						document.body.appendChild(chromeIframe);
						
						setTimeout(function() {
							document.body.removeChild(chromeIframe);
						}, 1000);

						$timeout(function() {
							$scope.cancel();
						}, 500);
						return;
					}

					// パターン②: iOS Safari等（別タブが正常に維持されている場合、手動印刷へ誘導）
					if (win != null && typeof win === 'object' && !win.closed) {
						win.location.href = pdfUrl;
						$timeout(function() {
							$scope.cancel();
						}, 500);
						return;
					}

					// パターン③: Windows/PC環境（PDFビューアのフリーズとプリンタ切り替え時の強制終了を完全対策）
					$http.get(pdfUrl, { responseType: 'arraybuffer' }).then(function(response) {
						var blob = new Blob([response.data], { type: 'application/pdf' });
						var blobUrl = URL.createObjectURL(blob);

						var iframe = document.createElement('iframe');
						// 画面外に置くとChromeがPDFの描画を凍結（サスペンド）して真っ白になるため、
						// 画面内（右下隅）に透明かつ極小で配置し、レンダリングプロセスを強制的にフル稼働させます。
						iframe.style.position = 'fixed';
						iframe.style.right = '0';
						iframe.style.bottom = '0';
						iframe.style.width = '1px';
						iframe.style.height = '1px';
						iframe.style.opacity = '0';
						iframe.style.pointerEvents = 'none';
						iframe.style.border = 'none';
						iframe.src = blobUrl;
						
						iframe.onload = function() {
							// iframe自体のロード完了後、内蔵PDFビューアが起動してパースを完了するまで300ms待つ（真っ白タイムアウト対策）
							setTimeout(function() {
								try {
									iframe.contentWindow.focus();
									iframe.contentWindow.print(); // 印刷ダイアログの起動
								} catch (e) {
									console.error("印刷ダイアログの起動に失敗しました", e);
								}
								// ※プリンタ切り替え時の再描画に必要なため、自動での画面遷移(cancel)やオブジェクト解放は行いません。
							}, 300);
						};
						document.body.appendChild(iframe);
					}, function(reject) {
						console.error("PDFバイナリの取得に失敗しました", reject);
					});

				} else {
					// 失敗処理
					CommonService.errorProcess($scope, resolveData, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_PRINT, dtlInfo, $scope.paramSosaDtlKbn);
					if (win != null) {
						win.close();
					}
				}
			},
			function(rejectData, state) {
				// 失敗処理
				if (state != 'cancel') {
					var errorJson = {
						'errorInfo': rejectData
					};
					// リストにエラーメッセージをセット
					setErrorMessage($scope, rejectData.details);
					CommonService.errorProcess($scope, errorJson, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_PRINT, dtlInfo, $scope.paramSosaDtlKbn);
				} else {
					// 一時保存ファイルの削除
					var param = { 'filename': rejectData.fileName };
					CommonService.httpPost('/api/jnlp/remove', param, function(resolveData) {}, function(rejectData) {});
				}
				if (win != null) {
					win.close();
				}
			}
		);
	};

	// 押印情報反映
	var ouin = function($scope, obj, index) {
		if (!obj) {
			return;
		}
		var data = angular.copy(obj);
		// ページ外は削除
		var idx = 0;
		while (true && data.oinIchiDtl) {
			if (idx >= data.oinIchiDtl.length) {
				break;
			}
			var obj = data.oinIchiDtl[idx];
			if (obj.pageNo > $scope.pdfData[data.fileNo].totalPageCount) {
				data.oinIchiDtl.splice(idx, 1);
			} else {
				idx++;
			}
		}
		data.src = null;
		createOuin($scope, data, index);
		data.oid = null;
		var dispPage = $scope.pdfData[data.fileNo].dispPage;
		$scope.pdfData[data.fileNo].rectangle.push(data);
	};

	// Raphael イメージデータ作成
	var createImage = function($scope, src, data) {

		// 押印画像位置の設定
		setImagePosition($scope, data);

		// 対象ファイル以外は処理しない
		if (data.fileNo != $scope.currentFile) {
			data.type = Const.RAPHAEL_TYPE_IMAGE;
			return;
		}

		// 対象ページ以外は処理しない
		if (!(data.pageNo == 0 || data.pageNo == $scope.pdfData[$scope.currentFile].dispPage)) {
			data.type = Const.RAPHAEL_TYPE_IMAGE;
			return;
		}

		// イメージデータ作成
		var image = $scope.raphael.image(src, data.x, data.y, data.width, data.height);
		$scope.raphaelElements.push(image);
		if (CommonService.isEmpty(data.oid)) {
			image.drag(
				function(dx, dy) {
					if ($scope.mode != Const.PDF_EDIT_MODE_SELECT) {
						// 選択モード以外
						return;
					}

					var data = this.data("data");

					// 移動
					var x = this.ox + dx / $scope.slider.scale;
					var y = this.oy + dy / $scope.slider.scale;
					this.attr({x: x, y: y });
					data.x = x;
					data.y = y;
				},
				function() {
					// 開始
					this.ox = this.attr("x");
					this.oy = this.attr("y");
				},
				function() {
					// 終了
					// カーソルの設定
					this.attr("cursor", Const.CURSOR_DEFAULT);
					// 処理したページNo記憶
					var data = this.data("data");
					data.movePageNo = $scope.pdfData[$scope.currentFile].dispPage;
					// ベースポジションの設定
					setBasePosition($scope, data);
				}
			);
			CommonService.setRahaelTouchEvent($scope, image);
			setMouseover($scope, image);
		}

		// イメージ情報の設定
		data.type = Const.RAPHAEL_TYPE_IMAGE;
		image.data("data", data);

		if (CommonService.isFirefox()) {
			$('image').attr('onmousedown', 'return false');
		}

		//  押印詳細情報インデックスが存在する場合、次の取得処理を行う
		if (angular.isDefined($scope.setOuinDtlIndex)) {
			$scope.setOuinDtlIndex += 1;
			setOuinDtl($scope);
		}
	};

	// Raphael 矩形データ作成
	var createRect = function($scope, data) {

		// 対象ファイル以外は処理しない
		if (data.fileNo != $scope.currentFile) {
			return;
		}

		// 対象ページ以外は処理しない
		if (!(data.pageNo == 0 || data.pageNo == $scope.pdfData[$scope.currentFile].dispPage)) {
			return;
		}

		// 矩形データ作成
		var mask = $scope.raphael.rect(data.x, data.y, data.width, data.height);
		$scope.raphaelElements.push(mask);
		if (data.fillFlag) {
			mask.attr("fill-opacity", data.fillOpacity);
		} else {
			mask.attr("fill-opacity", 0);
		}
		mask.attr("fill", CommonService.setColor(data.fillColorR, data.fillColorG, data.fillColorB));
		mask.attr("stroke-width", 0);
		mask.drag(
			function(dx, dy) {
				if ($scope.mode != Const.PDF_EDIT_MODE_SELECT) {
					// 選択モード以外
					return;
				}
				var data = this.data("data");
				// 移動
				var x = this.ox + dx / $scope.slider.scale;
				var y = this.oy + dy / $scope.slider.scale;
				this.attr({x: x, y: y });
				data.x = x;
				data.y = y;

				// 文字列移動
				setMaskTextPosition($scope, this);
			},
			function() {
				// 開始
				this.ox = this.attr("x");
				this.oy = this.attr("y");
			},
			function() {
				// 終了
				// カーソルの設定
				this.attr("cursor", Const.CURSOR_DEFAULT);
				// ベースポジションの設定
				setBasePosition($scope, data);
			}
		);
		CommonService.setRahaelTouchEvent($scope, mask);
		setMouseover($scope, mask);

		mask.data("data", data);
		var text = null;
		text = createText($scope, mask, data);
		mask.data("text", text);
		// コメントフィット
		setMaskTextFit($scope, mask);
		return mask;
	};

	// Raphael テキストデータ作成
	var createText = function($scope, parent, data) {
		var text = $scope.raphael.text(parent.attr("x"), parent.attr("y"), "");
		parent.data("text", text);
		text.data("parent", parent);
		text.drag(
			function(dx, dy) {
				if ($scope.mode != Const.PDF_EDIT_MODE_SELECT) {
					// 選択モード以外
					return;
				}
				var parent = this.data("parent");
				var data = parent.data("data");
				// 移動
				var x = parent.ox + dx / $scope.slider.scale;
				var y = parent.oy + dy / $scope.slider.scale;
				parent.attr({x: x, y: y });
				data.x = x;
				data.y = y;

				// 文字列移動
				setMaskTextPosition($scope, parent);
			},
			function() {
				// 開始
				var parent = this.data("parent");
				parent.ox = parent.attr("x");
				parent.oy = parent.attr("y");
			},
			function() {
				// 終了
				// カーソルの設定
				this.attr("cursor", Const.CURSOR_DEFAULT);
				// ベースポジションの設定
				setBasePosition($scope, data);
			}
		);
		CommonService.setRahaelTouchEvent($scope, text);
		setMouseover($scope, text);

		text.attr("text-anchor", "start");
		text.attr("text", data.hyojiString);
		text.attr("font-family", CommonService.getFontName(data.font));
		text.attr("font-size", data.fontSize);
		text.attr("fill", CommonService.setColor(data.fontColorR, data.fontColorG, data.fontColorB));
		text.attr("fill-opacity", data.fillOpacity);
		var transform = Raphael.parseTransformString(text.transform());
		if (!CommonService.isEmpty(transform)) {
			text.transform("");
		}
		CommonService.setPdfOuinTextRotate(text.data("parent"), -data.rotate);
		setMaskTextPosition($scope, parent);

		//  押印詳細情報インデックスが存在する場合、次の取得処理を行う
		if (angular.isDefined($scope.setOuinDtlIndex)) {
			$scope.setOuinDtlIndex += 1;
			setOuinDtl($scope);
		}

		return text;
	};

	// ファイル情報エリア（明細部）
	var setFilePageSizeInfo = function($scope) {
		$scope.filePageSizeInfo = CommonService.createYoshiSizeInfo($scope.pdfData[$scope.currentFile], $scope.m_yoshi_size);
	};

	// エラーメッセージセット
	var setErrorMessage = function($scope, errors) {
		// エラー情報をリストにセット
		angular.forEach(errors, function(error) {
			// 詳細情報が存在しない場合リストに表示しないエラーのため次のエラーへ
			if (!error.details) {
				return;
			}
			for (var index in $scope.fileList_gridOptions.data) {
				var data = $scope.fileList_gridOptions.data[index];
				if (error.details.hankanriId != data.hanKanriId) {
					continue;
				}
				// 版管理IDが一致するデータにエラー情報をセット
				data.status = Const.STATUS_ERROR;
				data.errorMessage = error.message;
				// エラー情報をセットした場合リストを開く
				$scope.status.isOpen = true;
				break;
			}
		});
	}

	return {
		init: function($scope) {
			// パラメータ取得
			var params = StorageService.getParameter(Const.PATH_PRINT_PREVIEW, ['fileInfo', 'oinId']);
			if (params == null) {
				CommonService.urlParameterError();
				return;
			} else {
				// パラメータセット
				$scope.paramFileInfo = params['fileInfo'];
				$scope.paramOinId = params['oinId'];
				$scope.paramSosaDtlKbn = params['sosaDtlKbn'];
			}

			// 倍率の設定
			$scope.m_scale_joken = [
				{id: "0", name: "10"},
				{id: "1", name: "25"},
				{id: "2", name: "50"},
				{id: "3", name: "75"},
				{id: "4", name: "100"},
				{id: "5", name: "125"},
				{id: "6", name: "150"},
				{id: "7", name: "200"}
			];

			// 一覧基本設定
			setGridOptions($scope);

			// PDFイメージエリアの高さ取得
			this.getPdfBodyAreaHeight($scope);

			// 基本情報を設定
			setRaphaelBase($scope);

			// 印刷プレビュー 事前処理
			getPrePrintPreview($scope)
		},
		changeYoshiSize: function($scope) {
			if ($scope.pdfData) {
				var pdfData = $scope.pdfData[$scope.currentFile];
				var dispPage = pdfData.dispPage;
				if (pdfData.allPage) {
					// 全ページ適用の場合
					angular.forEach(pdfData.pageInfo, function(page) {
						page.yoshiSizeId = pdfData.pageInfo[dispPage - 1].yoshiSizeId;
					});
				}
				setFilePageSizeInfo($scope);
			}
		},
		resizeImage: function($scope, newValue) {
			// ベースイメージのリサイズ処理
			var imageWidth = $scope.baseImage.width;
			var imageHeight = $scope.baseImage.height;
			if (imageWidth == null) {
				return;
			}
			$scope.slider.scale = newValue / 100;
			$scope.raphael.setSize(imageWidth * $scope.slider.scale, imageHeight * $scope.slider.scale);
			$scope.raphael.setViewBox(0, 0, imageWidth, imageHeight, false);
		},
		print: function($scope) {
			var promise = CommonService.dispMessage($scope, "Q00001", ["print"]);
			promise.then(
				function(result) {
					// 印刷
					print($scope);
				}
			);
		},
		cancel: function($scope) {
			// 「メイン画面」へ遷移
			$location.path(Const.PATH_MAIN).search({});
		},
		// ページ切替
		changePage: function($scope, pageKbn) {
			if (angular.isDefined(pageKbn)) {
				// ページング変更処理
				CommonService.setDispPage($scope.pdfData[$scope.currentFile], pageKbn);
			}
			// PDFページ画像更新
			setRaphaelData($scope, $scope.pdfData[$scope.currentFile].dispPage);
		},
		setScale: function($scope, blnScreen) {
			// 画面表示倍率の設定

			// 画面サイズの取得
			var screenWidth = CommonService.getElementInfo('panePdfBody', 'offsetWidth');
			var screenHeight = $scope.panePdfBodyHeight;
			// 倍率の取得
			var scaleWidth = screenWidth / $scope.baseImage.width * 100;
			var scaleHeight = (screenHeight - 10) / $scope.baseImage.height * 100;

			// 画面に合わせる場合
			if (scaleWidth < scaleHeight) {
				$scope.slider.value = parseInt(scaleWidth);
			} else {
				if (blnScreen) {
					$scope.slider.value = parseInt(scaleHeight);
				} else {
					// 縦スクロールバーが表示されるため幅を調整
					scaleWidth = (screenWidth - 20) / $scope.baseImage.width * 100;
					$scope.slider.value = parseInt(scaleWidth);
				}
			}
			if ($scope.slider.value > $scope.slider.max) {
				$scope.slider.value = $scope.slider.max;
			}
		},
		// PDFイメージ表示エリア高さの取得
		getPdfBodyAreaHeight: function($scope) {
			// 印刷プレビュー画面の高さ取得
			var screenHeight = CommonService.getElementInfo('panes-printPreview', 'offsetHeight');
			// ファイル情報エリアの高さ取得
			var fileInfoAreaHeight = CommonService.getElementInfo('pane-fileInfo-area', 'offsetHeight');
			// ボタンエリアの高さ取得
			var btnToolbarHeight = CommonService.getElementInfo('paneBtnToolbar', 'offsetHeight');
			// 各エリアの padding
			var padding = 19;

			$timeout(function() {
				$scope.panePdfBodyHeight = screenHeight - fileInfoAreaHeight - btnToolbarHeight - padding
			}, 0);
		}

	}
});
