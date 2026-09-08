'use strict';

app.factory('PdfService', function($q, $location, $translate, $timeout, CommonService, Const, StorageService) {

	// 画面別通信先
	var Action = '/api/pdf';

	var getElementInfo = function(id, key) {
		// クラス情報取得
		return angular.element(document.getElementById(id)).prop(key);
	};

	var setColor = function(r, g, b) {
		if (CommonService.isEmpty(r) || CommonService.isEmpty(g) || CommonService.isEmpty(b)) {
			r = 0;
			g = 0;
			b = 0;
		}
		return CommonService.setColor(r, g, b);
	};

	// サーバーエラーレスポンス処理
	var serverResponseError = function($scope, rejectData, state) {
		// 失敗処理
		if (state >= 500) {
			// 失敗処理
			CommonService.systemError($scope, state);
		} else {
			var reader = new FileReader();
			reader.onload = function(re) {
				var errorJson = {};
				errorJson.errorInfo = JSON.parse(re.target.result);
				CommonService.errorProcess($scope, errorJson);
			};
			var blob = new Blob([rejectData], { type: "text/plain" });
			reader.readAsText(blob);
		}
	};

	// pageInfo初期化
	var pageInfoInit = function($scope) {

		if (CommonService.isEmpty($scope.pdfData.totalPageCount)) {
			// パスワード入力前は処理しない
			return;
		}

		$scope.storage = {
			rectangle: {},
			info: {}
		};
		var storage = $scope.storage.rectangle[$scope.paramId];
		if (!storage) {
			$scope.storage.rectangle[$scope.paramId] = {};
			storage = $scope.storage.rectangle[$scope.paramId];
		}
		$scope.pdfData.pageInfo = {};
		for (var lp = 0; lp < $scope.pdfData.totalPageCount; lp++) {
			if (!$scope.pdfData.pageInfo[lp]) {
				if (!storage[lp]) {
					storage[lp] = [];
				}
				$scope.pdfData.pageInfo[lp] = {};
				$scope.pdfData.pageInfo[lp].rectangle = storage[lp];
				$scope.pdfData.pageInfo[lp].yoshiSizeId = 0;
			}
		}
		var info = $scope.storage.info[$scope.paramId];
		if (!info) {
			$scope.storage.info[$scope.paramId] = $scope.info;
		} else {
			$scope.info = info;
		}
		if (!$scope.info.pageSize) {
			$scope.info.pageSize = {};
		}

		// DBデータを画面表示データに設定
		angular.forEach($scope.pdfData.editInfo, function(editInfo) {
			var pageNo = editInfo.pageNo - 1;
			if (pageNo < 0) {
				pageNo = 0;
			}
			if (pageNo >= $scope.pdfData.totalPageCount) {
				return;
			}
			var found = false;
			angular.forEach($scope.pdfData.pageInfo[pageNo].rectangle, function(rectangle) {
				if (rectangle.oid == editInfo.id) {
					found = true;
				}
			});
			if (!found) {
				var data = {
					oid: editInfo.id,
					comment: editInfo.string,
					positionKijunKbn: editInfo.positionKijunKbn,
					positionX: editInfo.positionX,
					positionY: editInfo.positionY,
					width: editInfo.width,
					height: editInfo.height,
					allPage: editInfo.pageNo == 0,
					font: editInfo.fontNameKbn,
					fontSize: editInfo.fontSize,
					fontColorR: editInfo.fontColorR,
					fontColorG: editInfo.fontColorG,
					fontColorB: editInfo.fontColorB,
					fillFlag: !CommonService.isEmpty(editInfo.backgroundColorR),
					fillColorR: editInfo.backgroundColorR,
					fillColorG: editInfo.backgroundColorG,
					fillColorB: editInfo.backgroundColorB,
					rotate: editInfo.kakudo,
					uneditableFlg: editInfo.uneditableFlg
				};

				if (editInfo.henshuKbn == 2) {
					data.type = Const.RAPHAEL_TYPE_IMAGE;
				} else {
					data.type = Const.RAPHAEL_TYPE_RECT
				}

				if (editInfo.pageNo == 0) {
					data.pageNo = 0;
				} else {
					data.pageNo = editInfo.pageNo;
				}

				if (editInfo.tokasei > 0) {
					data.fillOpacity = 1 - (editInfo.tokasei / 100);
				} else {
					data.fillOpacity = 1;
				}

				$scope.pdfData.pageInfo[pageNo].rectangle.push(data);
			}
		});

		// 印刷用紙サイズ情報の設定
		setFilePageSizeInfo($scope);

	};

	var setRaphaelBase = function($scope) {
		var screenWidth = getElementInfo('panePdfBody', 'clientWidth');
		var screenHeight = getElementInfo('panePdfBody', 'clientHeight');
		$scope.raphael = Raphael("base", screenWidth, screenHeight);
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
				hanKanriId: $scope.pdfData.hanKanriId,
				password: $scope.pdfData.userPassword,
				pageNo: page,
				maxPixels: null
			},
			langKey: CommonService.getLanguageKey($scope)
		};

		CommonService.httpModal($scope, Action + "/get-pdf-image", param, true,
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
						$scope.info.pageSize[$scope.pdfData.dispPage] = { width: img[0].width, height: img[0].height };
						$scope.$apply();
						deferred.resolve();
						if (CommonService.isFirefox()) {
							$('image').attr('onmousedown', 'return false');
						}
					}, 500);
					// ツールバーの高さ再調整
					var layout = $("div.panes-full").layout();
					layout.resizeAll();
				};
				var blob = new Blob([resolveData], {type : 'imapge/png'});
				reader.readAsDataURL(blob);
			},
			function(rejectData, state) {
				serverResponseError($scope, rejectData, state);
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
				if (page == 0) {
					page = $scope.pdfData.totalPageCount;
				}
				var processItemsDeferred = [];
				angular.forEach($scope.pdfData.pageInfo, function(pageInfo) {
					angular.forEach(pageInfo.rectangle, function(rectangle) {
						// 全ページ 及び 対象ページのみを対象とする
						if (rectangle.pageNo == 0 || rectangle.pageNo == page) {
							// データタイプが[イメージ] 且つ データソースが設定されていない場合のみ対象とする
							if (rectangle.type == Const.RAPHAEL_TYPE_IMAGE && CommonService.isEmpty(rectangle.src) && !CommonService.isEmpty(rectangle.oid)) {
								processItemsDeferred.push(getSaveMark($scope, rectangle));
							}
						}
					});
				});
				$.when.apply($, processItemsDeferred)
					.then(function() {
						// イメージデータの取得が完了後、同期的に押印情報を設定する。
						setRaphaelOuinData($scope, page)
					});
			},
			function() {
				// 呼出し元でエラーダイアログ表示
			}
		);
	};

	var setRaphaelOuinData = function($scope, page) {
		angular.forEach($scope.pdfData.pageInfo[page - 1].rectangle, function(rectangle) {
			if (rectangle.type == Const.RAPHAEL_TYPE_RECT && !rectangle.allPage) {
				$scope.createRect(rectangle);
			} else if (rectangle.type == Const.RAPHAEL_TYPE_IMAGE) {
				createOuin($scope, rectangle);
			}
		});
		// 全ページ適用
		angular.forEach($scope.pdfData.pageInfo, function(pageInfo) {
			angular.forEach(pageInfo.rectangle, function(rectangle) {
				if (rectangle.type == Const.RAPHAEL_TYPE_RECT && rectangle.allPage) {
					CommonService.setPdfOuinTextPosition($scope, rectangle, rectangle.comment);
					$scope.createRect(rectangle);
				} if (rectangle.type == Const.RAPHAEL_TYPE_IMAGE && rectangle.allPage) {
					createOuin($scope, rectangle);
				} else if (rectangle.type == Const.RAPHAEL_TYPE_MARK_POSITION) {
					createOuin($scope, rectangle);
				}
			});
		});
	};

	// PDF編集 事前処理
	var getPrePdfEdit = function($scope) {
		var deferred = $q.defer();

		var fileId = $scope.paramId;
		var workflowId = null;
		var workflowJotaiKanriId = null;
		if ($scope.isWorkflow()) {
			workflowId = $scope.paramWorkflowId;
			workflowJotaiKanriId = $scope.paramJotaiKanriId;
		}
		var param = {
			data: {
				fileId: fileId,
				workflowId: workflowId,
				workflowJotaiKanriId: workflowJotaiKanriId
			},
			langKey: CommonService.getLanguageKey($scope)
		};

		CommonService.httpModal($scope, Action, param, true,
			function(resolveData) {
				// 成功処理
				if (!CommonService.isError(resolveData)) {
					deferred.resolve(resolveData);
				} else {
					// 失敗処理
					var promise = CommonService.errorProcess($scope, resolveData);
					promise.then(
						function(result) {
							$scope.pageBack();
						}
					);
					deferred.reject(resolveData);
				}
			},
			function(rejectData, state) {
				// 失敗処理
				CommonService.systemError($scope, state);
			}
		);

		return deferred.promise;
	};

	var getScaleOffsetPos = function($scope, pos) {
		return pos / $scope.slider.scale;
	};

	var getMaskingRect = function($scope, x, y) {
		x = getScaleOffsetPos($scope, x);
		y = getScaleOffsetPos($scope, y);
		var ox = $scope.masking.startX;
		var oy = $scope.masking.startY;
		if (x < ox) {
			ox = [x, x = ox][0];
		}
		if (y < oy) {
			oy = [y, y = oy][0];
		}
		return [ox, oy, x - ox, y - oy];
	};

	// Raphael指定要素削除
	var elementRemove = function(element) {
		if (element) {
			var text = element.data("text");
			if (text) {
				text.remove();
			}
			var pointer = element.data("pointer");
			if (pointer) {
				pointer.remove();
			}
			var image = element.data("image");
			if (image) {
				image.remove();
			}

			element.remove();
		}
	};

	// Raphael要素クリックイベント処理
	var maskClickEvent = function($scope, element) {
		if (element) {
			var data = element.data("data");
			if ($scope.mode == Const.PDF_EDIT_MODE_DEFAULT) {
				if (data.type != Const.RAPHAEL_TYPE_IMAGE) {
					$scope.maskEdit(element, false);
				}
			} else if ($scope.mode == Const.PDF_EDIT_MODE_REMOVE) {
				// データ削除
				angular.forEach($scope.pdfData.pageInfo, function(pageInfo) {
					for (var idx in pageInfo.rectangle) {
						var rectangle = pageInfo.rectangle[idx];
						if (rectangle.type == Const.RAPHAEL_TYPE_MARK_POSITION) {
							// 押印位置
							for (var i in rectangle.oinIchiDtl) {
								var oinIchiDtl = rectangle.oinIchiDtl[i];
								if (angular.equals(oinIchiDtl, data)) {
									rectangle.oinIchiDtl.splice(i, 1);
									return;
								}
							}
						} else {
							// 個人印/共通印/マスキング・コメント
							if (angular.equals(rectangle, data)) {
								pageInfo.rectangle.splice(idx, 1);
								return;
							}
						}
					}
				});
				// Raphael要素削除
				elementRemove(element);
			}
		}
	};

	var setMaskTextPosition = function($scope, element, kbn) {
		var target = null;
		if (kbn == Const.RAPHAEL_RECT_MOJI) {
			// 文字列
			target = element.data("text");
		} else if (kbn == Const.RAPHAEL_RECT_IMAGE) {
			// 画像
			target = element.data("image");
		}

		if (target) {
			var transform = Raphael.parseTransformString(target.transform());
			var rotate = 0;
			if (!CommonService.isEmpty(transform)) {
				angular.forEach(transform, function (trans) {
					if (trans[0] == "r") {
						rotate = trans[1];
					}
				});
			}

			target.transform("");
			var block = target.getBBox(false);
			target.attr("x", element.attr("x"));
			var yHeight = element.attr("y");
			if (kbn == Const.RAPHAEL_RECT_MOJI) {
				// 文字列の場合は位置調整を行う
				yHeight += block.height / 2 ;
			}
			target.attr("y", yHeight);

			if (rotate != 0) {
				// 角度の設定
				CommonService.setPdfOuinTextRotate(element, rotate);
			}

			// 処理したページNo記憶
			var data = element.data("data");
			data.movePageNo = $scope.pdfData.dispPage;
			// 基準位置設定
			setBasePosition($scope, data);
		}
	};

	var setMaskTextFit = function($scope, element) {

		var text = element.data("text");
		if (!text) {
			return;
		}

		var data = element.data("data");
		if (data.type == Const.RAPHAEL_TYPE_MARK_POSITION && !data.existWidthHeightFlg) {
			// 押印位置文字列
			if (data.rotate == 0) {
				var block = text.getBBox(false);
				data.width = block.width;
				data.height = block.height;
				element.attr({width: data.width, height: data.height});
			}
		} else {
			CommonService.setPdfOuinTextFit(data, text, data.comment, element);
		}

		setMaskTextPosition($scope, element, Const.RAPHAEL_RECT_MOJI);
	};

	var openPasswordInput = function($scope, deferred, message, passwordShow2, password1, password2) {

		var info = $translate.instant("pdf_security_info");
		info = info.replace("{0}", $scope.pdfData.fileName);

		$scope.modal = {
			title: $translate.instant("pdf_password_input"),
			password1: password1,
			passwordShow1: false,
			maxlength1: 32,
			pattern1: "^[a-zA-Z0-9 -/:-@\\[-\\`\\{-\\~]+$",
			title1: $translate.instant("user_password"),
			password2: password2,
			passwordShow2: false,
			title2: $translate.instant("kengen_password"),
			maxlength2: 32,
			pattern2: "^[a-zA-Z0-9 -/:-@\\[-\\`\\{-\\~]+$",
			info: info,
			message: message
		}

		// ユーザーパスワード入力表示（オープン時のみ）
		if ($scope.pdfData.securityInfo.hyojiSeigenFlg && !passwordShow2) {
			$scope.modal.passwordShow1 = true;
		}
		// 権限パスワード入力表示（変更制限のみ）
		if ($scope.pdfData.securityInfo.henkoSeigenFlg || passwordShow2) {
			$scope.modal.passwordShow2 = true;
		}

		var template = "app/password-input-modal/password-input-modal.html";
		var controller = "PasswordInputModalController";
		var promise = CommonService.openModal($scope, template, controller);
		promise.then(
			function(resolveData) {
				// パスワード問い合わせ
				var promise = passwordCheck($scope, resolveData.password1, resolveData.password2);
				var password1 = resolveData.password1;
				var password2 = resolveData.password2;
				promise.then(
					function(resolveData) {
						deferred.resolve(resolveData);
					},
					function(resolveData) {
						// openPasswordInput再帰
						openPasswordInput($scope, deferred, resolveData.errorInfo.message, passwordShow2, password1, password2);
					}
				);
			},
			function() {
				deferred.reject();
			}
		);
	};

	// パスワードチェック
	var passwordCheck = function($scope, userPassword, ownerPassword) {
		var deferred = $q.defer();

		var param = {
			data: {
				id: $scope.paramId,
				userPassword: userPassword,
				ownerPassword: ownerPassword,
			},
			langKey: CommonService.getLanguageKey($scope)
		};

		var dtlInfo = {
			fileId: $scope.paramId
		}
		CommonService.httpModal($scope, Action + "/password-check", param, true,
			function(resolveData) {
				// 成功処理
				if (!CommonService.isError(resolveData)) {
					if (resolveData.henkoSeigenFlg && resolveData.hyojiSeigenFlg) {
						var errorJson = {
							errorInfo: {
								code: "W00023",
								message: CommonService.getMessage($scope, "W00023", null)
							}
						};
						deferred.reject(errorJson);
						// システム操作ログ登録（失敗）
						dtlInfo.errorInfo = errorJson.errorInfo;
						CommonService.systemSosaLogFailure($scope, Const.SOSA_LOG_GAMEN_KBN_PDF_PASSWORD, Const.SOSA_LOG_SOSA_KBN_CONFIRM_PASSWORD, dtlInfo, Const.SOSA_LOG_SOSA_DTL_KBN_CONFIRMATION_PDF_EDIT);
					} else {
						resolveData.userPassword = userPassword;
						resolveData.ownerPassword = ownerPassword;
						$scope.pdfData.securityInfo.hyojiSeigenFlg = resolveData.hyojiSeigenFlg;
						$scope.pdfData.securityInfo.henkoSeigenFlg = resolveData.henkoSeigenFlg;
						$scope.pdfData.securityInfo.insatsuSeigenFlg = resolveData.insatsuSeigenFlg;
						$scope.pdfData.securityInfo.naiyoCopySeigenFlg = resolveData.naiyoCopySeigenFlg;
						deferred.resolve(resolveData);
						// システム操作ログ登録（成功）
						CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_PDF_PASSWORD, Const.SOSA_LOG_SOSA_KBN_CONFIRM_PASSWORD, dtlInfo, Const.SOSA_LOG_SOSA_DTL_KBN_CONFIRMATION_PDF_EDIT);
					}
				} else {
					// 失敗処理
					if (resolveData.errorInfo.code == "W00023") {
						deferred.reject(resolveData);
						// システム操作ログ登録（失敗）
						dtlInfo.errorInfo = resolveData.errorInfo;
						CommonService.systemSosaLogFailure($scope, Const.SOSA_LOG_GAMEN_KBN_PDF_PASSWORD, Const.SOSA_LOG_SOSA_KBN_CONFIRM_PASSWORD, dtlInfo, Const.SOSA_LOG_SOSA_DTL_KBN_CONFIRMATION_PDF_EDIT);
					} else {
						CommonService.errorProcess($scope, resolveData, Const.SOSA_LOG_GAMEN_KBN_PDF_PASSWORD, Const.SOSA_LOG_SOSA_KBN_CONFIRM_PASSWORD, dtlInfo, Const.SOSA_LOG_SOSA_DTL_KBN_CONFIRMATION_PDF_EDIT);
					}
				}
			},
			function(rejectData, state) {
				// 失敗処理
				CommonService.systemError($scope, state, Const.SOSA_LOG_GAMEN_KBN_PDF_PASSWORD, Const.SOSA_LOG_SOSA_KBN_CONFIRM_PASSWORD, dtlInfo, Const.SOSA_LOG_SOSA_DTL_KBN_CONFIRMATION_PDF_EDIT);
			}
		);

		return deferred.promise;
	};

	var createOuin = function($scope, obj) {

		if (!obj) {
			return;
		}

		if (!CommonService.isEmpty(obj.oid)) {
			// 保存済印
			createSaveMark($scope, obj, obj.oid, setImagePosition);
		} else {
			// 新規押印は編集可能
			obj.uneditableFlg = false;

			if (obj.oinIchiDtl) {
				// 押印位置
				obj.type = Const.RAPHAEL_TYPE_MARK_POSITION;
				var processItemsDeferred = [];
				angular.forEach(obj.oinIchiDtl, function(oinIchiDtl) {
					processItemsDeferred.push(createMarkPosition($scope, obj.id, oinIchiDtl, true));
				});
				$.when.apply($, processItemsDeferred)
					.then(function() {
						// 押印データの取得が完了後、同期的に押印情報を設定する。
						angular.forEach(obj.oinIchiDtl, function(oinIchiDtl) {
							createMarkPosition($scope, obj.id, oinIchiDtl, false);
						});
					});
			} else if (obj.id > 0) {
				// 共通印
				obj.pageNo = $scope.pdfData.dispPage;
				createCommonMark($scope, obj, obj.id, null);
			} else {
				// 個人印
				obj.pageNo = $scope.pdfData.dispPage;
				createUserMark($scope, obj, obj.id, null);
			}
		}
	};

	// サーバーから印影画像取得
	var httpMarkImage = function($scope, data, param, callbackLoadEnd, deferred) {
		CommonService.httpModal($scope, Action + "/image", param, true,
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
							} else {
								$scope.createImage(re.target.result, data);
							}
						}, 500);
					} else if (deferred) {
						deferred.resolve();
					}
				};
				var blob = new Blob([resolveData], {type : 'imapge/png'});
				reader.readAsDataURL(blob);
			},
			function(rejectData, state) {
				serverResponseError($scope, rejectData, state);
			},
			{responseType: 'arraybuffer'}
		);
	};

	// 画像生成
	var createImageSrc = function($scope, data, callbackLoadEnd) {

		if (callbackLoadEnd) {
			var img = $('<img>');
			img[0].src = data.src;
			callbackLoadEnd($scope, data, img);
		}
		$scope.createImage(data.src, data);
	};

	// 個人印生成
	var createUserMark = function($scope, data, id, callbackLoadEnd, deferred) {

		var time;
		if (id == -Const.OIN_ICHI_KBN_KOJIN_DATE_FALSE) {
			time = 0;
		} else {
			time = new Date().getTime();
		}
		var param = {
			type: 1,
			id: null,
			date: time,
			langKey: CommonService.getLanguageKey($scope)
		};

		if (!data.time) {
			data.time = time;
		}

		if (data.src) {
			if (deferred) {
				deferred.resolve();
			} else {
				createImageSrc($scope, data, callbackLoadEnd);
			}
		} else {
			httpMarkImage($scope, data, param, callbackLoadEnd, deferred);
		}
	};

	// 共通印生成
	var createCommonMark = function($scope, data, id, callbackLoadEnd, deferred) {

		var param = {
			type: 2,
			id: id,
			date: new Date().getTime(),
			langKey: CommonService.getLanguageKey($scope)
		};

		if (!data.time) {
			data.time = param.date;
		}

		if (data.src) {
			if (deferred) {
				deferred.resolve();
			} else {
				createImageSrc($scope, data, callbackLoadEnd);
			}
		} else {
			httpMarkImage($scope, data, param, callbackLoadEnd, deferred);
		}
	};

	// 保存済み印生成
	var createSaveMark = function($scope, data, id, callbackLoadEnd) {

		var param = {
			type: 3,
			id: id,
			langKey: CommonService.getLanguageKey($scope)
		};

		if (!data.time) {
			data.time = param.date;
		}

		if (data.src) {
			createImageSrc($scope, data, callbackLoadEnd);
		} else {
			httpMarkImage($scope, data, param, callbackLoadEnd);
		}
	};

	// 保存済み印取得
	var getSaveMark = function($scope, data) {
		var deferred = $.Deferred();
		var param = {
			type: 3,
			id: data.oid,
			langKey: CommonService.getLanguageKey($scope)
		};

		if (!data.time) {
			data.time = param.date;
		}

		httpMarkImage($scope, data, param, setImagePosition, deferred);
		return deferred.promise();
	};

	// 押印位置文字列生成
	var createOuinText = function($scope, id, data, deferred) {

		var param = {
			data: {
				id: id,
				fileId: $scope.paramId,
				date: new Date().getTime()
			},
			langKey: CommonService.getLanguageKey($scope)
		};

		if ($scope.pdfData.ouinTexts[id]) {
			if (!deferred) {
				CommonService.setPdfOuinTextPosition($scope, data, data.comment);
			}
			createOuinTextElement($scope, id, data, deferred);
		} else {
			CommonService.httpModal($scope, Action + "/ouin-text", param, true,
				function(resolveData) {
					// 成功処理
					if (!CommonService.isError(resolveData)) {
						$scope.pdfData.ouinTexts[id] = resolveData;
						createOuinTextElement($scope, id, data, deferred);
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
		}
	};

	// 押印位置文字列Raphael要素生成
	var createOuinTextElement = function($scope, id, data, deferred) {

		var ouinTexts = $scope.pdfData.ouinTexts[id];
		if (!ouinTexts) {
			return;
		}

		var map = CommonService.getListMapToMap(ouinTexts, "id", data.id);
		if (!map) {
			return;
		}
		data.comment = map.string;
		data.type = Const.RAPHAEL_TYPE_MARK_POSITION;
		if (angular.isUndefined(data.x)) {
			CommonService.setPdfOuinTextInfo(data);
		}

		if (deferred) {
			deferred.resolve();
		} else {
			$scope.createRect(data);
		}
	};

	// 押印画像位置設定
	var setImagePosition = function($scope, data, img) {

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
		var baseImage = $scope.info.pageSize[page];
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
	var createMarkPosition = function($scope, id, data, setDeferred) {
		if (setDeferred) {
			var deferred = $.Deferred();
		}
		if (data.hyojiNaiyoKbn == 1) {
			// 個人印(日付なし)
			createUserMark($scope, data, -Const.OIN_ICHI_KBN_KOJIN_DATE_FALSE, setImagePosition, deferred);
		} else if (data.hyojiNaiyoKbn == 2) {
			// 個人印(日付あり)
			createUserMark($scope, data, -Const.OIN_ICHI_KBN_KOJIN_DATE_TRUE, setImagePosition, deferred);
		} else if (data.hyojiNaiyoKbn == 3) {
			// 共通印
			createCommonMark($scope, data, data.kyotsuInId, setImagePosition, deferred);
		} else if (data.hyojiNaiyoKbn == 4) {
			// 文字列
			createOuinText($scope, id, data, deferred);
		}
		if (setDeferred) {
			return deferred.promise();
		}
	};

	// 保存＆印刷データ生成
	var createSaveAndPrintData = function($scope) {
		var data = {};
		data.hanKanriId = $scope.pdfData.hanKanriId;
		if ($scope.isWorkflow()) {
			data.workflowId = $scope.paramWorkflowId;
			data.workflowJotaiKanriId = $scope.paramJotaiKanriId;
		} else {
			data.workflowId = null;
			data.workflowJotaiKanriId = null;
		}
		data.userPassword = $scope.pdfData.userPassword;
		data.ownerPassword = $scope.pdfData.ownerPassword;
		data.editInfo = [];
		data.yoshiSize = []
		data.comment = $scope.pdfData.comment;
		angular.forEach($scope.pdfData.pageInfo, function(pageInfo, i) {
			var page = CommonService.parseInt(i, 0) + 1;
			var yoshiSizeInfo = {
				page: page,
				id: pageInfo.yoshiSizeId
			}
			data.yoshiSize.push(yoshiSizeInfo);
			angular.forEach(pageInfo.rectangle, function(rectangle) {
				if (rectangle.oinIchiDtl) {
					angular.forEach(rectangle.oinIchiDtl, function(oinIchiDtl) {
						data.editInfo.push(createPdfHenshuExt($scope, oinIchiDtl));
					});
				} else {
					data.editInfo.push(createPdfHenshuExt($scope, rectangle));
				}
			});
		});

		return data;
	};

	var createPdfHenshuExt = function($scope, rectangle) {
		var pdfHenshuExt = {};
		pdfHenshuExt.henshuKbn = rectangle.type == Const.RAPHAEL_TYPE_IMAGE ? Const.RAPHAEL_TYPE_IMAGE : Const.RAPHAEL_TYPE_RECT;
		pdfHenshuExt.id = rectangle.oid;
		pdfHenshuExt.string = rectangle.comment;
		if (!angular.isUndefined(rectangle.x)) {
			setBasePosition($scope, rectangle);
		}
		pdfHenshuExt.positionKijunKbn = rectangle.positionKijunKbn;
		pdfHenshuExt.positionX = rectangle.positionX;
		pdfHenshuExt.positionY = rectangle.positionY;
		pdfHenshuExt.width = rectangle.width;
		pdfHenshuExt.height = rectangle.height;
		pdfHenshuExt.pageNo = rectangle.pageNo;
		pdfHenshuExt.fontNameKbn = rectangle.font;
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
		if (angular.isDefined(rectangle.kyotsuInId)) {
			pdfHenshuExt.kyotsuInId = rectangle.kyotsuInId;
		} else {
			pdfHenshuExt.kyotsuInId = rectangle.id > 0 ? rectangle.id : null;
		}

		return pdfHenshuExt;
	};

	var setMouseover = function($scope, element) {
		if (element) {
			element.mouseover(function(e) {
				if ($scope.mode == Const.PDF_EDIT_MODE_SELECT) {
					this.attr("cursor", Const.CURSOR_MOVE);
				} else if ($scope.mode == Const.PDF_EDIT_MODE_REMOVE) {
					this.attr("cursor", Const.CURSOR_REMOVE);
				} else if ($scope.mode == Const.PDF_EDIT_MODE_MASKING) {
					this.attr("cursor", Const.CURSOR_MASKING);
				} else if ($scope.mode == Const.PDF_EDIT_MODE_OUIN) {
					this.attr("cursor", Const.CURSOR_OUIN);
				} else {
					this.attr("cursor", Const.CURSOR_DEFAULT);
				}
				var data = this.data("data");
				var parent = this.data("parent");
				if (CommonService.checkEditEnable($scope, data, parent)) {
					var ele = element;
					if (parent) {
						ele = parent;
					}
					ele.attr({
						"stroke-width": 2,
						"stroke": "red"
					})
				}
			});
			element.mouseout(function(e) {
				var data = this.data("data");
				var parent = this.data("parent");
				if (CommonService.checkEditEnable($scope, data, parent)) {
					var ele = element;
					if (parent) {
						ele = parent;
					}
					ele.attr({
						"stroke-width": 0
					});
				}
			});
		}
	};

	// 保存
	var save = function($scope) {
		var template = "app/comment-modal/comment-modal.html";
		var controller = "CommentModalController";
		var promise = CommonService.openModal($scope, template, controller);
		promise.then(
			function(result) {
				$scope.pdfData.comment = result;
				var data = createSaveAndPrintData($scope);
				var param = {
					langKey: CommonService.getLanguageKey($scope),
					data: data
				};
				var dtlInfo = {
					fileId: $scope.paramId
				};
				CommonService.httpModal($scope, Action + "/update", param, true,
					function(resolveData) {
						// 成功処理
						if (!CommonService.isError(resolveData)) {
							var promiseRes = CommonService.dispMessage($scope, "I00001", ["save"]);
							promiseRes.then(
								function(result) {
									// ワークフローモードの場合、メイン画面に通知
									if ($scope.isWorkflow()) {
										var data = {};
										data["workflowId"] = $scope.paramWorkflowId;
										data["fileId"] = $scope.paramId;
										StorageService.setData('pdfKakuninData', data);
									}
									$scope.pageBack();
								}
							);
							// システム操作ログ登録（成功）
							CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_PDF_EDIT, Const.SOSA_LOG_SOSA_KBN_UPDATE_PDF, dtlInfo);
						} else {
							// 失敗処理
							CommonService.errorProcess($scope, resolveData, Const.SOSA_LOG_GAMEN_KBN_PDF_EDIT, Const.SOSA_LOG_SOSA_KBN_UPDATE_PDF, dtlInfo);
						}
					},
					function(rejectData, state) {
						// 失敗処理
						CommonService.systemError($scope, state, Const.SOSA_LOG_GAMEN_KBN_PDF_EDIT, Const.SOSA_LOG_SOSA_KBN_UPDATE_PDF, dtlInfo);
					}
				);
			}
		);
	};

	// 印刷
	var print = function($scope) {
		var data = createSaveAndPrintData($scope);
		var param = {
			langKey: CommonService.getLanguageKey($scope),
			data: data
		};
		var dtlInfo = {
			fileId: $scope.paramId
		};

		// iOS の場合新規タブを開く
		var win = CommonService.windowOpen($scope);

		CommonService.httpModal($scope, Action + "/print", param, false,
			function(resolveData) {
				// 成功処理
				if (!CommonService.isError(resolveData)) {
					if (win != null) {
						// iOS の場合は印刷用 PDF ファイルを直接ダウンロードする
						win.location.href = CommonService.getPrintFile(resolveData.fileName);
					} else {
						$scope.jnlp = CommonService.getJnlpFile(resolveData.fileName, Const.JWS_START_MODE_PRINT);
						$timeout(function() {
							$('#pdf-print')[0].click();
						}, 500);
					}
					// システム操作ログ登録（成功）
					CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_PDF_EDIT, Const.SOSA_LOG_SOSA_KBN_PRINT, dtlInfo);
				} else {
					// 失敗処理
					CommonService.errorProcess($scope, resolveData, Const.SOSA_LOG_GAMEN_KBN_PDF_EDIT, Const.SOSA_LOG_SOSA_KBN_PRINT, dtlInfo);
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
					CommonService.errorProcess($scope, errorJson, Const.SOSA_LOG_GAMEN_KBN_PDF_EDIT, Const.SOSA_LOG_SOSA_KBN_PRINT, dtlInfo);
				} else {
					// 一時保存ファイルの削除
					var param = { 'filename': rejectData.fileName };
					CommonService.httpPost("/api/jnlp/remove", param, function(resolveData) {}, function(rejectData) {});
				}
				if (win != null) {
					win.close();
				}
			}
		);
	};

	// ファイル情報エリア（明細部）
	var setFilePageSizeInfo = function($scope) {
		$scope.filePageSizeInfo = CommonService.createYoshiSizeInfo($scope.pdfData, $scope.m_yoshi_size);
	};

	return {
		init: function($scope) {
			// パラメータ取得
			var params = StorageService.getParameter(Const.PATH_PDF_EDIT, ["id", "workflowId", "jotaiKanriId"]);
			if (params == null) {
				CommonService.urlParameterError(Const.PATH_MAIN);
				return;
			} else {
				// パラメータセット
				$scope.paramId = params["id"];
				$scope.paramWorkflowId = params["workflowId"];
				$scope.paramJotaiKanriId = params["jotaiKanriId"];
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

			// 基本情報を設定
			setRaphaelBase($scope);

			$q.all([
				// PDF編集 事前処理
				getPrePdfEdit($scope)
			]).then(
				function(result) {
					$scope.pdfData = result[0];
					// 初期値
					$scope.pdfData.dispPage = 1;
					$scope.pdfData.userPassword = null;
					$scope.pdfData.ownerPassword = null;
					$scope.pdfData.ouinTexts = {};
					$scope.pdfData.allPage = true;

					// ドロップダウンリスト設定
					$scope.ouinList = [];
					// 個人印（日付なし）
					if ($scope.pdfData.userSealWithoutDate) {
						$scope.ouinList.push({
							id: -Const.OIN_ICHI_KBN_KOJIN_DATE_FALSE,
							name: $translate.instant("kojin_in_date_false")
						});
					}
					// 個人印（日付あり）
					if ($scope.pdfData.userSealWithDate) {
						$scope.ouinList.push({
							id: -Const.OIN_ICHI_KBN_KOJIN_DATE_TRUE,
							name: $translate.instant("kojin_in_date_true")
						});
					}
					// 共通印
					angular.forEach($scope.pdfData.commonSeal, function (obj, idx) {
						if (idx == 0 && this.length > 0) {
							// 区切り
							this.push({ id: "", name: "" });
						}
						this.push(obj);
					}, $scope.ouinList);
					// 押印位置
					angular.forEach($scope.pdfData.sealPosition, function (obj, idx) {
						if (idx == 0 && this.length > 0) {
							// 区切り
							this.push({ id: "", name: "" });
						}
						this.push(obj);
					}, $scope.ouinList);
					// 用紙サイズの設定
					$scope.m_yoshi_size = [];
					$scope.m_yoshi_size.push({id: 0, name: $translate.instant('original_size'), dispName: $translate.instant('original_size')});
					// 用紙サイズ情報
					angular.forEach($scope.pdfData.yoshiSize, function(column) {
						// 表示名称の更新
						column.dispName = column.name + '(' + column.tampen + '×' + column.chohen + ')';
						$scope.m_yoshi_size.push(column);
					});

					// pageInfo初期化
					pageInfoInit($scope);

					// 表示制限・変更制限がある場合のみパスワードを求める
					// (印刷・内容コピー制限は求めない)
					if ($scope.pdfData.securityInfo.hyojiSeigenFlg ||
						$scope.pdfData.securityInfo.henkoSeigenFlg) {
						// パスワード入力
						var deferred = $q.defer();
						openPasswordInput($scope, deferred, null, false);
						deferred.promise.then(
							function(result) {
								// 画面情報を設定
								$scope.pdfData.userPassword = result.userPassword;
								$scope.pdfData.ownerPassword = result.ownerPassword;
								$scope.pdfData.totalPageCount = result.totalPageCount;
								pageInfoInit($scope);
								setRaphaelData($scope, $scope.pdfData.dispPage);
							},
							function() {
								// パスワードキャンセル
								$scope.pageBack();
							}
						);
					} else {
						// 画面情報を設定
						setRaphaelData($scope, $scope.pdfData.dispPage);
					}
				},
				function() {
					// 処理失敗
					// 処理なし
				}
			);
		},
		createImage: function($scope, src, data) {

			// 対象ページ以外は処理しない
			if (!(data.pageNo == 0 || data.pageNo == $scope.pdfData.dispPage)) {
				data.type = Const.RAPHAEL_TYPE_IMAGE;
				return;
			}

			// イメージデータ作成
			var image = $scope.raphael.image(src, data.x, data.y, data.width, data.height);
			$scope.raphaelElements.push(image);
			// イメージ情報の設定
			data.type = Const.RAPHAEL_TYPE_IMAGE;
			if (CommonService.isEmpty(data.oid)) {
				image.click(function() {
					maskClickEvent($scope, this);
				});
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
						// 変更フラグ更新
						$scope.info.changed = true;
						// 処理したページNo記憶
						var data = this.data("data");
						data.movePageNo = $scope.pdfData.dispPage;
						// 基準位置設定
						setBasePosition($scope, data);
					}
				);

				// 枠線表示用に矩形を作成
				var mask = $scope.createRect(data);
				mask.data("image", image);

				CommonService.setRahaelTouchEvent($scope, image, maskClickEvent);
				setMouseover($scope, image);
			}

			image.data("data", data);

			if (CommonService.isFirefox()) {
				$('image').attr('onmousedown', 'return false');
			}

			return image;
		},
		createRect: function($scope, data) {
			if (angular.isUndefined(data.x)) {
				CommonService.setPdfOuinTextPosition($scope, data, data.comment);
			}

			// 対象ページ以外は処理しない
			if (!(data.pageNo == 0 || data.pageNo == $scope.pdfData.dispPage)) {
				return;
			}

			// 矩形データ作成
			var fill = setColor(data.fillColorR, data.fillColorG, data.fillColorB);
			var mask = $scope.raphael.rect(data.x, data.y, data.width, data.height);
			$scope.raphaelElements.push(mask);
			mask.attr("fill", fill);
			if (data.fillFlag) {
				mask.attr("fill-opacity", data.fillOpacity);
			} else {
				mask.attr("fill-opacity", 0);
			}
			mask.attr("stroke-width", 0);
			if ((!$scope.isWorkflow() || CommonService.isEmpty(data.oid)) && !data.uneditableFlg) {
				// ワークフロー編集以外 又は 新規矩形 且つ 編集不可オブジェクト（ワークフロー承認時に追加されたオブジェクト）以外の場合、編集可能
				mask.click(function() {
					maskClickEvent($scope, this);
				});
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

						var raphaelKbn;
						if (data.type == Const.RAPHAEL_TYPE_IMAGE) {
							// 印影
							raphaelKbn = Const.RAPHAEL_RECT_IMAGE;
						} else {
							// 文字列
							raphaelKbn = Const.RAPHAEL_RECT_MOJI;

							// ポインター設定
							var pointer = this.data("pointer");
							if (pointer) {
								pointer.attr({
									cx: parseInt(this.attr("x")) + parseInt(this.attr("width")),
									cy: parseInt(this.attr("y")) + parseInt(this.attr("height"))
								});
							}
						}

						// 矩形内のオブジェクトを移動
						setMaskTextPosition($scope, this, raphaelKbn);
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
						// 変更フラグ更新
						$scope.info.changed = true;
					}
				);
				CommonService.setRahaelTouchEvent($scope, mask, maskClickEvent);
				setMouseover($scope, mask);
			}

			// 矩形情報の設定
			if (data.type != Const.RAPHAEL_TYPE_MARK_POSITION && data.type != Const.RAPHAEL_TYPE_IMAGE) {
				// 押印・押印位置以外 -> コメント・マスキング
				data.id = mask.id;
				data.type = Const.RAPHAEL_TYPE_RECT;
				// スケール変更用ポインターの作成
				var pointer = this.createPointer($scope, data, mask);
				mask.data("pointer", pointer);
			}
			mask.data("data", data);

			var text = null;
			if (!CommonService.isEmpty(data.comment)) {
				text = $scope.createText(mask, data, null);
				mask.data("text", text);
				// コメントフィット
				setMaskTextFit($scope, mask);
			} else {
				mask.data("text", text);
			}

			return mask;
		},
		createPointer: function($scope, data, parent) {
			// ポインター作成
			var x = data.x + data.width;
			var y = data.y + data.height;

			var pointer = $scope.raphael.circle(x, y, CommonService.isiOS() ? Const.POINTER_SIZE_IPAD : 8);
			pointer.attr({stroke: "white", "opacity": 0, fill: "red"});
			if ((!$scope.isWorkflow() || CommonService.isEmpty(data.oid)) && !data.uneditableFlg) {
				if (CommonService.isiOS()) {
					pointer.attr({"opacity": 1});
				}
				pointer.hover(
					function() {
						// 移動用ポインターを表示する
						this.attr("opacity", 1);
					},
					function() {
						// 移動用ポインターを非表示にする
						this.attr("opacity", 0);
					}
				);
				pointer.drag(
					function(dx, dy) {
						// 移動
						this.attr({
							cx: this.ox + dx / $scope.slider.scale,
							cy: this.oy + dy / $scope.slider.scale
						});

						// 矩形設定
						// ポインター設定
						if (this.data("parent")) {
							var parent = this.data("parent");
							var data = parent.data("data");
							var w = parseInt(this.attr("cx")) - parseInt(parent.attr("x"));
							var h = parseInt(this.attr("cy")) - parseInt(parent.attr("y"));
							if (w < 5 || h < 5) {
								return;
							}
							parent.attr({width: w, height: h });
							data.width = w;
							data.height = h;

							// 文字列調整
							setMaskTextFit($scope, parent);
						}
					},
					function() {
						// 開始
						this.ox = this.attr("cx");
						this.oy = this.attr("cy");
					},
					function() {
						// 終了
						// 変更フラグ更新
						$scope.info.changed = true;
						// ポインター再設定
						var parent = this.data("parent");
						var data = parent.data("data");
						this.attr({
							cx: data.x + data.width,
							cy: data.y + data.height
						});
					}
				);
				pointer.mouseover(function(e) {
					this.attr("cursor", Const.CURSOR_RESIZE);
				});
			}
			pointer.data("parent", parent);
			return pointer;
		},
		createText: function($scope, parent, data, textElement) {
			var text = textElement;
			if (!text) {
				text = $scope.raphael.text(parent.attr("x"), parent.attr("y"), "");
				parent.data("text", text);
				text.data("parent", parent);
				if ((!$scope.isWorkflow() || CommonService.isEmpty(data.oid)) && !data.uneditableFlg) {
					// ワークフロー編集以外 又は 新規コメント 且つ 編集不可オブジェクト（ワークフロー承認時に追加されたオブジェクト）以外の場合、編集可能
					text.click(function() {
						maskClickEvent($scope, this.data("parent"));
					});
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

							// ポインター設定
							var pointer = parent.data("pointer");
							if (pointer) {
								pointer.attr({
									cx: parseInt(parent.attr("x")) + parseInt(parent.attr("width")),
									cy: parseInt(parent.attr("y")) + parseInt(parent.attr("height"))
								});
							}

							// 文字列移動
							setMaskTextPosition($scope, parent, Const.RAPHAEL_RECT_MOJI);
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
							// 変更フラグ更新
							$scope.info.changed = true;
						}
					);
					CommonService.setRahaelTouchEvent($scope, text, maskClickEvent);
					setMouseover($scope, text);
				}
			}

			text.attr("text-anchor", "start");
			text.attr("text", data.comment);
			text.attr("font-family", CommonService.getFontName(data.font));
			text.attr("font-size", data.fontSize);
			text.attr("fill", setColor(data.fontColorR, data.fontColorG, data.fontColorB));
			text.attr("fill-opacity", data.fillOpacity);
			var inputRotate = data.rotate;
			if (data.fillFlag) {
				inputRotate = 0;
			}
			var transform = Raphael.parseTransformString(text.transform());
			if (!CommonService.isEmpty(transform)) {
				text.transform("");
			}
			CommonService.setPdfOuinTextRotate(text.data("parent"), -inputRotate);
			setMaskTextPosition($scope, parent, Const.RAPHAEL_RECT_MOJI);
			return text;
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
		// マスキング開始
		maskingStart: function($scope, x, y) {
			$scope.masking.startX = getScaleOffsetPos($scope, x);
			$scope.masking.startY = getScaleOffsetPos($scope, y);
			$scope.masking.element = $scope.raphael.rect($scope.masking.startX, $scope.masking.startY, 1, 1);
			$scope.masking.element.attr({"fill-opacity": 0.5, fill: "gray"});

			return $scope.masking.element;
		},
		// マスキング範囲移動中
		maskingMove: function($scope, x, y) {
			if ($scope.masking.element != null) {
				var rect = getMaskingRect($scope, x, y);
				$scope.masking.endX = x;
				$scope.masking.endY = y;
				$scope.masking.element.attr({
					x: rect[0],
					y: rect[1],
					width: rect[2],
					height: rect[3]
				});
			}
		},
		// マスキング終了
		maskingEnd: function($scope, x, y) {
			if ($scope.masking.element != null) {
				var rect = getMaskingRect($scope, x, y);
				var data = {
					oid: null,
					type: Const.RAPHAEL_TYPE_RECT,
					x: rect[0],
					y: rect[1],
					width: rect[2],
					height: rect[3],
					allPage: false,
					font: Const.FONT_NAME_MS_GOTHIC_KBN,
					fontSize: 11,
					fontColorR: 0,
					fontColorG: 0,
					fontColorB: 0,
					fillFlag: false,
					fillColorR: 128,
					fillColorG: 128,
					fillColorB: 128,
					fillOpacity: 0.5,
					rotate: 0,
					pageNo: $scope.pdfData.dispPage,
					uneditableFlg: false
				};
				if (data.width < Const.PDF_OIN_MASKING_MIN_WIDTH) {
					data.width = Const.PDF_OIN_MASKING_MIN_WIDTH;
				}
				if (data.height < Const.PDF_OIN_MASKING_MIN_HEIGHT) {
					data.height = Const.PDF_OIN_MASKING_MIN_HEIGHT;
				}
				var mask = $scope.createRect(data);
				$scope.pdfData.pageInfo[$scope.pdfData.dispPage - 1].rectangle.push(data);
				$scope.maskEdit(mask, true);
			}
		},
		// マスキングキャンセル
		maskingCancel: function($scope, x, y) {
			if ($scope.masking.element != null) {
				$scope.masking.element.remove();
				$scope.masking.element = null;
			}
		},
		maskEdit: function($scope, element, isCreate) {
			// マスキング／コメント設定
			$scope.maskModal = element.data("data");
			var template = "app/pdf-masking/pdf-masking.html";
			var controller = "PdfMaskingController";
			var promise = CommonService.openModal($scope, template, controller);
			promise.then(
				function(result) {
					// マスキング／コメント設定成功処理
					if ($scope.masking.element) {
						$scope.masking.element.remove();
						$scope.masking.element = null;
					}
					var data = element.data("data");
					data.allPage = result.allPage;
					if (data.allPage) {
						data.pageNo = 0;
					}
					if (result.touka > 0) {
						data.fillOpacity = 1 - (result.touka / 100);
					} else {
						data.fillOpacity = 1;
					}
					data.font = result.font;
					data.fontSize = result.fontSize;
					data.fontColorR = CommonService.getColor(result.fontColor, Const.COLOR_R);
					data.fontColorG = CommonService.getColor(result.fontColor, Const.COLOR_G);
					data.fontColorB = CommonService.getColor(result.fontColor, Const.COLOR_B);
					data.fillFlag = result.colorFlag;

					data.rotate = result.kakudo;
					data.comment = result.comment;
					data.uneditableFlg = false;
					// 要素に反映
					if (data.fillFlag) {
						element.attr("fill-opacity", data.fillOpacity);
						data.fillColorR = CommonService.getColor(result.color, Const.COLOR_R);
						data.fillColorG = CommonService.getColor(result.color, Const.COLOR_G);
						data.fillColorB = CommonService.getColor(result.color, Const.COLOR_B);
					} else {
						element.attr("fill-opacity", 0);
						data.fillColorR = null;
						data.fillColorG = null;
						data.fillColorB = null;
					}
					element.attr("fill", result.color);
					var text = element.data("text");
					if (!text && !CommonService.isEmpty(data.comment)) {
						text = $scope.createText(element, data, null);
					} else if (text && CommonService.isEmpty(data.comment)) {
						// コメントが空の場合、テキスト要素削除
						text.remove();
						text = null;
						element.data("text", text);
					} else {
						$scope.createText(element, data, text);
					}

					// コメントフィット
					setMaskTextFit($scope, element);
					// 変更フラグ更新
					$scope.info.changed = true;
				},
				function() {
					// キャンセル
					if ($scope.masking.element) {
						$scope.masking.element.remove();
						$scope.masking.element = null;
					}
					if (isCreate) {
						elementRemove(element);
						$scope.pdfData.pageInfo[$scope.pdfData.dispPage - 1].rectangle.pop();
					}
				}
			);
		},
		ouin: function($scope, obj) {
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
				if (obj.pageNo > $scope.pdfData.totalPageCount) {
					data.oinIchiDtl.splice(idx, 1);
				} else {
					idx++;
				}
			}
			data.src = null;
			createOuin($scope, data);
			data.oid = null;
			$scope.pdfData.pageInfo[$scope.pdfData.dispPage - 1].rectangle.push(data);
			// 変更フラグ更新
			$scope.info.changed = true;
		},
		save: function($scope) {
			var promise = CommonService.dispMessage($scope, "Q00001", ["save"]);
			promise.then(
				function(result) {
					// OKの場合
					// (印刷権限または内容コピー制限)かつ権限PWの入力を求めていない場合
					if (($scope.pdfData.securityInfo.insatsuSeigenFlg ||
						$scope.pdfData.securityInfo.naiyoCopySeigenFlg) &&
						CommonService.isEmpty($scope.pdfData.ownerPassword)) {
						// パスワード入力
						var deferred = $q.defer();
						openPasswordInput($scope, deferred, null, true);
						deferred.promise.then(
							function(result) {
								// 権限PWを設定
								$scope.pdfData.ownerPassword = result.ownerPassword;
								// 保存
								save($scope);
							},
							function() {
								// パスワードキャンセル
								// 処理なし
							}
						);
					} else {
						// 保存
						save($scope);
					}
				}
			);
		},
		changeYoshiSize: function($scope) {
			if ($scope.pdfData && $scope.pdfData.pageInfo) {
				var dispPage = $scope.pdfData.dispPage;
				var yoshiSize = $scope.pdfData.pageInfo[dispPage - 1].yoshiSizeId;
				if ($scope.pdfData.allPage) {
					// 全ページ適用の場合
					angular.forEach($scope.pdfData.pageInfo, function(page) {
						page.yoshiSizeId = yoshiSize;
					});
				}
				setFilePageSizeInfo($scope);
			}
		},
		print: function($scope) {
			var promise = CommonService.dispMessage($scope, "Q00001", ["print"]);
			promise.then(
				function(result) {
					// OKの場合
					// 印刷権限かつ権限PWの入力を求めていない場合
					if ($scope.pdfData.securityInfo.insatsuSeigenFlg &&
						CommonService.isEmpty($scope.pdfData.ownerPassword)) {
						// パスワード入力
						var deferred = $q.defer();
						openPasswordInput($scope, deferred, null, true);
						deferred.promise.then(
							function(result) {
								// 権限PWを設定
								$scope.pdfData.ownerPassword = result.ownerPassword;
								// 印刷
								print($scope);
							},
							function() {
								// パスワードキャンセル
								// 処理なし
							}
						);
					} else {
						// 印刷
						print($scope);
					}
				}
			);
		},
		cancel: function($scope) {
			if ($scope.info.changed) {
				var promise = CommonService.dispMessage($scope, "Q00001", ["editCancel"]);
				promise.then(
					function(result) {
						$scope.pageBack();
					}
				);
			} else {
				$scope.pageBack();
			}
		},
		// ページ切替
		changePage: function($scope, pageKbn) {
			if (angular.isDefined(pageKbn)) {
				// ページング変更処理
				CommonService.setDispPage($scope.pdfData, pageKbn);
			}
			// PDFページ画像更新
			setRaphaelData($scope, $scope.pdfData.dispPage);
		},
		setScale: function($scope, blnScreen) {
			// 画面表示倍率の設定

			// 画面サイズの取得
			var screenWidth = getElementInfo('panePdfBody', 'offsetWidth');
			var screenHeight = getElementInfo('panePdfBody', 'offsetHeight');
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
		pageBack: function($scope) {
			// セッションストレージ削除
			if ($scope.storage) {
				if ($scope.storage.rectangle && $scope.storage.rectangle[$scope.paramId]) {
					delete $scope.storage.rectangle[$scope.paramId];
				}
				if ($scope.storage.info && $scope.storage.info[$scope.paramId]) {
					delete $scope.storage.info[$scope.paramId];
				}
			}
			// 「メイン画面」へ遷移
			$location.path(Const.PATH_MAIN).search({});
		},
		getMousePos: function(e) {
			var mousePos = {};
			if (e.type.indexOf('touch') != -1) {
				// タッチ位置の取得
				var offset = $("svg").offset();
				mousePos.x = e.originalEvent.changedTouches[0].clientX - offset.left;
				mousePos.y = e.originalEvent.changedTouches[0].clientY - offset.top;
			} else {
				// マウス位置の取得
				if (CommonService.isFirefox()) {
					var offset = $("svg").offset();
					mousePos.x = e.pageX - offset.left;
					mousePos.y = e.pageY - offset.top;
				} else {
					mousePos.x = e.offsetX;
					mousePos.y = e.offsetY;
				}
			}
			return mousePos;
		}
	}
});
