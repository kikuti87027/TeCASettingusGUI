'use strict';

app.controller('PdfController', function ($scope, $location, $translate, $timeout, PdfService, CommonService, Const) {

	$scope.$parent.headerButton = false;

	$scope.pdfData = {};
	$scope.jnlp = null;
	$scope.storage = null;

	$scope.raphael = null;
	$scope.raphaelElements = [];
	$scope.masking = {
		element: null,
		startX: 0,
		startY: 0,
		endX: 0,
		endY: 0,
	};
	$scope.mode = Const.PDF_EDIT_MODE_DEFAULT;
	$scope.selectOuin = null;

	$scope.baseImage = {
		image: null,
		width: null,
		height: null
	};

	$scope.info = {};
	$scope.info.changed = false;

	$scope.slider = {
		scale: 1,
		step: 10,
		min: 10,
		max: 200,
		value: 100,
		changeFlg: false
	};

	$scope.isWorkflow = function() {
		return $scope.paramWorkflowId != 0;
	};

	// オプション情報取得
	$scope.getOption = function(sbt) {
		return CommonService.getOption($scope, sbt);
	};

	// 倍率変更処理
	$scope.changeScale = function(kakudai) {
		var scale = CommonService.parseInt($scope.slider.value, 100);
		if (kakudai) {
			// 拡大押下時
			scale = scale + $scope.slider.step;
			if (scale > $scope.slider.max) {
				scale = $scope.slider.max;
			}
		} else {
			// 縮小押下時
			scale = scale - $scope.slider.step;
			if (scale < $scope.slider.min) {
				scale = $scope.slider.min;
			}
		}
		$scope.slider.value = scale;
	};

	// 画面に合わせる(横幅・全体)
	$scope.baseFit = function(blnScreen) {
		PdfService.setScale($scope, blnScreen);
	};

	// 倍率監視処理
	$scope.$watch('slider.value', function(newValue, oldValue) {

		if (!CommonService.checkDigit(newValue)) {
			return;
		}
		if (newValue > $scope.slider.max || newValue < $scope.slider.min) {
			return;
		}
		PdfService.resizeImage($scope, newValue);
		$('.range-slider').val(newValue).change();
	});

	$scope.checkSliderValue = function() {
		// 変更中フラグを false に更新
		$scope.slider.changeFlg = false;

		var value = CommonService.parseInt($scope.slider.value, 100);
		if (value > $scope.slider.max) {
			value = $scope.slider.max;
		}
		if (value < $scope.slider.min) {
			value = $scope.slider.min;
		}
		$scope.slider.value = value;
	};

	// スライドバー即時反映用の倍率変更処理（直接入力）
	$scope.changeSliderValue = function() {
		// 変更中フラグを true に更新
		$scope.slider.changeFlg = true;

		// スライドバーの位置を変更
		var value = parseInt($scope.slider.value);
		if (!isNaN(value)) {
			$('.range-slider').val(value).change();
		}
	}

	$scope.resizeImage = function(newValue) {
		PdfService.resizeImage($scope, newValue);
	};

	$scope.createImage = function(src, data) {
		return PdfService.createImage($scope, src, data);
	};

	$scope.createRect = function(data) {
		return PdfService.createRect($scope, data);
	};

	$scope.createText = function(parent, data, textElement) {
		return PdfService.createText($scope, parent, data, textElement);
	}

	$scope.mask = function() {
		if ($scope.mode == Const.PDF_EDIT_MODE_MASKING) {
			$scope.modeDefault();
		} else {
			$scope.mode = Const.PDF_EDIT_MODE_MASKING;
			$("#base").css("cursor", Const.CURSOR_MASKING);
		}
	};

	$scope.maskEdit = function(elements, isCreate) {
		PdfService.maskEdit($scope, elements, isCreate);
	};

	$scope.save = function () {
		PdfService.save($scope);
	};

	// ページサイズ変更
	$scope.changeYoshiSize = function() {
		PdfService.changeYoshiSize($scope);
	};

	// ページ適用トグル監視処理
	$scope.$watch('pdfData.allPage', function(newValue) {
		PdfService.changeYoshiSize($scope);
	})

	$scope.print = function() {
		PdfService.print($scope);
	};

	$scope.cancel = function () {
		PdfService.cancel($scope);
	};

	$scope.ouin = function(obj) {
		if (!obj) {
			if ($scope.mode == Const.PDF_EDIT_MODE_OUIN) {
				$scope.modeDefault();
			}
			return;
		}
		if (obj.oinIchiDtl) {
			// 押印位置
			PdfService.ouin($scope, obj);
		} else {
			// 個人・共通印
			$scope.mode = Const.PDF_EDIT_MODE_OUIN;
			$scope.selectOuin = obj;
			$("#base").css("cursor", Const.CURSOR_OUIN);
		}
	};

	$scope.remove = function() {
		if ($scope.mode == Const.PDF_EDIT_MODE_REMOVE) {
			$scope.modeDefault();
		} else {
			$scope.mode = Const.PDF_EDIT_MODE_REMOVE;
		}
	};

	$scope.selector = function() {
		if ($scope.mode == Const.PDF_EDIT_MODE_SELECT) {
			$scope.modeDefault();
		} else {
			$scope.mode = Const.PDF_EDIT_MODE_SELECT;
		}
	};

	// 印刷可否
	$scope.isNotPrint = function() {
		if ($scope.pdfData.securityInfo.hyojiSeigenFlg == false &&
			$scope.pdfData.securityInfo.henkoSeigenFlg == false &&
			$scope.pdfData.securityInfo.insatsuSeigenFlg == true) {
			return true;
		}
		if ($scope.pdfData.securityInfo.hyojiSeigenFlg == true &&
			$scope.pdfData.securityInfo.henkoSeigenFlg == false &&
			$scope.pdfData.securityInfo.insatsuSeigenFlg == true) {
			return true;
		}
		return false;
	};

	// ボタン非活性条件チェック
	$scope.checkDisabled = function(button) {

		if (button == Const.BUTTON_CANCEL) {
			// キヤンセルボタンは常に活性
			return false;
		}

		if ($scope.baseImage.image == null) {
			// PDFイメージに取得失敗した場合、非活性
			return true;
		}

		if (button == Const.BUTTON_ZOOM_OUT || button == Const.BUTTON_ZOOM_IN) {
			// 倍率を取得
			var value = CommonService.parseInt($scope.slider.value, 100);

			// 閾値に達した場合、非活性
			if (button == Const.BUTTON_ZOOM_OUT && value <= $scope.slider.min) {
				// 縮小ボタン
				return true;
			} else if (button == Const.BUTTON_ZOOM_IN && value >= $scope.slider.max) {
				// 拡大ボタン
				return true;
			}
		}

		// 条件に一致しない場合、活性
		return false;
	};

	// 「ページング」ボタン押下処理
	$scope.changePage = function(pageKbn) {
		$scope.modeDefault();
		PdfService.changePage($scope, pageKbn);
		if (pageKbn == Const.PAGING_LAST) {
			$scope.pdfData.dispPage = $scope.pdfData.totalPageCount;
		}
	};

	// 「ページ」を設定
	$scope.changeDispPage = function(oldValue) {
		$scope.modeDefault();
		$scope.pdfData.dispPage = CommonService.parseInt($scope.pdfData.dispPage, 0);
		if (!$scope.pdfData.dispPage || $scope.pdfData.dispPage < 0) {
			// 0 又は 空 が入力された場合、1とする
			$scope.pdfData.dispPage = 1;
		}

		if ($scope.pdfData.dispPage > $scope.pdfData.totalPageCount) {
			// 最大ページ数以上の場合、最大ページ数とする
			$scope.pdfData.dispPage = $scope.pdfData.totalPageCount;
		}

		if (!angular.equals($scope.pdfData.dispPage, oldValue)) {
			// 入力されている値が変更された場合、データ取得
			PdfService.changePage($scope);
		}
	};

	// 通常モード設定
	$scope.modeDefault = function() {
		$scope.mode = Const.PDF_EDIT_MODE_DEFAULT;
		$("#base").css("cursor", Const.CURSOR_DEFAULT);
	};

	// 遷移元画面に戻る
	$scope.pageBack = function() {
		PdfService.pageBack($scope);
	};

	// 初期化処理
	PdfService.init($scope);

	$("svg").bind('mousedown touchstart', function(e) {
		var mousePos = PdfService.getMousePos(e);
		if ($scope.mode == Const.PDF_EDIT_MODE_MASKING) {
			$scope.mode = Const.PDF_EDIT_MODE_MASKING_START;
			PdfService.maskingStart($scope, mousePos.x, mousePos.y);
		}
		if (e.type == 'mousedown' && e.which != 1) {
			// 左クリック以外、モード解除
			$timeout(function() {
				$scope.modeDefault();
			}, 100);
		}
	}).bind('mousemove touchmove', function(e) {
		var mousePos = PdfService.getMousePos(e);
		if (mousePos.x > $scope.baseImage.width * $scope.slider.scale || mousePos.y > $scope.baseImage.height * $scope.slider.scale) {
			return;
		}
		if ($scope.mode == Const.PDF_EDIT_MODE_MASKING_START && (e.type = 'touchmove' || e.which == 1)) {
			PdfService.maskingMove($scope, mousePos.x, mousePos.y);
		} else if ($scope.mode == Const.PDF_EDIT_MODE_MASKING_START) {
			// ブラウザ外で左クリックをリリースした場合
			$scope.mode = Const.PDF_EDIT_MODE_MASKING;
			PdfService.maskingCancel($scope, mousePos.x, mousePos.y);
		}
	}).bind('mouseup touchend', function(e) {
		var mousePos = PdfService.getMousePos(e);
		if (mousePos.x > $scope.baseImage.width * $scope.slider.scale || mousePos.y > $scope.baseImage.height * $scope.slider.scale) {
			return;
		}
		if ($scope.mode == Const.PDF_EDIT_MODE_MASKING_START) {
			PdfService.maskingEnd($scope, mousePos.x, mousePos.y);
			$scope.modeDefault();
		} else if ($scope.mode == Const.PDF_EDIT_MODE_OUIN) {
			$scope.selectOuin.sx = mousePos.x / $scope.slider.scale;
			$scope.selectOuin.sy = mousePos.y / $scope.slider.scale;
			PdfService.ouin($scope, $scope.selectOuin);
		}
	});

	$("#panePdfBody").bind('mouseup touchend', function(e) {
		if ($scope.mode == Const.PDF_EDIT_MODE_MASKING_START) {
			PdfService.maskingEnd($scope, $scope.masking.endX, $scope.masking.endY);
			$scope.modeDefault();
		};
	});
});
