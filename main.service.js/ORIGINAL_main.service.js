'use strict';
//1.15.0　マスターオリジナル版
app.factory('MainService', function($rootScope, $timeout, $location, $translate, $templateCache, uiGridConstants, CommonService, Const, StorageService, ZokuseiSearchService, socket, OptionService) {
	// 処理別通信先
	var ACTION = '/api/main';
	var ACTION_SEARCH = ACTION + '/search';
	var ACTION_REMOVE = ACTION + '/remove';
	var ACTION_ATTR_DELETE = ACTION + '/attr-delete';
	var ACTION_THUMBNAIL = ACTION + '/thumbnail'
	var ACTION_SEARCH_KOSEI = ACTION + '/search-kosei';
	var ACTION_SEARCH_DETAIL = ACTION + '/search-detail';
	var ACTION_SEARCH_PREVIEW = ACTION + '/search-preview';
	var ACTION_SEARCH_PREVIEW_IE = ACTION + '/search-preview-ie';
	var ACTION_PRINT = ACTION + '/print';
	var ACTION_STAR = ACTION + '/star';
	var ACTION_CSV_OUTPUT = ACTION + '/csv';
	var ACTION_DOWNLOAD = ACTION + '/download';
	var ACTION_ORIGINALFILE_DOWNLOAD = ACTION + '/original-download';
	var ACTION_FILE_SAVE = ACTION + '/file-save';
	var ACTION_FILE_REMOVE = ACTION + '/file-remove';
	var ACTION_APP_LINK = ACTION + '/app-link';
	var ACTION_PDF_CONVERT = ACTION + '/pdf-convert';
	var ACTION_COMMENT_SAVE = ACTION + '/comment-save';
	var ACTION_COMMENT_SEARCH = ACTION + '/comment-search';
	var ACTION_LIST_DELETE = ACTION + '/list-delete';
	var ACTION_LIST_DELETE_CANCEL = ACTION + '/list-delete-cancel';

	var ACTION_WORKFLOW_SEARCH = ACTION + '/workflow-search';
	var ACTION_WORKFLOW_SEARCH_SHINSEI = ACTION + '/workflow-shinsei';
	var ACTION_WORKFLOW_SEARCH_DETAIL = ACTION + '/workflow-detail';
	var ACTION_WORKFLOW_DOWNLOAD = ACTION + '/workflow-download';
	var ACTION_WORKFLOW_CONFIRM = ACTION + '/workflow-confirm';
	var ACTION_WORKFLOW_DISMISS = ACTION + '/workflow-dismiss';
	var ACTION_WORKFLOW_APPLICATION_CANCEL = ACTION + '/workflow-cancel-application';
	var ACTION_WORKFLOW_PROCESSING_CANCEL = ACTION + '/workflow-cancel-processing';
	var ACTION_WORKFLOW_DRAFT_CANCEL = ACTION + '/workflow-cancel-draft';
	var ACTION_WORKFLOW_COMPLETED_DELETE = ACTION + '/workflow-completed-delete';
	var ACTION_WORKFLOW_REMAND = ACTION + '/workflow-remand';

	var ACTION_JNLP_FILE_REMOVE = '/api/jnlp/remove';

	// 表示タブ設定
	var ACTIVE_TAB_WORKFLOW = { workflow: true, tree: false, zokusei: false, zenbun: false };
	var ACTIVE_TAB_TREE = { workflow: false, tree: true, zokusei: false, zenbun: false };
	var ACTIVE_TAB_ZOKUSEI = { workflow: false, tree: false, zokusei: true, zenbun: false };
	var ACTIVE_TAB_ZENBUN = { workflow: false, tree: false, zokusei: false, zenbun: true };
	// 初期ソート項目(１番目の属性の為、指定なし)
	var DEFAULT_SORT_COLUMN = null;
	// 初期ソートタイプ(昇順)
	var DEFAULT_SORT_DIRECTION = uiGridConstants.ASC;
	var myLayout;
	var searchLayoutClosed = null;
	var listLayoutClosed = null;
	var commentLayoutClosed = null;
	var layoutWidth = null;
	var isIE = false;
	var isFF = false;
	// 構成図面、関連ファイル項目
	var COLUMN_ERROR = 0;
	var COLUMN_QTY = 3;
	var COLUMN_PREVIEW_KOSEI = 4;
	var COLUMN_DELETE_KOSEI = 5;
	var COLUMN_PREVIEW_KANREN = 2;
	var COLUMN_DELETE_KANREN = 3;
	// ファイルステータス
	var STATUS_CHECKOUT_FLG = 1;
	var STATUS_WORKFLOWSHINSEICHU_FLG = 2;
	// 属性検索固定項目
	var ZOKUSEI_SEARCH_CHECK_OUT_USER = -1;
	var ZOKUSEI_SEARCH_FILE_ID = -2;

	// セッション情報取得待機
	// (非同期通信でセッション情報を取得しているため)
	var sessionWatch = function ($scope, counter) {
		if (counter > 120) {
			// 無限ループ防止
			return;
		}
		setTimeout(function () {
			if ($rootScope.session) {
				// AD認証OFFの場合
				if (!$rootScope.session.userInfo.noAuthentication) {
					// パスワード有効期限チェック
					var date = new Date();
					date.setHours(0);
					date.setMinutes(0);
					date.setSeconds(0);
					date.setMilliseconds(0);
					if (date.getTime() > $rootScope.session.userInfo.passwordValidKigen) {
						// パスワード変更画面表示
						var template = "app/change-password/change-password.html";
						var controller = "ChangePasswordController";
						$scope.modal = {
							login: true,
							cancelHideFlg: true
						};
						var promise = CommonService.openModal($scope, template, controller);
					}
				}
			} else {
				counter++;
				sessionWatch($scope, counter);
			}
		}, 500);
	};

	// レイアウトのリサイズ
	var layoutResize = function() {
		if (myLayout) {
			$timeout(function() {
				myLayout.resizeAll();
			}, 2000);
		}
	};

 	// 選択タブチェック（ワークフロー検索）
	var isActiveTabWorkflow = function($scope) {
		if ($scope.$parent.searchAreaTabs[Const.KENSAKU_TAB_WORKFLOW]) {
			return $scope.$parent.searchAreaTabs[Const.KENSAKU_TAB_WORKFLOW].active;
		}
		return false;
	};

	// 選択タブチェック（ツリー検索）
	var isActiveTabTree = function($scope) {
		if ($scope.$parent.searchAreaTabs[Const.KENSAKU_TAB_TREE]) {
			return $scope.$parent.searchAreaTabs[Const.KENSAKU_TAB_TREE].active;
		}
		return false;
	};

	// 選択タブチェック（属性検索）
	var isActiveTabZokusei = function($scope) {
		if ($scope.$parent.searchAreaTabs[Const.KENSAKU_TAB_ZOKUSEI]) {
			return $scope.$parent.searchAreaTabs[Const.KENSAKU_TAB_ZOKUSEI].active;
		}
		return false;
	};

	// 選択タブチェック（全文検索）
	var isActiveTabZenbun = function($scope) {
		if ($scope.$parent.searchAreaTabs[Const.KENSAKU_TAB_ZENBUN]) {
			return $scope.$parent.searchAreaTabs[Const.KENSAKU_TAB_ZENBUN].active;
		}
		return false;
	};

 	// ツリー構造区分チェック（ツリー）
	var isKozoKbnTree = function(type) {
		return type == Const.KOZO_KBN_TREE;
	};

 	// ツリー構造区分チェック（フォルダ）
	var isKozoKbnFolder = function(type) {
		return type == Const.KOZO_KBN_FOLDER;
	};

 	// ツリー構造区分チェック（スター付き）
	var isKozoKbnStar = function(type) {
		return type == Const.TREE_KOZO_KBN_STAR;
	};

 	// ツリー構造区分チェック（検索条件）
	var isKozoKbnJoken = function(type) {
		return type == Const.TREE_KOZO_KBN_JOKEN;
	};

 	// ツリー構造区分チェック（ゴミ箱）
	 var isKozoKbnTrashBox = function(type) {
		return type == Const.TREE_KOZO_KBN_TRASH_BOX;
	};

	// 検索エリア初期化処理
	var initSearchAreaData = function($scope, forced) {
		if (!$scope.$parent.initialized || forced) {
			// ワークフロー検索タブ情報
			$scope.$parent.activeTabIndex = null;
			// 差し戻し件数
			$scope.$parent.cntWorkflowSendback = null;
			// 処理待ち件数
			$scope.$parent.cntWorkflowWating = null;
			// 処理者無効件数
			$scope.$parent.cntProcessorInvalid = null;
			// ワークフロー選択区分
			$scope.$parent.workflowSelectedKbn = null;
			// 表示情報
			$scope.$parent.treeSearchView = [];
			// ツリー選択情報
			$scope.$parent.selectedBranch = null;
			// 属性検索タブ文書種リスト
			$scope.$parent.bunshoshuList = null;
			// 属性検索タブ文書種属性情報
			$scope.$parent.bunshoshuZokusei = null;
			// 属性検索タブ情報設定
			$scope.$parent.zokusei = null;
			// 簡易検索タブ情報設定
			$scope.$parent.searchAreaData = {
				checkOutJoken: "null",
				checkOutUser: {
					'name': $translate.instant("check_out_user"),
					'dataTypeKbn': Const.ZOKUSEI_DATA_TYPE_KBN_SELECT,
					'sentakushiDataShutokusakiKbn': 2,
					'kensakuJokenString': null,
					'work': {
						'kensakuValSentakushi': null,
						'ronriJokenKbn': null,
						'miSetteiFlg': false
					}
				},
				fileId: {
					'name': null,
					'fileIdFlg': true,
					'kensakuJokenString': null,
					'work': {
						'kensakuValFileId': null,
						'kensakuValFileIdFrom': null,
						'kensakuValFileIdTo': null,
						'ronriJokenKbn': null
					}
				},
				zenbunKensakuVal: null,
				zenbunKensakuAndFlg: false,
				zenbunKensakuKanzenIcchiFlg: false,
				zenbunKensakuPdfAddACharacterFlg: false,
				zenbunKensakuIncludChoiceFlg: false,
				zenbunKensakuIncludPdfTextOldFlg: false
			};
			// 検索条件（名前を変更・条件を削除）ボタン制御
			$scope.$parent.kensakuJokenDisabled = true;
		}
	};

	// 一覧エリア初期化処理
	var initListAreaData = function($scope, forced) {
		if (!$scope.$parent.initialized || forced) {
			// ファイル一覧リフレッシュフラグを Off にする。
			$scope.$parent.fileListRefreshFlg = false;
			// 一覧設定情報
			$scope.$parent.hashKey = null;
			// ページング
			$scope.$parent.pagination = null;
			$scope.$parent.fileListPagination = null;
			$scope.$parent.dataTypePage = CommonService.getUserInfo(Const.USER_SETTEI_LIST_HYOJI_KENSU);
			// 属性項目の初期化
			$scope.$parent.listAreaZokuseiList = null;
			$scope.$parent.fileListAreaSelectData = null;
			// 構成逆展開の初期化
			$scope.$parent.koseiGyakuTenkai = false;
			// 文書種デフォルト設定
			$scope.$parent.bunshoshu = CommonService.getUserInfo(Const.USER_SETTEI_BUNSHOSHU);
			// 一覧エリアの開閉状態
			$scope.$parent.fileListClosed = false;
		}
		// 一覧表示・表示件数設定
		$scope.listDispCnt = [
			{kbn: 10, name: "10"},
			{kbn: 20, name: "20"},
			{kbn: 50, name: "50"},
			{kbn: 100, name: "100"}
		];
		// ファイルリスト設定
		$scope.fileList_gridOptions = {
			rowTemplate: 'app/main/mainFileListTemplate.html',
			saveWidths: true,
			saveOrder: true,
			saveScroll: true,
			saveFocus: true,
			saveVisible: true,
			saveSort: true,
			saveFilter: true,
			savePinning: true,
			saveGrouping: true,
			saveGroupingExpandedStates: true,
			saveTreeView: true,
			saveSelection: true,
			enableHiding: false,
			enableColumnMenus: false,
			enableExpandAll: false,
			excessRows: Const.EXCESS_ROWS_FILE_LIST,
			excessColumns: Const.EXCESS_COLUMNS_FILE_LIST,
			showTreeExpandNoChildren: false,
			useExternalSorting: true,
			columnDefs: [],
			data: [],
			onRegisterApi: function(gridApi) {
				// グリッド行情報の設定
				$scope.gridRowsState = [];
				angular.forEach($scope.$parent.gridRows, function(row) {
					// 設定情報の取得
					var data = {
						'isSelected': row.isSelected || false,
						'state': row.treeNode.state || false,
						'hashKey': row.entity.$$hashKey
					};
					$scope.gridRowsState.push(data);
				});
				$scope.fileListGridApi = gridApi;
				$scope.$parent.gridRows = $scope.fileListGridApi.grid.rows;
				// ツリーオープン処理
				$scope.fileListGridApi.treeBase.on.rowExpanded($scope, function(row) {
					// データ反映時は処理を行わない
					if ($scope.restoreFlg) { return; }
					// 一覧の状態を保存
					$scope.$parent.fileListGridApiState = $scope.fileListGridApi.saveState.save();
					// 構成情報の取得処理
					if (!row.entity.searched && row.entity.kosei) {
						getFileListKoseiData($scope, row.entity);
						$scope.fileListGridApi.grid.refresh();
					}
				});
				// ソートイベント
				$scope.fileListGridApi.core.on.sortChanged($scope, function(grid, sort) {
					// データ反映時は処理を行わない
					if ($scope.restoreFlg) { return; }
					// 一覧の状態を保存
					$scope.$parent.fileListGridApiState = $scope.fileListGridApi.saveState.save();
					// 保持している検索条件の取得
					var searchJoken = $scope.$parent.fileListSearchJoken;
					// 検索条件を設定
					if (sort[0]) {
						// ソート情報が有る場合、該当項目を設定
						searchJoken.sortColumn = sort[0].colDef.id;
						searchJoken.sortDirection = sort[0].sort.direction;
					} else {
						// ソート情報が無い場合、初期値を設定
						searchJoken.sortColumn = null;
						searchJoken.sortDirection = null;
					}
					// 一覧データ取得処理
					getListData($scope, searchJoken);
				});
				// 行選択処理イベント
				$scope.fileListGridApi.selection.on.rowSelectionChanged($scope, function(row) {
					// データ反映時は処理を行わない
					if ($scope.restoreFlg) { return; }
					// 全選択状態チェック
					checkAllSelected($scope, $scope.fileListGridApi.grid);
				});
				// カラムサイズ変更イベント
				$scope.fileListGridApi.colResizable.on.columnSizeChanged($scope, function(colDef, deltaChange) {
					// データ反映時は処理を行わない
					if ($scope.restoreFlg) { return; }
					// 一覧の状態を保存
					$scope.$parent.fileListGridApiState = $scope.fileListGridApi.saveState.save();
				});
				$scope.fileListGridApi.core.on.renderingComplete($scope, function() {
					// リフレッシュを伴わない画面遷移時のみ実施
					if ($scope.$parent.initialized != null
						&& $scope.$parent.initialized
						&& !isActiveTabWorkflow($scope)) {
						// 境のバーの状態を復元
						reDrawCenterLine($scope.fileList_gridOptions.data, $scope.$parent.fileListClosed);
					}
				});
			}
		};
	};

	// 全選択状態チェック
	var checkAllSelected = function($scope, grid) {
		var selectAll = true;
		angular.forEach(grid.rows, function(row) {
			// 全選択状態 且つ 有効行 の場合のみチェックを行う
			if (selectAll && !row.treeLevel && row.entity.id) {
				// 行の選択状態をチェック
				if (row.isSelected) {
					// 選択されている場合
					if (row.treeNode.children.length) {
						selectAll = checkAllSelectedChildren(row.treeNode.children, selectAll);
					}
				} else {
					// 選択されていない場合、全選択状態を解除
					selectAll = false;
				}
			}
		});
		grid.selection.selectAll = selectAll;
		// 一覧の状態を保存
		setTimeout(function() {
			$scope.$parent.fileListGridApiState = $scope.fileListGridApi.saveState.save();
		});
	}

	// 全選択状態子階層チェック
	var checkAllSelectedChildren = function(children, selectAll) {
		angular.forEach(children, function(child) {
			var row = child.row;
			// 全選択状態 且つ 有効行 の場合のみチェックを行う
			if (selectAll && row.entity.id) {
				// 行の選択状態をチェック
				if (row.isSelected) {
					// 選択されている場合
					if (row.treeNode.children.length) {
						selectAll = checkAllSelectedChildren(row.treeNode.children, selectAll);
					}
				} else {
					// 選択されていない場合、全選択状態を解除
					selectAll = false;
				}
			}
		});
		return selectAll;
	}

	// 詳細エリア初期化処理
	var initDetailAreaData = function($scope, forced) {
		if (!$scope.$parent.initialized || forced) {
			// 詳細エリアデータ
			$scope.$parent.detailAreaData = null;
			$scope.$parent.fileDetailAreaData = null;
			// エラーアイコンをクリア
			$scope.hasDetailTabZokuseiError = false;
			$scope.hasDetailTabKoseiError = false;
		}
		// 編集フラグ
		$scope.$parent.edit = false;
		// 構成図面情報
		$scope.kosei_gridOptions = {
			enableColumnMenus: false,
			columnDefs: [],
			data: [],
			onRegisterApi: function(gridApi) {
				$scope.koseiListGridApi = gridApi;
				gridApi.edit.on.beginCellEdit($scope, function(rowEntity, colDef) {
					// 未確定の文字も正の値として扱う
					var ele = $(document.activeElement);
					ele.on('input', function() {
						rowEntity[colDef.name] = angular.copy(ele.val());
					});
				}),
				gridApi.edit.on.afterCellEdit($scope, function(rowEntity, colDef, newValue, oldValue) {
					// 編集入力完了後、横スクロールバーがズレて表示されるので、リフレッシュを実施
					$timeout(function() {
						gridApi.core.refresh();
					});
				});
			}
		};
		// 関連ファイル情報
		$scope.kanren_gridOptions = {
			enableColumnMenus: false,
			columnDefs: [],
			data: [],
			onRegisterApi: function(gridApi) {
				$scope.kanrenListGridApi = gridApi;
			}
		};
	};

	// コメントエリア初期化処理
	var initComentAreaData = function($scope, forced) {
		$scope.commentLoading = false;
		if (!$scope.$parent.initialized || forced) {
			// コメント表示情報の初期化
			$scope.$parent.commentInfo = {
				hanRireki: true,
				comment: true,
				henkoRireki: true
			};
		};
	};

	// プレビューエリア初期化処理
	var initPreviewAreaData = function($scope, forced) {
	};

	// ワークフロー一覧エリア初期化処理
	var initWorkflowListAreaData = function($scope, forced) {

		// ワークフロー一覧ステータス情報の初期化
		$scope.workflowGridRowsState = null;
		if (!$scope.$parent.initialized || forced) {
			// 一覧リフレッシュフラグ削除
			$scope.$parent.workflowListRefreshFlg = false;
			// ページング
			$scope.$parent.pagination = null;
			$scope.$parent.workflowListPagination = null;
			$scope.$parent.dataTypePage = CommonService.getUserInfo(Const.USER_SETTEI_LIST_HYOJI_KENSU);
			$scope.$parent.workflowListData = null;
			$scope.$parent.workflowDetailAreaData = null;
			$scope.$parent.workflowListAreaSelectData = null;
			// 一覧エリアの選択状態
			$scope.$parent.workflowGridRows = null;
			// 一覧エリアの開閉状態
			$scope.$parent.workflowListClosed = false;
			// 申請ファイルリストステータス情報
			$scope.$parent.shinseiFileListDataMap = new Map();
		}

		// ワークフローリストのヘッダー非表示設定
		if ($templateCache.get('ui-grid/expandableTopRowHeader') !== "<div class=\"ui-grid-row-header-cell\"></div>") {
			var savedTemplate = $templateCache.get('ui-grid/expandableTopRowHeader');
			$templateCache.put('ui-grid/expandableTopRowHeader', "<div class=\"ui-grid-row-header-cell\"></div>");
			$scope.$on('$destroy', function() {
				$templateCache.put('ui-grid/expandableTopRowHeader', savedTemplate);
			});
		}

		// ワークフローリスト設定
		$scope.workflowList_gridOptions = {
			saveWidths: true,
			saveOrder: true,
			saveScroll: true,
			saveFocus: true,
			saveVisible: true,
			saveSort: true,
			saveFilter: true,
			savePinning: true,
			saveGrouping: true,
			saveGroupingExpandedStates: true,
			saveTreeView: true,
			saveSelection: true,
			enableHiding: false,
			useExternalSorting: true,
			enableColumnMenus: false,
			enableRowHeaderSelection: false,
			excessRows: Const.EXCESS_ROWS_WORKFLOW_LIST,
			excessColumns: Const.EXCESS_COLUMNS_WORKFLOW_LIST,
			multiSelect: false,
			noUnselect: true,
			expandableRowTemplate: '<div class="sub-grid" ui-grid="row.entity.subGridOptions" ui-grid-save-state ui-grid-selection ui-grid-resize-columns ui-grid-auto-resize ui-grid-pinning></div>',
			columnDefs: [],
			data: [],
			onRegisterApi: function(gridApi) {
				// グリッド行情報の設定
				if ($scope.$parent.workflowGridRows) {
					// 選択されているファイルのワークフローIDを取得
					var selectData = isActiveTabWorkflow($scope) ? $scope.$parent.listAreaSelectData : $scope.$parent.workflowListAreaSelectData;
					// 選択有 又は 展開有 のワークフロー情報を抽出する
					for (var i = 0; i < $scope.$parent.workflowGridRows.length; i++) {
						var row = $scope.$parent.workflowGridRows[i];
						if (row.isSelected || ($scope.$parent.shinseiHashKey && (selectData.workflowId == row.entity.id))) {
							$scope.workflowGridRowsState = {
								'workflowId': row.entity.id,
								'isSelected': row.isSelected
							};
							break;
						}
					}
				}
				$scope.workflowListGridApi = gridApi;
				$scope.$parent.workflowGridRows = $scope.workflowListGridApi.grid.rows;
				// データ設定イベント
				gridApi.grid.registerRowsProcessor(function(renderableRows) {
					// ワークフローのステータス情報が存在しない場合、処理を終了する
					if (!$scope.workflowGridRowsState) {
						return renderableRows;
					}
					// 対象となるワークフロー情報を抽出する
					$scope.restoreFlg = true;
					for (var i = 0; i < renderableRows.length; i++) {
						var row = renderableRows[i];
						if (row.entity.id == $scope.workflowGridRowsState.workflowId) {
							if ($scope.workflowGridRowsState.isSelected) {
								// 選択有の場合、対象のデータを選択
								gridApi.selection.selectRow(row.entity);
							} else {
								// 選択無の場合、対象のデータを展開
								gridApi.expandable.expandRow(row.entity);
							}
							$scope.workflowGridRowsState = null;
							break;
						}
					}
					$scope.restoreFlg = false;
					return renderableRows;
				});
				// サブグリッド表示・非表示イベント
				$scope.workflowListGridApi.expandable.on.rowExpandedStateChanged($scope, function(row) {
					// データ反映時は処理を行わない
					if ($scope.restoreFlg) { return; }
					// 一覧の状態を保存
					$scope.$parent.workflowListGridApiState = $scope.workflowListGridApi.saveState.save();
					// 申請ファイルリスト取得
					if (!row.entity.subGridOptions.data.length) {
						getShinseiFileListData($scope, row);
					}

					row.grid.options.enableRowSelection = false
					gridApi.core.notifyDataChange(uiGridConstants.dataChange.OPTIONS);
					$timeout(function() {
						row.grid.options.enableRowSelection = true
						gridApi.core.notifyDataChange(uiGridConstants.dataChange.OPTIONS);
					})
				});
				// ソートイベント
				$scope.workflowListGridApi.core.on.sortChanged($scope, function(grid, sort) {
					// データ反映時は処理を行わない
					if ($scope.restoreFlg) { return; }
					// 一覧の状態を保存
					$scope.$parent.workflowListGridApiState = $scope.workflowListGridApi.saveState.save();
					// 保持している検索条件の取得
					var searchJoken = $scope.$parent.workflowListSearchJoken;
					// 検索条件を設定
					if (sort[0]) {
						// ソート情報が有る場合、該当項目を設定
						if (sort[0].name == 'yusenKbnName') {
							searchJoken.sortColumn = 'yusenKbn';
						} else if (sort[0].name == 'jokyoKbnName') {
							searchJoken.sortColumn = 'jokyoKbn';
						} else {
							searchJoken.sortColumn = sort[0].name;
						}
						searchJoken.sortDirection = sort[0].sort.direction;
					} else {
						// ソート情報が無い場合、初期値を設定
						searchJoken.sortColumn = null;
						searchJoken.sortDirection = null;
					}
					// 一覧データ取得処理
					getListData($scope, searchJoken);
				});
				// 行選択処理イベント
				$scope.workflowListGridApi.selection.on.rowSelectionChanged($scope, function(row) {
					// データ反映時は処理を行わない
					if ($scope.restoreFlg) { return; }
					// 一覧の状態を保存
					$scope.$parent.workflowListGridApiState = $scope.workflowListGridApi.saveState.save();
					// サブ一覧の選択解除
					$scope.$parent.shinseiHashKey = null;
					// 詳細レイアウトの設定
					showInnerLayout(Const.LAYOUT_DETAIL_WORKFLOW);
					// 申請情報、進行状況の取得
					getWorkflowDetailData($scope, row.entity);
				});
				// カラムサイズ変更イベント
				$scope.workflowListGridApi.colResizable.on.columnSizeChanged($scope, function(colDef, deltaChange) {
					// データ反映時は処理を行わない
					if ($scope.restoreFlg) { return; }
					// 一覧の状態を保存
					$scope.$parent.workflowListGridApiState = $scope.workflowListGridApi.saveState.save();
				});
				$scope.workflowListGridApi.core.on.renderingComplete($scope, function() {
					// リフレッシュを伴わない画面遷移時のみ実施
					if ($scope.$parent.initialized != null
						&& $scope.$parent.initialized
						&& isActiveTabWorkflow($scope)) {
						// 境のバーの状態を復元
						reDrawCenterLine($scope.$parent.workflowListData, $scope.$parent.workflowListClosed);
					}
				});
			}
		};
		// ワークフローサブリスト設定
		$scope.workflowList_sub_gridOptions = {
			rowTemplate: 'app/main/mainShinseiFileListTemplate.html',
			enableHiding: false,
			enableColumnMenus: false,
			excessRows: Const.EXCESS_ROWS_SHINSEI_FILE_LIST,
			excessColumns: Const.EXCESS_COLUMNS_SHINSEI_FILE_LIST,
			columnDefs: [],
			data: []
		}
		// ワークフローリスト
		$scope.workflowList_gridOptions.columnDefs = [
			// [列：優先区分]
			{ name: 'yusenKbnName', displayName: 'yusen', headerCellFilter: 'translate', width: '70', cellClass: 'text-center',
				cellTemplate: '<label ng-class="{\'2\': \'text-danger\'}[row.entity.yusenKbn]">{{COL_FIELD}}</label>'},
			// [列：申請区分]
			{ name: 'shinseiKbnName', displayName: 'shinsei_kbn', headerCellFilter: 'translate', width: '120'},
			// [列：件名]
			{ name: 'subject', displayName: 'ken_mei', headerCellFilter: 'translate'},
			// [列：状態]
			{ name: 'jokyoKbnName', displayName: 'jokyo', headerCellFilter: 'translate', width: '70'},
			// [列：申請者]
			{ name: 'shinseiUserName', displayName: 'shinseisha', headerCellFilter: 'translate', width: '120'},
			// [列：申請日]
			{ name: 'shinseiTimestamp', displayName: 'shinsei_timestamp', headerCellFilter: 'translate', width: '150',
				cellTemplate: '<div class="ui-grid-cell-contents">{{ row.entity.shinseiTimestamp | date:"yyyy/MM/dd HH:mm"}}</div>' },
			// [列：ID](非表示項目)
			{ name: 'id', displayName: 'id', width: '0', visible: false },
			// [列：更新日付](非表示項目)
			{ name: 'updateTimestamp', displayName: 'updateTimestamp', visible: false }
		]
	};

	var setShinseiFileOptions = function($scope, data) {
		data.subGridOptions = angular.copy($scope.workflowList_sub_gridOptions);
		data.subGridOptions.onRegisterApi = function(gridApi) {
			// ワークフロー申請ファイルリストステータスの初期化
			if (!$scope.shinseiFileRowsState) {
				$scope.shinseiFileRowsState = {};
			}
			// 申請ファイル行のステータス情報マップ
			var shinseiFileRowsStateMap = new Map();
			if ($scope.$parent.shinseiFileListGridApi[data.id]) {
				angular.forEach($scope.$parent.shinseiFileListGridApi[data.id].grid.rows, function(row) {
					// 設定情報の取得
					var isChecked = row.isSelected;
					var isSelected = $scope.$parent.shinseiHashKey == row.entity.$$hashKey;
					if (isChecked || isSelected) {
						// 申請ファイルIDをキーに復元情報を設定
						shinseiFileRowsStateMap.set(row.entity.id, {
							'isChecked': isChecked,
							'isSelected': isSelected
						});
					}
				});
			}
			// 復元情報が存在する場合、ワークフローIDをキーに設定
			if (shinseiFileRowsStateMap.size > 0) {
				$scope.shinseiFileRowsState[data.id] = shinseiFileRowsStateMap;
			}
			$scope.$parent.shinseiFileListGridApi[data.id] = gridApi;
			// データセット処理イベント
			gridApi.grid.registerRowsProcessor(function(renderableRows) {
				// 申請ファイルリストのステータス情報が存在しない場合、処理を終了
				if (!$scope.shinseiFileRowsState[data.id] || $scope.shinseiFileRowsState[data.id].size == 0) {
					return renderableRows;
				}
				// 申請ファイル件数分処理を行う
				angular.forEach(renderableRows, function(row) {
					// 対象の申請ファイルを取得
					var shinseiFile = $scope.shinseiFileRowsState[data.id].get(row.entity.id);
					if (shinseiFile) {
						// 申請ファイルがチェック済みだった場合
						if (shinseiFile.isChecked) {
							gridApi.selection.selectRow(row.entity);
						}
						// 申請ファイルが選択済みだった場合
						if (shinseiFile.isSelected) {
							$scope.$parent.shinseiHashKey = row.entity.$$hashKey;
						}
					}
				})
				$scope.shinseiFileRowsState[data.id].clear();
				return renderableRows;
			});
		};
		$scope.workflowList_gridOptions.data.push(data);
	};

	// ワークフロー申請情報エリア初期化処理
	var initWorkflowShinseiInfoArea = function($scope, forced) {
		if (!$scope.$parent.initialized || forced) {
			// ワークフロー申請情報
			$scope.$parent.applicationInfo = null;
		}
	};

	// ワークフロー進行状況エリア初期化処理
	var initWorkflowProgressState = function($scope, forced) {
		if (!$scope.$parent.initialized || forced) {
			// ワークフロー進行情報
			$scope.$parent.statusList = null;
			// ワークフロー状況設定
			$scope.$parent.authInfo = null;
			// ワークフロー差し戻しリスト
			$scope.$parent.remandList = null;
			// ワークフローコメント
			$scope.$parent.workflowStatusComment = null;
		}
		// 承認リスト設定
		$scope.shonin_gridOptions = {
			enableSorting: false,
			enableColumnMenus: false,
			enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,
			enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
			columnDefs: [],
			data: []
		};

		// 承認リスト
		$scope.shonin_gridOptions.columnDefs = [
			// [列：削除エリア]
			{ name: 'del', displayName: '', width: '33', cellClass: 'btn-grid text-center',
				cellTemplate:'<button type="button" class="btn btn-primary" ng-click="grid.appScope.deleteRow(grid.rows.indexOf(row))" tooltip="sakujo"><span class="fa fa-times-circle"></span></button>'},
			// [列：エラー]
			{ name: 'error', displayName: "", pinnedLeft: true, width: '33', enableSorting: false, cellClass: 'error-area text-center',
				cellTemplate: '<span ng-show="row.entity.status" class="fa fa-exclamation-circle" ng-class="{\'1\': \'text-danger\', \'2\': \'text-warning\'}[row.entity.status]" ng-title="row.entity.errorMessage" tooltip></span>'},
			// [列：ファイル名]
			{ name: 'name', displayName: 'file_name', headerCellFilter: 'translate'}
		]

	};

 	// 検索エリア情報取得
	var getSearchAreaData = function($scope, mode) {
		// 文書種
		var bunshoshuId = CommonService.getUserInfo(Const.USER_SETTEI_BUNSHOSHU);
		if (angular.isUndefined(bunshoshuId)) {
			// 画面更新(F5)の場合
			var userInfo = StorageService.getData('userInfo');
			if (userInfo != null && 'bunshoshuId' in userInfo) {
				bunshoshuId = userInfo.bunshoshuId;
			} else {
				bunshoshuId = null;
			}
		}		
		// 通信用パラメータの設定
		$scope.param = {
			'langKey': CommonService.getLanguageKey($scope),
			'mode': mode,
			'bunshoshuId': bunshoshuId
		};
		// 初期情報の取得
		CommonService.httpModal($scope, ACTION, $scope.param, true,
			function(resolveData) {
				// 成功処理
				if (!CommonService.isError(resolveData)) {
					// ドロップダウンの設定
					$scope.dropdown = resolveData.dropDown;
					$scope.userMaster = resolveData.user;
					$scope.oinIchi = resolveData.oinIchi;
					StorageService.setData('hyojiGengo', $scope.dropdown.hyojiGengo);
					// 未確認コメント件数をストレージ情報にセット
					StorageService.setData("headerNonCheckCommentCnt", resolveData.cntNonCheckComment);

					// 文書種リスト設定
					$scope.$parent.bunshoshuList = resolveData.bunshoshu;
					$scope.$parent.bunshoshuZokusei = resolveData.bunshoshuZokusei;

					// モードが ［workflow］ 又は 空 の場合のみ設定
					if (mode == Const.GET_KENSAKU_TAB_PATTERN_WORKFLOW || mode == Const.GET_KENSAKU_TAB_PATTERN_REDISPLAY || !mode) {
						// 差し戻し件数
						$scope.$parent.cntWorkflowSendback = resolveData.cntWorkflowSendback;
						// 処理待ち件数
						$scope.$parent.cntWorkflowWating = resolveData.cntWorkflowWating;
						// 処理者無効件数
						$scope.$parent.cntProcessorInvalid = resolveData.cntProcessorInvalid;
					}

					// モードが ［tree］ 又は 空 の場合のみ設定
					if (mode == Const.GET_KENSAKU_TAB_PATTERN_TREE || !mode) {
						// 表示情報
						var hyojiTree = [];
						angular.forEach(resolveData.hyojiTree, function(tree) {
							hyojiTree.push(tree);
							if (tree.type == Const.KOZO_KBN_TREE) {
								tree.data[0].noLeaf = true;
							} else if (tree.type == Const.KOZO_KBN_FOLDER) {
								// フォルダ階層の設定
								var data = tree.data[0];
								// フォルダ情報を保持
								var treeHyojiFolderPath = angular.copy(data.children);
								data.children = [];
								angular.forEach(treeHyojiFolderPath, function(folderInfo) {
									var paths = folderInfo.label.split("/");
									var children = null;
									angular.forEach(paths, function(path) {
										if (children) {
											var item = CommonService.getListMapToMap(children, "label", path);
											if (!item) {
												item = {
													id: folderInfo.id,
													treeHyojiId: folderInfo.treeHyojiId,
													label: path,
													zokuseiId: folderInfo.zokuseiId,
													zokuseiValue: folderInfo.zokuseiValue,
													uploadInitialValue: folderInfo.uploadInitialValue,
													children: []
												};
												children.push(item);
											}
											children = item.children;
										} else {
											// ルート
											data.zokuseiId = folderInfo.zokuseiId;
											data.zokuseiValue = data.label;
											data.uploadInitialValue = folderInfo.uploadInitialValue,
											children = data.children;
										}
									});
								})
							}
						})
						// スター付き条件の追加
						// var star = angular.copy($scope.searchStar);
						hyojiTree.push({'type': 3, 'data': [{'id': 1, 'label': $translate.instant("starred")}]});
						// 属性検索情報
						var zokuseiKensaku = resolveData.zokuseiKensaku;
						if (zokuseiKensaku) {
							// var zokuseiSearchJoken = angular.copy($scope.zokuseiSearchJoken);
							var zokuseiSearchJoken = {'type': 4, 'data': [{'id': 1, 'label': $translate.instant("hozon_joken_search"), 'children': [], 'noSearch': true}]};
							angular.forEach(zokuseiKensaku, function(data) {
								zokuseiSearchJoken.data[0].children.push(data);
							});
							hyojiTree.push(zokuseiSearchJoken);
						}
						// ゴミ箱条件の追加
						hyojiTree.push({'type': Const.TREE_KOZO_KBN_TRASH_BOX, 'data': [{'id': 1, 'label': $translate.instant("trash_box")}]});
						// コントローラの設定
						angular.forEach(hyojiTree, function(tree) {
							// ツリー情報毎にコントローラの設定
							tree['controller'] = {
								// ツリータイプの登録
								'type': tree.type
							};
						})
						// 画面表示用ツリー情報
						$scope.$parent.treeSearchView = hyojiTree;
						// ツリー選択情報の初期化
						$scope.$parent.activeController = null;
						$scope.$parent.selectedBranch = null;
					}

					// モードが ［attribute］ 又は 空 の場合のみ設定
					if (mode == Const.GET_KENSAKU_TAB_PATTERN_ATTRIBUTE || !mode) {
						// 属性検索タブ情報設定
						$scope.$parent.zokusei = resolveData.zokusei;
						angular.forEach($scope.$parent.zokusei, function(zokuseiData) {
							if (ZokuseiSearchService.isZokuseiDataTypeKbnFlg(zokuseiData.dataTypeKbn)) {
								// フラグの場合、初期値を設定
								zokuseiData.kensakuJokenString = "null";
							}
						});
						$scope.$parent.searchAreaData.checkOutJoken = "null";
						$scope.$parent.searchAreaData.bunshoshu = bunshoshuId;
						$scope.$parent.searchAreaData.fileId.name = resolveData.fileIdZokuseiName;
						$scope.$parent.defaultZokusei = angular.copy($scope.$parent.zokusei);
					}

					// モードが 空 の場合のみ設定
					if (!mode) {
						// 全文検索タブ情報設定
						$scope.$parent.searchAreaData.ronriJoken2 = Const.RONRI_JOKEN2_OR;
						$scope.$parent.searchAreaData.bunshoshuZenbun = bunshoshuId;
					}

					// モードが ［err］ 又は 空 の場合のみ設定
					if (mode == Const.GET_KENSAKU_TAB_PATTERN_ERRCNT || mode == Const.GET_KENSAKU_TAB_PATTERN_REDISPLAY || !mode) {
						// 未確認エラー件数
						StorageService.setData('headerNonCheckErrorCnt', resolveData.cntNonCheckErr);
					}

					// 画面表示時の処理
					if (!$scope.$parent.initialized) {
						// 表示タブの設定
						$scope.setDefalutTab();
						// 初期化処理完了
						$scope.$parent.initialized = true;
						// セッション情報取得待機
						sessionWatch($scope, 0);
					} else if (mode == Const.GET_KENSAKU_TAB_PATTERN_REDISPLAY) {
						// 一覧保持情報の反映
						$scope.restoreFlg = true;
						// 表示データ設定
						setDispData($scope);
						$scope.restoreFlg = false;
					}
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

 	// ツリー表示固定項目削除
	var deleteTreeFixedItem = function(treeData) {
		// ツリー表示時に付与される項目の削除
		delete treeData.children;
		delete treeData.classes;
		delete treeData.expanded;
		delete treeData.parent_uid;
		delete treeData.selected;
		delete treeData.uid;
		delete treeData.level;
		delete treeData.clickPlaceKbn;
		return treeData;
	};

	// ツリー親階層属性情報の取得
	var getParentZokuseiData = function(controller, branch) {
		return getZokuseiData(controller, branch, true);
	};

	// ツリー属性情報の取得
	var getZokuseiData = function(controller, branch, parentFlg) {
		var zokuseiInfo = [];
		if (parentFlg) {
			var parent = controller.get_parent_branch(branch);
			if (angular.isUndefined(parent)) {
				// 最上位の場合
				return zokuseiInfo;
			};
			zokuseiInfo = getZokuseiData(controller, parent, parentFlg);
		}
		if (branch.zokuseiId) {
			// 属性ID 及び 属性値が設定されている場合のみ取得する。
			var data = {
				id: branch.zokuseiId,
				value: branch.zokuseiValue,
				type: branch.type
			}
			zokuseiInfo.push(data);
		}
		return zokuseiInfo;
	};

	// ツリー親階層条件式情報の取得
	var getParentJokenshikiData = function(controller, branch) {
		var parent = controller.get_parent_branch(branch);
		var parentInfo = [];
		if (!angular.isUndefined(parent)) {
			parentInfo = getParentJokenshikiData(controller, parent);
			// 最上位以外の場合に値を設定
			if (branch.treeJokenshiki) {
				// ツリー表示条件式が設定されている場合のみ取得する。
				parentInfo.push(branch.treeJokenshiki);
			}
		}
		return parentInfo;
	};

	// ツリー親階層条件式情報の取得
	var getParentHyojiKaisoTypeKbn = function(controller, branch) {
		var parent = controller.get_parent_branch(branch);
		var parentInfo = [];
		if (!angular.isUndefined(parent)) {
			parentInfo = getParentHyojiKaisoTypeKbn(controller, parent);
			// 最上位以外の場合に値を設定
			if (branch.hyojiKaisoTypeKbn) {
				parentInfo.push(branch.hyojiKaisoTypeKbn);
			}
		}
		return parentInfo;
	};

	// ツリー親階層フォルダパスの取得
	var getParentFolderPath = function(controller, branch) {
		// ツリー親階層情報の取得
		var info = branch.label;
		var parent = controller.get_parent_branch(branch);
		var parentInfo = ''
		if (!angular.isUndefined(parent)) {
			parentInfo = getParentFolderPath(controller, parent);
			parentInfo += '/';
		}
		return parentInfo + info;
	};

	// ツリー親階層条件の取得
	var getParentTreeHyojiJoken = function(controller, branch) {
		var parent = controller.get_parent_branch(branch);
		var parentInfo = {};
		if (!angular.isUndefined(parent)) {
			parentInfo = getParentTreeHyojiJoken(controller, parent);
		}
		if (branch.treeHyojiKaisoId && branch.treeHyojiJokenNo) {
			parentInfo[branch.treeHyojiKaisoId.toString()] = branch.treeHyojiJokenNo;
		}
		return parentInfo;
	};

	// 属性検索ワーク情報の作成
	var createZokuseiKensakuWork = function($scope) {
		// 属性検索ワーク情報
		var zokuseiKensakuWork = {
			"label": null,
			"dateList": [],
			"flgList": [],
			"numList": [],
			"choicesList": [],
			"textList": [],
			"checkoutFlg": null,
			"checkoutUserId": [],
			"fileId": null,
			"fileIdFrom": null,
			"fileIdTo": null
		}
		// ファイルID
		if ($scope.$parent.searchAreaData.fileId.kensakuJokenString) {
			zokuseiKensakuWork.fileId = $scope.$parent.searchAreaData.fileId.work.kensakuValFileId;
			zokuseiKensakuWork.fileIdFrom = CommonService.parseInt($scope.$parent.searchAreaData.fileId.work.kensakuValFileIdFrom);
			zokuseiKensakuWork.fileIdTo = CommonService.parseInt($scope.$parent.searchAreaData.fileId.work.kensakuValFileIdTo);
		}
		// 文書種
		if ($scope.$parent.searchAreaData.bunshoshu != null) {
			var obj = CommonService.getBunshoshu($scope.$parent.bunshoshuList, $scope.$parent.searchAreaData.bunshoshu);
			var work = $scope.$parent.bunshoshuZokusei.work;
			work.kensakuValSentakushi = [$scope.$parent.searchAreaData.bunshoshu];
			work.zokuseiId = $scope.$parent.bunshoshuZokusei.id;
			work.miSetteiFlg = false;
			work.ronriJokenKbn = Const.RONRI_JOKEN2_OR;
			zokuseiKensakuWork.choicesList.push(work);
		}

		angular.forEach($scope.$parent.zokusei, function(zokuseiData) {
			if (zokuseiData.id && (zokuseiData.work.miSetteiFlg || zokuseiData.kensakuJokenString)) {
				// 検索条件が設定されている属性だけ設定
				if (ZokuseiSearchService.isZokuseiDataTypeString(zokuseiData.dataTypeKbn)) {
					// テキスト、メモ、タグの場合,[textList]にデータを追加
					zokuseiKensakuWork.textList.push(zokuseiData.work);
				} else if (ZokuseiSearchService.isZokuseiDataTypeKbnFlg(zokuseiData.dataTypeKbn)) {
					// フラグの場合,[flgList]にデータを追加
					if (zokuseiData.kensakuJokenString != "null") {
						zokuseiData.work.zokuseiId = zokuseiData.id;
						zokuseiData.work.kensakuValFlg = (zokuseiData.kensakuJokenString == "true") ? true:false;
						zokuseiKensakuWork.flgList.push(zokuseiData.work);
					}
				} else if (ZokuseiSearchService.isZokuseiDataTypeKbnNum(zokuseiData.dataTypeKbn)) {
					// 数値の場合,[numList]にデータを追加
					zokuseiKensakuWork.numList.push(zokuseiData.work);
				} else if (ZokuseiSearchService.isZokuseiDataTypeKbnDate(zokuseiData.dataTypeKbn)) {
					// 日付の場合,[dateList]にデータを追加
					zokuseiKensakuWork.dateList.push(zokuseiData.work);
				} else if (ZokuseiSearchService.isZokuseiDataTypeSelect(zokuseiData.dataTypeKbn)) {
					// 選択肢、選択肢（複数）の場合,[choicesList]にデータを追加
					zokuseiKensakuWork.choicesList.push(zokuseiData.work);
				}
			}
		});
		// チェックアウトフラグ
		if ($scope.$parent.searchAreaData.checkOutJoken == "true") {
			zokuseiKensakuWork.checkoutFlg = true;
		} else if ($scope.$parent.searchAreaData.checkOutJoken == "false") {
			zokuseiKensakuWork.checkoutFlg = false;
		}
		// チェックアウトユーザ
		if ($scope.$parent.searchAreaData.checkOutUser.work.miSetteiFlg) {
			// 未設定の場合
			zokuseiKensakuWork.checkoutUserId = [];
		} else if ($scope.$parent.searchAreaData.checkOutUser.kensakuJokenString) {
			zokuseiKensakuWork.checkoutUserId = $scope.$parent.searchAreaData.checkOutUser.work.kensakuValSentakushi;
		} else {
			zokuseiKensakuWork.checkoutUserId = null;
		}
		return zokuseiKensakuWork;
	}

	// 一覧データ取得処理振り分け
	var getListData = function($scope, searchJoken, searchAreaFlg) {
		$scope.$parent.listAreaSelectData = null;
		if (isActiveTabWorkflow($scope)) {
			// ワークフロー検索タブの場合
			getWorkflowListData($scope, searchJoken, searchAreaFlg);
		} else {
			// ワークフロー検索タブ以外の場合
			getFileListData($scope, searchJoken, searchAreaFlg);
		}
	}

	// ファイル一覧データ取得処理での初期化処理
	var getFileListDataInit = function($scope, searchJoken) {
			// 検索条件の保持
			$scope.$parent.fileListSearchJoken = angular.copy(searchJoken);
			// 詳細エリアの初期化
			initDetailAreaData($scope, true);
			// コメントエリアの初期化
			initComentAreaData($scope, true);
			// プレビューエリアの初期化
			initPreviewAreaData($scope, true);
			$scope.$parent.error = {};
			// 一覧のデータが存在していない場合、構成逆展開を初期化
			if ($scope.fileList_gridOptions.data.length == 0) {
				$scope.$parent.koseiGyakuTenkai = false;
			}
			// ゴミ箱検索モードフラグを設定
			$scope.$parent.trashBoxMode = false;
			if (searchJoken.tab == Const.KENSAKU_TAB_TREE
				 && isKozoKbnTrashBox(searchJoken.type)) {
				$scope.$parent.trashBoxMode = true;
			}
		}
	// ファイル一覧データ取得処理
	var getFileListData = function($scope, searchJoken, searchAreaFlg) {
		var searchJoken = searchJoken || $scope.$parent.fileListSearchJoken;
		// 現在の検索モードを退避
		var oldTrashBoxMode = angular.copy($scope.$parent.trashBoxMode);
		// 一覧エリアのリストデータの取得が存在する場合、詳細エリア等の初期化処理を行う
		if (searchJoken.dataFetchKbn != Const.TREE_DATA_FETCH_KBN_TREE) {
			getFileListDataInit($scope, searchJoken);
		}
		// 通信用パラメータの設定
		var param = {
			'langKey': CommonService.getLanguageKey($scope),
			'data': searchJoken,
			'bunshoshuId': $scope.$parent.bunshoshu
		};
		if (searchAreaFlg) {
			var dtlInfo = {
				searchJoken: searchJoken
			};
		}

		// 一覧情報の取得：成功時のコールバック関数を定義
		var successCallback = function(resolveData) {
			// 成功処理
			if (!CommonService.isError(resolveData)) {
				if (searchAreaFlg && searchJoken.tab == Const.KENSAKU_TAB_TREE) {
					// 検索エリアからの処理の場合のみ、ツリー構成情報をセットする。
					var controller = $scope.$parent.activeController;
					if (isKozoKbnTree(controller.type)) {
						// 選択行の取得
						var branch = controller.get_selected_branch();
						// 階層アイコンの非表示
						branch.noLeaf = false;
						// 子階層情報の設定
						angular.forEach(resolveData.childTree, function(childData) {
							// 階層アイコンの表示
							if (childData.children) {
								childData.noLeaf = true;
							}
						});
						// 子階層の追加
						branch.children = resolveData.childTree;
					}
				}
				// データ取得チェック
				if (searchJoken.dataFetchKbn == Const.TREE_DATA_FETCH_KBN_TREE && resolveData.childTree.length == 0) {
					// 子階層のデータが1件も取得できずデータ取得が行われた場合、詳細エリア等の初期化処理を行う
					getFileListDataInit($scope, searchJoken);
					// 取得データの反映を行うため、データ取得区分の変更
					searchJoken.dataFetchKbn = Const.TREE_DATA_FETCH_KBN_DATA
				}
				if (searchJoken.dataFetchKbn != Const.TREE_DATA_FETCH_KBN_TREE) {
					if (dtlInfo) {
						// システム操作ログ登録（成功）
						CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_LIST, dtlInfo, getSosaDtlKbnSearch(Const.SOSA_LOG_SOSA_KBN_LIST, dtlInfo));
					}
					// 一覧ヘッダータイトルの設定
					var listTitles = resolveData.zokusei;
					var fixedColName = resolveData.fixedColName;
					if (!CommonService.isArraysEqual($scope.$parent.listAreaZokuseiList, listTitles)
						|| oldTrashBoxMode != $scope.$parent.trashBoxMode) {
						$scope.$parent.listAreafixedColName = angular.copy(fixedColName);
						$scope.$parent.listAreaZokuseiList = angular.copy(listTitles);
						setFileListColumnDefs($scope, $scope.fileList_gridOptions, listTitles, fixedColName);
					}
					// 一覧データの設定
					var fileListData = [];
					angular.forEach(resolveData.fileInfo, function(data) {
						// 親IDの設定
						data.parentId = null;
						data.$$treeLevel = 0;
						fileListData.push(data);
						// ゴミ箱検索以外の場合に、構成ファイルを設定する
						if (!$scope.$parent.trashBoxMode
							&& ((!$scope.$parent.koseiGyakuTenkai && data.koseiFileExists)
							|| ($scope.$parent.koseiGyakuTenkai && data.oyaFileExists))) {
							// 構成ファイルがある場合
							var child = {$$treeLevel: 1};
							fileListData.push(child);
							data.kosei = [];
							data.kosei.push(child);
						}
					});
					$scope.fileList_gridOptions.data = fileListData;
					$scope.$parent.fileListGridData = angular.copy($scope.fileList_gridOptions.data);
					// 詳細エリアとの境のバーを設定
					var listAreaParentLayout = myLayout.children.center.layout1;
					$scope.fileListScrollCancelFlg = false;
					// 一覧データが無かった場合
					if (!fileListData.length) {
						// 詳細エリアとの境のバーを非表示
						listAreaParentLayout.hide('north');
						$scope.$parent.error.listArea = CommonService.getMessage($scope, 'W00010');
						// 文書種をデフォルトに設定
						$scope.$parent.bunshoshu = CommonService.getUserInfo(Const.USER_SETTEI_BUNSHOSHU);
					} else if (listAreaParentLayout.north.state.isClosed) {
						// スクロール状態を無しにする
						var container = $scope.fileListGridApi.grid.renderContainers['body'];
						container.prevScrollLeft = 0;
						container.prevScrollleftPercentage = 0;
						container.prevScrollTop = 0;
						container.prevScrolltopPercentage = 0;
						// 一覧エリアを表示
						listAreaParentLayout.toggle('north');
						// バーのオープンイベントによる「fileListScroll」の実行を防ぐ
						$scope.fileListScrollCancelFlg = true;
					}
					// 一覧の高さ調整
					var height = $('.pane-list-body').height();
					$('.grid').css('height', height + 'px');
					// 選択状態のクリア
					$scope.fileListGridApi.selection.clearSelectedRows();
					// 一覧の状態を保存
					$scope.$parent.fileListGridApiState = $scope.fileListGridApi.saveState.save();
					// ページング情報の取得
					$scope.$parent.pagination = CommonService.setPagination($scope.$parent.pagination, param.data.dispPage, param.data.dispCnt, resolveData.listCount);
					// レイアウトのリサイズ
					layoutResize();
					// サムネイル表示チェック
					if (!$scope.$parent.dispList) {
						// サムネイル表示押下処理
						$timeout(function() {
							$scope.onDispListType(Const.DISP_LIST_TYPE_THUMBNAIL);
						});
					}
				}
			} else {
				// 失敗処理
				if (dtlInfo) {
					CommonService.errorProcess($scope, resolveData, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_LIST, dtlInfo, getSosaDtlKbnSearch(Const.SOSA_LOG_SOSA_KBN_LIST, dtlInfo));
				} else {
					CommonService.errorProcess($scope, resolveData);
				}
			}
		}

		// 一覧情報の取得：エラー時のコールバック関数を定義
		var errorCallback = function(rejectData, state) {
			// 失敗処理
			if (dtlInfo) {
				CommonService.systemError($scope, state, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_LIST, dtlInfo, getSosaDtlKbnSearch(Const.SOSA_LOG_SOSA_KBN_LIST, dtlInfo));
			} else {
				CommonService.systemError($scope, state);
			}
		}

		// 一覧情報の取得
		if (searchJoken.dataFetchKbn == Const.TREE_DATA_FETCH_KBN_TREE) {
			CommonService.httpPost(ACTION_SEARCH, param, successCallback, errorCallback);
		} else {
			CommonService.httpModal($scope, ACTION_SEARCH, param, true, successCallback, errorCallback);
		}
	}

	// ファイル一覧項目設定
	var setFileListColumnDefs = function($scope, gridOption, headerData, fixedColName, isWorkflow) {
		gridOption.columnDefs = [];
		angular.forEach(headerData, function(column, index) {
			// 属性情報のセット
			if (index == 0) {
				// [列：エラーエリア]
				gridOption.columnDefs.push(
					{ id: 'error', name: 'error', displayName: "", pinnedLeft: true, width: '50', enableSorting: false, cellClass: 'error-area text-center',
						cellTemplate:'<span ng-show="row.entity.errorStatus" class="fa fa-exclamation-circle" ng-class="{\'1\': \'text-danger\', \'2\': \'text-warning\'}[row.entity.errorStatus]" ng-title="row.entity.errorMessage" tooltip></span>'}
				);
				// ワークフロー申請ファイル以外の場合に表示
				if (!isWorkflow) {
					// ゴミ箱検索以外の場合に表示
					if (!$scope.$parent.trashBoxMode) {
						// スター
						gridOption.columnDefs.push(
							{ id: 'star', name: 'star', displayName: "", pinnedLeft: true, width: '50', cellClass: 'icon-area text-center',
								cellTemplate: '<span class="smart-icon glyphicon" ng-class="COL_FIELD ? \'glyphicon-star\':\'glyphicon-star-empty\'" ng-click="grid.appScope.onStarIcon($event, row.entity)"></span>'}
						);
					}
					// [列：ID]
					gridOption.columnDefs.push(
						{ id: 'id', name: 'id', displayName: fixedColName.id, pinnedLeft: true, width: '100', cellClass: 'text-right' }
					);
				}
				// 表示順が １ のデータ
				gridOption.columnDefs.push(
					{ id: column.id, name: 'zokuseiList[' + index + '].label', displayName: column.name, pinnedLeft: true, width: '150',
						cellTemplate: '<div class="ui-grid-cell-contents" ng-style="grid.appScope.getKoseiMargin(row)"><span ng-show="row.treeNode.children.length" class="glyphicon" ng-class="(row.treeNode.state == \'collapsed\') ? \'glyphicon-chevron-right\':\'glyphicon-chevron-down\'"></span> {{COL_FIELD}}<span ng-if="!grid.appScope.isEmpty(row.entity.qty) && !grid.appScope.koseiGyakuTenkai"> ({{row.entity.qty}}) </span></div>'}
				);
				// ワークフロー申請ファイル以外の場合に表示
				if (!isWorkflow) {
					// 版管理オプション又はワークフローオプションが有効な場合にのみステータス列を表示する
					if (CommonService.getOption($scope, Const.OPTION_SBT_VERSION_CONTROL) || CommonService.getOption($scope, Const.OPTION_SBT_WORKFLOW)) {
						// チェックアウト中、又はワークフロー申請中のアイコンを表示
						gridOption.columnDefs.push(
							{ id: 'fileStatus', name: 'fileStatus', displayName: "", pinnedLeft: true, width: '50', cellClass: 'icon-area text-center',
								cellTemplate:'<span ng-class="{\'' + STATUS_CHECKOUT_FLG + '\': \'glyphicon glyphicon-copy\', \'' + STATUS_WORKFLOWSHINSEICHU_FLG + '\': \'glyphicon glyphicon-send\'}[grid.appScope.checkStatus(row.entity)]"></span>'}
						);
					}
				} else {
					// [列：ファイルID](非表示項目)
					gridOption.columnDefs.push(
						{ id: 'fileId', name: 'fileId', displayName: 'fileId', width: '0', visible: false }
					);
					// [列：ワークフローID](非表示項目)
					gridOption.columnDefs.push(
						{ id: 'workflowId', name: 'workflowId', displayName: 'workflowId', width: '0', visible: false }
					);
					// [列：版番号](非表示項目)
					gridOption.columnDefs.push(
						{ id: 'sysHanNoMajor', name: 'sysHanNoMajor', displayName: 'sysHanNoMajor', width: '0', visible: false }
					);
				}
			} else {
				if (ZokuseiSearchService.isZokuseiDataTypeKbnNum(column.dataTypeKbn)) {
					// 数値属性の場合
					gridOption.columnDefs.push(
						{ id: column.id, name: 'zokuseiList[' + index + '].label', displayName: column.name, width: '150', cellClass: 'text-right'}
					);
				} else if (ZokuseiSearchService.isZokuseiDataTypeKbnDate(column.dataTypeKbn)) {
					if (column.kihonZokuseiSbt == Const.KIHON_ZOKUSEI_SBT_UPLOAD_DATE || column.kihonZokuseiSbt == Const.KIHON_ZOKUSEI_SBT_FILE_UPDATE) {
						var cellTemplate = '<div class="ui-grid-cell-contents">{{ COL_FIELD | date:"yyyy/MM/dd HH:mm:ss"}}</div>';
					} else {
						var cellTemplate = '<div class="ui-grid-cell-contents">{{ COL_FIELD | date:"yyyy/MM/dd"}}</div>';
					}
					// 日付属性の場合
					gridOption.columnDefs.push(
						{ id: column.id, name: 'zokuseiList[' + index + '].kbn', displayName: column.name, width: '150',
							cellTemplate: cellTemplate }
					);
				} else {
					gridOption.columnDefs.push(
						{ id: column.id, name: 'zokuseiList[' + index + '].label', displayName: column.name, width: '150'}
					);
				}
			}
		});
	}

	// サムネイル一覧取得
	var getThumbnail = function($scope, index) {
		if (index == $scope.fileList_gridOptions.data.length) { return; }
		var data = $scope.fileList_gridOptions.data[index];
		// IDが存在しない
		if (data.$$treeLevel == 0) {
			// サムネイルエリアの非表示
			$('.thumbnail-file-' + index).hide();
			// 通信用パラメータの設定
			$scope.param = {
				'langKey': CommonService.getLanguageKey($scope),
				'id': data.id
			};
			// 初期情報の取得
			CommonService.httpPost(ACTION_THUMBNAIL, $scope.param,
				function(resolveData) {
					// 成功処理
					if (!CommonService.isError(resolveData)) {
						var blob = new Blob([resolveData], {type : 'imapge/png'});
						var reader = new FileReader();
						reader.onload = function () {
							$scope.$apply(function () {
								// サムネイルの表示
								data.thumbnail = reader.result;
								setThumbnail($scope, index);
							});
						};
						reader.readAsDataURL(blob);
					} else {
						// 失敗処理
						CommonService.errorProcess($scope, resolveData);
					}
				},
				function(rejectData, state) {
					// 失敗処理
					var reader = new FileReader();
					reader.onload = function(re) {
						$scope.$apply(function () {
							// エラー情報の生成
							var errorInfo = JSON.parse(re.target.result);
							if (errorInfo.code == 'W00012') {
								// 権限が無い場合
								data.thumbnail = Const.THUMBNAIL_PATH_NO_ACCESS_AUTHORITY;
							} else if (errorInfo.code == 'W00037') {
								// チェックアウト時に閲覧不可設定されている場合
								data.thumbnail = Const.THUMBNAIL_PATH_NO_BROWS_AUTHORITY;
							} else if (errorInfo.code == 'W00025') {
								// 保護されている場合
								data.thumbnail = Const.THUMBNAIL_PATH_SET_PASSWORD;
							} else {
								// データが無い場合
								data.thumbnail = Const.THUMBNAIL_PATH_NO_DATA;
							}
							// サムネイルの表示
							setThumbnail($scope, index);
						});
					};
					var blob = new Blob([rejectData], { type: "text/plain" });
					reader.readAsText(blob);
				},
				{responseType: 'arraybuffer'}
			);
		} else {
			// 次データの取得
			getThumbnail($scope, index + 1);
		}
	}

	// サムネイルの表示
	var setThumbnail = function($scope, index) {
		// サムネイルの表示
		var thumbnailHeightMax = CommonService.getSystemSettei(Const.SYSTEM_INFO_THUMBNAIL_HEIGHT_MAX);
		$timeout(function() {
			var className = '.thumbnail-file-' + index;
			var imageWidth = $(className).get(0).width;
			var imageHeight = $(className).get(0).height;
			if (imageWidth > imageHeight) {
				$(className).css('width', thumbnailHeightMax + 'px');
				$(className).css('height', 'auto');
			} else {
				$(className).css('width', 'auto');
				$(className).css('height', thumbnailHeightMax + 'px');
			}
			$('.thumbnail-fileArea').css('width', thumbnailHeightMax + 'px');
			$('.thumbnail-fileArea').css('height', thumbnailHeightMax + 'px');
			$('.thumbnail-info').css('width', thumbnailHeightMax + 'px');
			// サムネイルエリアの表示
			$(className).show();
			// 次データの取得
			getThumbnail($scope, index + 1)
		}, 100);
	}

	// ファイル一覧構成データ取得処理
	var getFileListKoseiData = function($scope, entity) {
		// 通信用パラメータの設定
		var id = entity.id;
		var data = {
			id: id,
			zokusei: $scope.$parent.listAreaZokuseiList,
			koseiGyakuTenkai: $scope.$parent.koseiGyakuTenkai
		}
		var param = {
			'langKey': CommonService.getLanguageKey($scope),
			'data': data
		};

		// 一覧情報の取得
		CommonService.httpPost(ACTION_SEARCH_KOSEI, param,
			function(resolveData) {
				// 成功処理
				if (!CommonService.isError(resolveData)) {
					// 取得ファイルが0件の場合
					if (resolveData.length == 0) {
						var promise = CommonService.dispMessage($scope, 'W00012', ['read']);
						promise.then(function(result) {
							openTree($scope, id, entity, resolveData);
						});
					} else {
						openTree($scope, id, entity, resolveData);
						// 全選択状態チェック
						$scope.fileListGridApi.grid.selection.selectAll = false;
					}
				} else {
					if (resolveData.errorInfo.code == 'W00021' || resolveData.errorInfo.code == 'W00010') {
						// 既にファイルが削除されている場合
						var promise = CommonService.dispMessage($scope, resolveData.errorInfo.code, null, resolveData.errorInfo.message);
						promise.then(function(result) {
							// リフレッシュを行う
							$scope.onListRefresh();
						});
					} else {
						// 失敗処理
						CommonService.errorProcess($scope, resolveData);
					}
				}
			},
			function(rejectData, state) {
				// 失敗処理
				CommonService.systemError($scope, state);
			}
		);
	}

	// ツリー展開時のファイルデータ処理
	var openTree = function($scope, id, entity, resolveData) {
		// 対象レコード位置の取得
		var rowIndex = null;
		for (var idx in $scope.fileList_gridOptions.data) {
			var data = $scope.fileList_gridOptions.data[idx];
			if (data.$$hashKey == entity.$$hashKey) {
				// 対象行
				rowIndex = parseInt(idx);
				// 検索済みフラグ
				data.searched = true;
				// 対象行の子階層データ削除
				CommonService.spliceGridRow($scope.fileList_gridOptions.data, data.kosei[0], "$$hashKey", true);
				data.kosei = [];
				break;
			}
		}
		// 一覧データのセット
		var addNo = rowIndex;
		angular.forEach(resolveData, function(kosei) {
			$scope.fileList_gridOptions.data[rowIndex].kosei.push(kosei);
			// 追加数カウントアップ
			addNo++;
			// 親IDの設定(構成逆展開の場合、null を設定)
			kosei.parentId = $scope.$parent.koseiGyakuTenkai ? null : id;
			// 階層の設定
			kosei.$$treeLevel = entity.$$treeLevel + 1;
			$scope.fileList_gridOptions.data.splice(addNo, 0, kosei);
			if ((!$scope.$parent.koseiGyakuTenkai && kosei.koseiFileExists)
				|| ($scope.$parent.koseiGyakuTenkai && kosei.oyaFileExists)) {
				// 構成ファイルが存在する場合
				addNo++;
				var child = {$$treeLevel: entity.$$treeLevel + 2};
				$scope.fileList_gridOptions.data.splice(addNo, 0, child);
				$scope.fileList_gridOptions.data[addNo - 1].kosei = [];
				$scope.fileList_gridOptions.data[addNo - 1].kosei.push($scope.fileList_gridOptions.data[addNo]);
			}
		});
		$scope.$parent.fileListGridData = angular.copy($scope.fileList_gridOptions.data);
	}

	// ファイル詳細データ取得処理
	var getFileDetailData = function($scope, fileId, workflowId) {
		// 通信用パラメータの設定
		var param = {
			'langKey': CommonService.getLanguageKey($scope),
			'id': fileId,
			'workflowId': workflowId
		};
		var dtlInfo = {
			fileId: fileId
		};
		// 詳細情報の取得
		CommonService.httpModal($scope, ACTION_SEARCH_DETAIL, param, true,
			function(resolveData) {
				// 成功処理
				if (!CommonService.isError(resolveData)) {
					// 詳細エリアデータ
					// socket 受信用グループ設定
					socket.emit('join-room', {
						'oldId': $scope.$parent.detailAreaData ? $scope.$parent.detailAreaData.id : null,
						'newId': fileId
					});
					// 取得データの設定
					if (!CommonService.isEmpty(workflowId)) {
						$scope.$parent.workflowShinseiFileDetailAri = true;
					}
					$scope.$parent.detailAreaData = angular.copy(resolveData.fileInfo);
					$scope.$parent.detailAreaData.displayKokaiFlg = resolveData.displayKokaiFlg;
					$scope.$parent.detailAreaData.pdfPasswordFlg = resolveData.pdfPasswordFlg;
					$scope.$parent.detailAreaData.fixedColName = resolveData.fixedColName;
					$scope.$parent.detailAreaData.bunshoshuId = resolveData.fileInfo.bunshoshuId;
					$scope.$parent.detailAreaData.zokuseiListAll = resolveData.zokuseiListAll;
					$scope.$parent.detailAreaData.bunshoshuError = null;
					// 公開日時の変換処理
					$scope.$parent.detailAreaData.kokaiTimestamp = CommonService.dbToTimestamp($scope.$parent.detailAreaData.kokaiTimestamp);
					// 公開前アクセス可能者の変換処理
					var kokaimaeAccessKaUserData = CommonService.dbToChoiceTag($scope.$parent.detailAreaData.kokaimaeAccessKaUserId, $scope.userMaster, 'id');
					var kokaimaeAccessKaUserName = "";
					if (!CommonService.isEmpty(kokaimaeAccessKaUserData)) {
						var names = [];
						angular.forEach(kokaimaeAccessKaUserData, function(data) {
							names.push(data.name);
						});
						kokaimaeAccessKaUserName = names.join(",");
					}
					$scope.$parent.detailAreaData.kokaimaeAccessKaUser = {
						data: kokaimaeAccessKaUserData,
						name: kokaimaeAccessKaUserName
					}
					// 各種、属性値の変換処理
					angular.forEach($scope.$parent.detailAreaData.zokuseiList, function(zokusei) {
						if (ZokuseiSearchService.isZokuseiDataTypeKbnDate(zokusei.dataTypeKbn)) {
							// 日付系の場合、項目変換
							if (zokusei.kihonZokuseiSbt == Const.KIHON_ZOKUSEI_SBT_UPLOAD_DATE || zokusei.kihonZokuseiSbt == Const.KIHON_ZOKUSEI_SBT_FILE_UPDATE) {
								zokusei.kbn = CommonService.dbToDatepicker(zokusei.kbn, true);
							} else {
								zokusei.kbn = CommonService.dbToDatepicker(zokusei.kbn);
							}
						} else if (ZokuseiSearchService.isZokuseiDataTypeSelect(zokusei.dataTypeKbn)) {
							// 選択肢系の場合、属性選択肢情報取得
							if (zokusei.sentakushiDataShutokusakiKbn == Const.SENTAKUSHI_DATA_SHUTOKUSAKI_KBN_USER_MASTER) {
								zokusei.zokuseiSentakushi = $scope.userMaster;
							} else if (zokusei.sentakushiDataShutokusakiKbn == Const.SENTAKUSHI_DATA_SHUTOKUSAKI_KBN_BUNSHOSHU) {
								zokusei.zokuseiSentakushi = $scope.$parent.bunshoshuList;
							}
							// 複数選択肢の場合、取得した選択肢を使用してタグ項目の変更
							if (ZokuseiSearchService.isZokuseiDataTypeKbnSelectMulti(zokusei.dataTypeKbn)) {
								zokusei.kbn = CommonService.dbToChoiceTag(zokusei.kbn, zokusei.zokuseiSentakushi, 'id');
							}
						}
					});
					// 詳細エリア、一覧ヘッダー項目
					$scope.detailAreaZokuseiList = resolveData.memberLIstHeader;
					$scope.kosei_gridOptions.columnDefs = [];
					$scope.kanren_gridOptions.columnDefs = [];
					// 構成図面情報・削除データ
					$scope.$parent.delKoseiListData = [];
					// 関連ファイル情報・削除データ
					$scope.$parent.delKanrenListData = [];
					// [列：エラーエリア]
					var errorDef = { id: 'error', name: 'error', displayName: "", pinnedLeft: true, width: '50', visible: false, enableSorting: false, enableCellEdit: false, cellClass: 'error-area text-center',
						cellTemplate:'<span ng-show="row.entity.errorMessage" class="fa fa-exclamation-circle" ng-class="{\'text-danger\': row.entity.errorMessage}" ng-title="row.entity.errorMessage" tooltip></span>'
					};
					$scope.kosei_gridOptions.columnDefs.push(errorDef);
					// 属性項目
					angular.forEach($scope.detailAreaZokuseiList, function(column, index) {
						if (ZokuseiSearchService.isZokuseiDataTypeKbnText(column.dataTypeKbn)) {
							// [列：属性項目（ファイル名, 図面番号）]
							var columnDef = { id: index, name: 'zokuseiList[' + index + '].label', displayName: column.name, enableCellEdit: false };
							$scope.kosei_gridOptions.columnDefs.push(angular.copy(columnDef));
							$scope.kanren_gridOptions.columnDefs.push(angular.copy(columnDef));
						} else {
							// [列：属性項目（構成数量）]
							$scope.kosei_gridOptions.columnDefs.push(
								{  id: index, name: 'qty', displayName: column.name, width: '80',
									cellClass: function(grid, row, col, rowRenderIndex, colRenderIndex) {
										if (grid.appScope.isEditMode()) {
											return 'text-right enabled-columns';
										} else {
											return 'text-right';
										}
									},
									cellEditableCondition: function($scope) {
										return $scope.grid.appScope.isEditMode();
									}
								}
							);
						}
					});
					// [列：別タブでプレビュー]
					var blankPreviewDef = { name: 'preview', displayName: '', width: '33', cellClass: 'btn-grid text-center', enableCellEdit: false,
						cellTemplate:'<button class="btn btn-primary" ng-click="grid.appScope.onBlankPreview(row.entity.id)" ng-title="\'preview_betutabu\'|translate" tooltip><span class="glyphicon glyphicon-new-window"></span></button>'
					};
					$scope.kosei_gridOptions.columnDefs.push(angular.copy(blankPreviewDef));
					$scope.kanren_gridOptions.columnDefs.push(angular.copy(blankPreviewDef));
					// [列：行削除]
					$scope.kosei_gridOptions.columnDefs.push(
						{ name: 'del', displayName: '', width: '33', cellClass: 'btn-grid text-center', visible: false, enableSorting: false, enableCellEdit: false,
						cellTemplate:'<button type="button" class="btn btn-primary" ng-click="grid.appScope.onDeleteRow(\'1\', row.entity)" ng-title="\'sakujo\'|translate" tooltip><span class="glyphicon glyphicon-remove-circle"></span></button>'}
					);
					$scope.kanren_gridOptions.columnDefs.push(
						{ name: 'del', displayName: '', width: '33', cellClass: 'btn-grid text-center', visible: false, enableSorting: false, enableCellEdit: false,
						cellTemplate:'<button type="button" class="btn btn-primary" ng-click="grid.appScope.onDeleteRow(\'2\', row.entity)" ng-title="\'sakujo\'|translate" tooltip><span class="glyphicon glyphicon-remove-circle"></span></button>'}
					);
					// [列：ID](非表示項目)
					var idDef = { name: 'id', displayName: 'id', visible: false };
					$scope.kosei_gridOptions.columnDefs.push(angular.copy(idDef));
					$scope.kanren_gridOptions.columnDefs.push(angular.copy(idDef));

					// 構成ファイルデータ設定
					$scope.kosei_gridOptions.data = $scope.$parent.detailAreaData.kosei;
					// 関連資料データ設定
					$scope.kanren_gridOptions.data = $scope.$parent.detailAreaData.kanren;

					$scope.$parent.koseiGridOptions = $scope.kosei_gridOptions;
					$scope.$parent.kanrenGridOptions = $scope.kanren_gridOptions;

					// 属性情報取得ボタン表示設定
					$scope.$parent.dispZokuseiJohoShutoku = false;
					if (resolveData.isOriginalFileData && CommonService.isZunoFile($scope.$parent.detailAreaData.fileName)) {
						$scope.$parent.detailAreaData.dispZokuseiJohoShutoku = true;
					}

					// システム操作ログ登録（成功）
					CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DETAIL, dtlInfo);
					// プレビュー用PDF取得
					getPdfFile($scope, fileId, workflowId);
					// コメント情報取得
					getComment($scope);
					// レイアウトのリサイズ
					layoutResize();
				} else {
					// 失敗処理
					CommonService.errorProcess($scope, resolveData, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DETAIL, dtlInfo)
					.then(function() {
						// 既にファイルが削除されている場合
					if (resolveData.errorInfo.code == 'W00021') {
							// リフレッシュを行う
							$scope.onListRefresh();
						}
						});
					}
			},
			function(rejectData, state) {
				// 失敗処理
				CommonService.systemError($scope, state, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DETAIL, dtlInfo);
			}
		);
	}

	// プレビュー用PDFファイル取得処理
	var getPdfFile = function($scope, id, workflowId) {
		var workflowId = workflowId || -1;
		var sysHanNoMajor = -1;
		var dataCheckFlg = true;
		// 通信用パラメータの設定
		var param = {
			'langKey': CommonService.getLanguageKey($scope),
			'dataCheckFlg': dataCheckFlg,
			'id': id,
			'workflowId': workflowId,
			'hanId': sysHanNoMajor
		};
		// プレビューエリアのクリア
		$scope.errorPreview = null;
		$scope.pdfSrc = "";
		$scope.noPrint = false;
		// 詳細情報の取得
		CommonService.httpPost(ACTION_SEARCH_PREVIEW, param,
			function(resolveData, state, header) {
				// 成功処理
				$scope.noPrint = (header('security-print') == 'true') ? true : false;
				$scope.pdfSrc = ACTION_SEARCH_PREVIEW_IE + "?id=" + id + "&workflowId=" + workflowId + "&hanId=" + sysHanNoMajor;
			},
			function(rejectData, state) {
				// 失敗処理
				var reader = new FileReader();
				reader.onload = function(re) {
					var errorJson = {};
					// エラー情報の生成
					errorJson.errorInfo = JSON.parse(re.target.result);
					if (errorJson.errorInfo.details) {
						var pdfHenkanJokyoKbn = errorJson.errorInfo.details.pdfHenkanJokyoKbn;
						if (pdfHenkanJokyoKbn > 0 && pdfHenkanJokyoKbn < 10 && pdfHenkanJokyoKbn != 5) {
							// エラーPDFの表示設定
							$scope.pdfSrc = "pdf/pdfHenkanJokyo_" + pdfHenkanJokyoKbn + ".pdf"
						} else {
							$scope.errorPreview = errorJson.errorInfo.message;
						}
					} else {
						// 失敗処理
						if (errorJson.errorInfo.code == 'W00021' || errorJson.errorInfo.code == 'W00012' || errorJson.errorInfo.code == 'W00037') {
							$scope.errorPreview = errorJson.errorInfo.message;
						} else {
							if (errorJson.errorInfo.errorInfo) {
								CommonService.errorProcess($scope, errorJson.errorInfo);
							} else {
								CommonService.errorProcess($scope, errorJson);
							}
						}
					}
				};
				var blob = new Blob([rejectData], { type: "text/plain" });
				reader.readAsText(blob);
			},
			{responseType: 'arraybuffer'}
		);
	}

	// 属性情報チェック
	var checkZokusei = function($scope, detailAreaData) {
		var rtnErrorFlg = false;
		// タブエラーアイコンを非表示
		$scope.hasDetailTabZokuseiError = false;
		$scope.hasDetailTabKoseiError = false;
		// 公開日時エラーをクリア
		detailAreaData.kokaiTimestampError = null;
		// 公開前アクセス可能者エラーをクリア
		detailAreaData.kokaimaeAccessKaUserError = null;
		// 文書種エラー消去
		$scope.$parent.detailAreaData.bunshoshuError = null;
		// 公開系の表示が ON の場合のみ、公開系項目のチェックを実行
		if (detailAreaData.displayKokaiFlg) {
			// 公開日時チェック
			if ((!CommonService.isEmpty(detailAreaData.kokaiTimestamp.date) && CommonService.isEmpty(detailAreaData.kokaiTimestamp.time))
				|| (CommonService.isEmpty(detailAreaData.kokaiTimestamp.date) && !CommonService.isEmpty(detailAreaData.kokaiTimestamp.time))) {
				// どちらか一方のみ入力済みの場合、書式エラー
				detailAreaData.kokaiTimestampError = CommonService.getMessage($scope, "W00013", ["timestampFormatHhMm"]);
				rtnErrorFlg = true;
			} else if ($('#kokaiTime').attr('class').split(" ").indexOf('ng-invalid') != -1) {
				// 時間入力エリア内で invalid が発生している場合、書式エラー
				detailAreaData.kokaiTimestampError = CommonService.getMessage($scope, "W00013", ["timestampFormatHhMm"]);
				rtnErrorFlg = true;
			}
		}
		// 属性情報
		angular.forEach(detailAreaData.zokuseiList, function(zokusei) {
			// エラー情報をクリア
			zokusei.error = null;
			var messages = [];
			messages = CommonService.checkZokusei(zokusei, zokusei.kbn, messages);
			if (messages.length) {
				// 最初のエラーを表示
				zokusei.error = messages[0];
				rtnErrorFlg = true;
			}
		});
		// 構成図面情報
		var qtyName;
		angular.forEach($scope.kosei_gridOptions.columnDefs, function(column) {
			if (column.id == 2) {
				qtyName = column.displayName;
			}
		});
		// 構成図面情報
		angular.forEach(detailAreaData.kosei, function(kosei) {
			var qty = kosei.qty;
			kosei.errorMessage = "";
			if (!CommonService.isEmpty(qty)) {
				if (String(qty).length > 3) {
					// 3桁以上の場合
					kosei.errorMessage += qtyName + ' ： ' + CommonService.getMessage(null, 'W00006', ['3']) + "<br/>";
					rtnErrorFlg = true;
				}

				if (!CommonService.checkDigit(qty)) {
					// 数値以外の場合
					kosei.errorMessage += qtyName + ' ： ' + CommonService.getMessage(null, 'W00013', ['number']) + "<br/>";
					rtnErrorFlg = true;
				}
			}
		});

		return rtnErrorFlg;
	};

	// 通信用データ生成
	var createUpdateListData = function(addList, listData, kbn, original) {
		angular.forEach(listData, function(data, i) {
			var setKbn = angular.copy(kbn);
			if (!kbn) {
				if (data.addFlg) {
					setKbn = Const.UPDATE_STATUS_INSERT;
				} else {
					setKbn = Const.UPDATE_STATUS_NONE;
					angular.forEach(original, function(org) {
						if ((data.id == org.id) &&
							(data.qty != org.qty) && 
							!(CommonService.isEmpty(data.qty) && CommonService.isEmpty(org.qty))) {
							setKbn = Const.UPDATE_STATUS_UPDATE;
						}
					});
				}
			}
			// 追加データ
			var addData = {
				"id": data.id,
				"updateStatus": setKbn
			}
			// 構成数量データチェック
			if (!CommonService.isEmpty(data.qty)) {
				addData["qty"] = data.qty;
			}
			addList.push(addData);
		});
	};

	// 詳細エリアデータ整形
	var detailFixedItem = function(detailAreaData) {
		var data = angular.copy(detailAreaData);
		delete data.kosei;
		delete data.kanren;
		delete data.log;
		delete data.displayKokaiFlg;
		delete data.pdfPasswordFlg;
		delete data.fixedColName;
		delete data.dispZokuseiJohoShutoku;
		delete data.createUserId;
		// 公開対応
		delete data.kokaiTimestampError;
		delete data.kokaimaeAccessKaUserError;
		if (CommonService.isEmpty(data.kokaiTimestamp.dispTimestamp)) {
			data.kokaiTimestamp = null;
		} else {
			data.kokaiTimestamp = CommonService.datepickerToUnixTime(data.kokaiTimestamp.dispTimestamp);
		}
		data.kokaimaeAccessKaUserId = [];
		angular.forEach(data.kokaimaeAccessKaUser.data, function(user) {
			data.kokaimaeAccessKaUserId.push(user.id);
		});
		if (data.kokaimaeAccessKaUserId.length == 0) {
			data.kokaimaeAccessKaUserId = null;
		}
		delete data.kokaimaeAccessKaUser;
		// 文書種対応
		//「zokuseiList」は表示用の属性リストなので保持してる属性入力内容の変数に書き換え
		data.zokuseiList = data.zokuseiListAll;
		delete data.zokuseiListAll;
		delete data.bunshoshuId;
		delete data.bunshoshuError;
		// 属性リスト不要項目削除
		var zokuseiList = [];
		angular.forEach(data.zokuseiList, function(zokusei) {
			if (zokusei.zokuseiId != null || (zokusei.id != null && angular.isDefined(zokusei.kbn))) {
				if (angular.isUndefined(zokusei.zokuseiId)) {
					zokusei.zokuseiId = zokusei.id;
				}
				if (angular.isUndefined(zokusei.zokuseiName)) {
					zokusei.zokuseiName = zokusei.name;
				}
				delete zokusei.zokuseiSentakushi;
				delete zokusei.error;
				delete zokusei.kaishaId;
				delete zokusei.id;
				delete zokusei.name;
				delete zokusei.updateTimestamp;
				delete zokusei.first;
				delete zokusei.createUserId;
				// 属性がフラグ型の場合,true/false 必須設定
				if (ZokuseiSearchService.isZokuseiDataTypeKbnFlg(zokusei.dataTypeKbn)) {
					if (zokusei.kbn) {
						zokusei.kbn = true;
					} else {
						zokusei.kbn = false;
					}
				}
				// 属性が数値型の場合,数値変換
				if (ZokuseiSearchService.isZokuseiDataTypeKbnNum(zokusei.dataTypeKbn)) {
					zokusei.kbn = CommonService.parseFloat(zokusei.kbn, null);
				}
				// 属性が日付型の場合,フォーマット変換
				if (ZokuseiSearchService.isZokuseiDataTypeKbnDate(zokusei.dataTypeKbn)) {
					zokusei.kbn = new Date(zokusei.kbn).getTime();
				}
				// 属性がタグの場合,フォーマット変換
				if (ZokuseiSearchService.isZokuseiDataTypeKbnTag(zokusei.dataTypeKbn)) {
					zokusei.kbn = CommonService.tagToDb(zokusei.kbn, 'text');
				}
				// 複数選択肢の場合,フォーマット変換
				if (ZokuseiSearchService.isZokuseiDataTypeKbnSelectMulti(zokusei.dataTypeKbn)) {
					// 取得した選択肢を使用してタグ項目の変更
					zokusei.kbn = CommonService.tagToDb(zokusei.kbn, 'id');
				}
				zokuseiList.push(zokusei);
			}
		});
		data.zokuseiList = zokuseiList;
		return data;
	};

	// 通常モード、編集モード切替処理
	var changeMode = function($scope, isEdit) {
		var searchAreaParentLayout = myLayout;
		var listAreaParentLayout = myLayout.children.center.layout1;
		var detailAreaParentLayout = myLayout.children.center.layout1.children.center.layout1;
		var commentAreaParentLayout = myLayout.children.center.layout1.children.center.layout1.children.west.layout1;

		// モードの設定
		$scope.$parent.edit = isEdit;
		// エラーアイコンをクリア
		$scope.hasDetailTabZokuseiError = false;
		$scope.hasDetailTabKoseiError = false;
		// 一覧設定の更新(チェックのselectを制御)
		$scope.koseiListGridApi.core.notifyDataChange( uiGridConstants.dataChange.COLUMN );
		// 一覧列表示制御
		$scope.koseiListGridApi.grid.columns[COLUMN_ERROR].colDef.visible = isEdit;
		$scope.koseiListGridApi.grid.columns[COLUMN_PREVIEW_KOSEI].colDef.visible = !isEdit;
		$scope.koseiListGridApi.grid.columns[COLUMN_DELETE_KOSEI].colDef.visible = isEdit;
		$scope.kanrenListGridApi.grid.columns[COLUMN_PREVIEW_KANREN].colDef.visible = !isEdit;
		$scope.kanrenListGridApi.grid.columns[COLUMN_DELETE_KANREN].colDef.visible = isEdit;
		// 一覧設定の更新(チェックのselectを制御)
		if (isEdit) {
			// 編集モードの場合
			$scope.originDetailAreaData = angular.copy($scope.$parent.detailAreaData);
			// 検索エリアの表示状態を取得し、非表示とする
			searchLayoutClosed = searchAreaParentLayout.west.state.isClosed;
			searchAreaParentLayout.hide('west');
			// 一覧エリアの表示状態を取得し、非表示とする
			listLayoutClosed = listAreaParentLayout.north.state.isClosed;
			listAreaParentLayout.hide('north');
			// コメントエリアの表示状態を取得し、非表示とする
			commentLayoutClosed = commentAreaParentLayout.south.state.isClosed;
			commentAreaParentLayout.hide('south');
			// 詳細エリアの幅状態を取得
			layoutWidth = detailAreaParentLayout.west.state.layoutWidth;
		} else {
			// 通常モードの場合
			// 検索エリアを元の状態で表示する
			searchAreaParentLayout.show('west', !searchLayoutClosed);
			// 一覧エリアを元の状態で表示する
			listAreaParentLayout.show('north', !listLayoutClosed);
			// コメントエリアを元の状態で表示する
			commentAreaParentLayout.show('south', !commentLayoutClosed);
		}
	};

	// コメント情報取得処理
	var getComment = function($scope, addFlg) {
		// 通信用パラメータの設定
		if (!$scope.commentInfo.comment && !$scope.commentInfo.hanRireki && !$scope.commentInfo.henkoRireki) {
			// 全てOFFの場合
			$scope.$parent.detailAreaData.log = [];
			return;
		}
		var param = {
			'langKey': CommonService.getLanguageKey($scope),
			'id': $scope.$parent.detailAreaData.id,
			'data': $scope.commentInfo,
			'addFlg': addFlg,
			'logCnt': $scope.$parent.detailAreaData.log.length
		};
		// ワークフロー画面の場合、ワークフローIDを付与
		if (isActiveTabWorkflow($scope)) {
			if (!$scope.$parent.listAreaSelectData) {
				return;
			}
			param['workflowId'] = $scope.$parent.listAreaSelectData.workflowId;
		}
		// 追加情報の取得の場合、最大ファイルIDを設定
		if (addFlg) {
			param['mostOldLogId'] = $scope.$parent.detailAreaData.log[$scope.$parent.detailAreaData.log.length - 1].id;
		}
		$scope.commentLoading = true;
		// 詳細情報の取得
		CommonService.httpPost(ACTION_COMMENT_SEARCH, param,
			function(resolveData) {
				// 成功処理
				if (!CommonService.isError(resolveData)) {
					// コメントの取得
					var logs = resolveData;
					if (!addFlg) {
						// ログの表示切り替えの場合
						$scope.$parent.detailAreaData.log = [];
					}
					// ログを追加
					angular.forEach(logs, function(log) {
						$scope.$parent.detailAreaData.log.push(log);
					});
					$scope.commentLoading = false;
				} else {
					if (resolveData.errorInfo.code == 'W00021') {
						var promise = CommonService.dispMessage($scope, resolveData.errorInfo.code, null, resolveData.errorInfo.message);
						promise.then(
							function(result) {
								// 一覧エリアをリフレッシュ
								$scope.onListRefresh();
							}
						)
					} else {
						// 失敗処理
						CommonService.errorProcess($scope, resolveData);
					}
				}
			},
			function(rejectData, state) {
				// 失敗処理
				CommonService.systemError($scope, state);
			}
		);
	};

	// ワークフロー一覧データ取得処理
	var getWorkflowListData = function($scope, searchJoken, searchAreaFlg) {
		var searchJoken = searchJoken || $scope.$parent.workflowListSearchJoken;
		// 検索条件の保持
		$scope.$parent.workflowListSearchJoken = angular.copy(searchJoken);
		// ワークフロー一覧の選択を解除する
		$scope.workflowListGridApi.selection.clearSelectedRows();
		// ワークフロー申請情報エリアの初期化
		initWorkflowShinseiInfoArea($scope, true);
		// ワークフロー進行状況エリアの初期化
		initWorkflowProgressState($scope, true);
		// 詳細エリアの初期化
		$scope.$parent.workflowShinseiFileDetailAri = false;
		$scope.$parent.workflowError = {};
		// ワークフロー申請ファイルリストの初期化
		$scope.$parent.shinseiFileListDataMap = new Map();
		// 申請ファイル選択状態の初期化
		$scope.$parent.shinseiHashKey = null;
		// 通信用パラメータの設定
		var param = {
			'langKey': CommonService.getLanguageKey($scope),
			'data': searchJoken
		};
		// 一覧情報の取得
		CommonService.httpModal($scope, ACTION_WORKFLOW_SEARCH, param, true,
			function(resolveData) {
				// 成功処理
				if (!CommonService.isError(resolveData)) {
					$scope.$parent.shinseiFileListGridApi = {};
					// 一覧データの設定
					$scope.$parent.workflowListData = resolveData.workflowList;
					// 一覧データのセット
					$scope.workflowList_gridOptions.data = [];
					angular.forEach($scope.$parent.workflowListData, function(data) {
						// サブグリッドオプションの設定
						setShinseiFileOptions($scope, data);
					});
					// サブグリッドにスコープを付与
					angular.forEach($scope.workflowList_gridOptions.data, function(data) {
						data.subGridOptions.appScopeProvider = $scope;
					});
					// 詳細エリアとの境のバーを設定
					var listAreaParentLayout = myLayout.children.center.layout1;
					$scope.workflowListScrollCancelFlg = false;
					// 一覧データが無かった場合
					if (!$scope.$parent.workflowListData.length) {
						// 詳細エリアとの境のバーを非表示
						listAreaParentLayout.hide('north');
						$scope.$parent.workflowError.listArea = CommonService.getMessage($scope, 'W00010');
					} else if (listAreaParentLayout.north.state.isClosed) {
						// スクロール状態を無しにする
						var container = $scope.workflowListGridApi.grid.renderContainers['body'];
						container.prevScrollLeft = 0;
						container.prevScrollleftPercentage = 0;
						container.prevScrollTop = 0;
						container.prevScrolltopPercentage = 0;
						// 一覧エリアを表示
						listAreaParentLayout.toggle('north');
						// バーのオープンイベントによる「workflowListScroll」の実行を防ぐ
						$scope.workflowListScrollCancelFlg = true;
					}
					// 一覧の状態を保存
					$scope.$parent.workflowListGridApiState = $scope.workflowListGridApi.saveState.save();
					// 一覧の高さ調整
					var height = $('.pane-list-body').height();
					$('.grid').css('height', height + 'px');
					// ページング情報の取得
					$scope.$parent.pagination = CommonService.setPagination($scope.$parent.pagination, param.data.dispPage, param.data.dispCnt, resolveData.listCount);
					// レイアウトのリサイズ
					layoutResize();
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

	// ワークフロー一覧申請ファイル選択状況取得
	var getWorkflowShinseiFileGridSelectedData = function($scope) {
		var selectedData = [];
		angular.forEach($scope.$parent.workflowListData, function(workflowData) {
			var gridApi = $scope.$parent.shinseiFileListGridApi[workflowData.id];
			if (gridApi) {
				// 選択されているデータが有るかチェック
				if (gridApi.selection.getSelectedRows().length) {
					var selectedRows = CommonService.getGridSelectData(gridApi);
					angular.forEach(selectedRows, function(data) {
						selectedData.push(data);
					});
				}
			}
		});
		return selectedData;
	}

	// ワークフロー申請ファイルリスト取得処理
	var getShinseiFileListData = function($scope, row) {
		// 通信用パラメータの設定
		var param = {
			'langKey': CommonService.getLanguageKey($scope),
			'id': row.entity.id
		};
		// 一覧情報の取得
		CommonService.httpModal($scope, ACTION_WORKFLOW_SEARCH_SHINSEI, param, true,
			function(resolveData) {
				// 成功処理
				if (!CommonService.isError(resolveData)) {
					// サブグリッドオプションの設定
					var subGridOptions = row.entity.subGridOptions;
					// 一覧ヘッダータイトルの設定
					setFileListColumnDefs($scope, subGridOptions, resolveData.title, null, true);
					$scope.$parent.shinseiFileListTitle = angular.copy(resolveData.title);
					// 一覧データのセット
					subGridOptions.data = resolveData.fileList;
					var subGridData = {
						'id': row.entity.id,
						'data': angular.copy(subGridOptions.data)
					}
					if (!$scope.$parent.shinseiFileListData) {
						$scope.$parent.shinseiFileListData = [];
					}
					$scope.$parent.shinseiFileListData.push(subGridData);
					// レイアウトのリサイズ
					myLayout.resizeAll();
				} else {
					// 失敗処理
					CommonService.errorProcess($scope, resolveData)
						.then(function() {
							// 一覧エリアの更新を促すエラーメッセージが返却されてきた場合、一覧をリフレッシュ
							if (resolveData.errorInfo.code == 'W00021') {
								// 検索エリア(ワークフロー)情報取得
								getSearchAreaData($scope, Const.GET_KENSAKU_TAB_PATTERN_WORKFLOW);
								// 一覧エリアをリフレッシュ
								getWorkflowListData($scope);
							}
						});
				}
			},
			function(rejectData, state) {
				// 失敗処理
				CommonService.systemError($scope, state);
			}
		);
	}

	// ワークフロー詳細情報データ取得処理
	var getWorkflowDetailData = function($scope, rowData) {
		// 通信用パラメータの設定
		var param = {
			'langKey': CommonService.getLanguageKey($scope),
			'id': rowData.id
		};
		// 一覧情報の取得
		CommonService.httpModal($scope, ACTION_WORKFLOW_SEARCH_DETAIL, param, true,
			function(resolveData) {
				// 成功処理
				if (!CommonService.isError(resolveData)) {
					// ワークフロー申請情報
					$scope.$parent.applicationInfo = resolveData.applicationInfo;

					// ワークフロー状況設定
					$scope.$parent.authInfo = resolveData.authInfo;

					// ワークフロー進行情報
					$scope.$parent.statusList = resolveData.statusList;
					$scope.$parent.existHistory = false;
					$scope.$parent.lastHistoryStepData = null;
					$scope.$parent.processingStepInfo = null;
					angular.forEach($scope.$parent.statusList ,function(data, index) {
						// 履歴ステップ存在チェック
						if (data.rirekiFlg) {
							$scope.$parent.existHistory = true;
							$scope.$parent.lastHistoryStepData = index;
						} else {
							// 処理ステップチェック
							if (data.stepNo == $scope.$parent.authInfo.processingNo) {
								$scope.$parent.processingStepInfo = data;
							}
						}
					});

					// ワークフロー差し戻しリスト
					$scope.$parent.remandList = resolveData.remandList;

					// コメント、添付ファイルの初期化
					$scope.$parent.workflowStatusComment = null;
					$scope.$parent.shoninFileList = [];
					$scope.shonin_gridOptions.data = [];
					$scope.$parent.fileId = 1;
					StorageService.deleteData('pdfKakuninData');

					// レイアウトのリサイズ
					layoutResize();
				} else {
					// 失敗処理
					CommonService.errorProcess($scope, resolveData)
						.then(function() {
							// 一覧エリアの更新を促すエラーメッセージが返却されてきた場合、一覧をリフレッシュ
							if (resolveData.errorInfo.code == 'W00021') {
								// 検索エリア(ワークフロー)情報取得
								getSearchAreaData($scope, Const.GET_KENSAKU_TAB_PATTERN_WORKFLOW);
								// 一覧エリアをリフレッシュ
								getWorkflowListData($scope);
							}
						});
				}
			},
			function(rejectData, state) {
				// 失敗処理
				CommonService.systemError($scope, state);
			}
		);
	}

	// 承認処理チェック
	var checkApproval = function($scope) {
		var rtnErrorFlg = false;
		$scope.error = {};
		// 添付ファイル必須フラグが立っている場合、添付ファイルをチェック
		if ($scope.$parent.processingStepInfo.tempuFileHissuFlg && !$scope.shonin_gridOptions.data.length) {
			$scope.error.tempFile = CommonService.getMessage($scope, 'W00024', ['file']);
			rtnErrorFlg = true;
		}
		// 添付ファイルのファイルサイズオーバーチェック
		angular.forEach($scope.shonin_gridOptions.data, function(data) {
			// エラー情報をクリア
			data.status = "";
			data.errorMessage = "";
			// ファイルサイズオーバー
			if (data.fileSizeOver) {
				data.status = Const.STATUS_ERROR;
				data.errorMessage = $translate.instant("file_size_over");
				rtnErrorFlg = true;
			}
			// ファイル非存在エラー
			if (data.file.size == 0 || data.existErrFlg) {
				data.status = Const.STATUS_ERROR;
				data.errorMessage = CommonService.getMessage($scope, "W00010");
				rtnErrorFlg = true;
			}
		});

		// チェック処理
		return rtnErrorFlg;
	}

	// 詳細エリアレイアウト切替処理
	var showInnerLayout = function(areaKbn) {
		if (areaKbn == Const.LAYOUT_DETAIL_WORKFLOW) {
			$('#inner-layout-detail').hide();
			$('#inner-layout-detail-workflow').show();
		} else {
			$('#inner-layout-detail-workflow').hide();
			$('#inner-layout-detail').show();
		}
		myLayout.resizeAll();
	};

	// 「承認の取消/確認の取消」ボタン押下処理
	var approvalConfirmationCancel = function($scope, statusKbn) {
		var pdfPasswordList = angular.copy($scope.pdfPasswordCheckList);
		// 不要項目の削除
		angular.forEach(pdfPasswordList, function(data) {
			delete data.fileName;
			delete data.userPasswordFlg;
			delete data.ownerPasswordFlg;
			delete data.status;
			delete data.errorMessage;
		});
		// 通信用パラメータの設定
		var param = {
			'langKey': CommonService.getLanguageKey($scope),
			'id': $scope.$parent.applicationInfo.id,
			'pdfPasswordList': pdfPasswordList,
			'statusKbn': statusKbn
		};
		var dtlInfo = {
			workflowId: param.id
		};
		// 詳細情報の取得
		CommonService.httpModal($scope, ACTION_WORKFLOW_PROCESSING_CANCEL, param, true,
			function(resolveData) {
				// 成功処理
				if (!CommonService.isError(resolveData)) {
					if (statusKbn == Const.WORKFLOW_STATUS_APPROVAL_CANCEL) {
						var promise = CommonService.dispMessage($scope, 'I00001', ['approvalCancel']);
					} else {
						var promise = CommonService.dispMessage($scope, 'I00001', ['confirmationCancel']);
					}
					promise.then(
						function(result) {
							// 検索エリア(ワークフロー)情報取得
							getSearchAreaData($scope, Const.GET_KENSAKU_TAB_PATTERN_WORKFLOW);
							// 一覧エリアをリフレッシュ
							getWorkflowListData($scope);
						}
					);
					// システム操作ログ登録（成功）
					CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_APPROVAL_CANCEL, dtlInfo);
				} else {
					// 失敗処理
					CommonService.errorProcess($scope, resolveData, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_APPROVAL_CANCEL, dtlInfo);
				}
			},
			function(rejectData, state) {
				// 失敗処理
				CommonService.systemError($scope, state, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_APPROVAL_CANCEL, dtlInfo);
			}
		);
	};

	// PDFパスワード入力一覧作成処理
	var setPdfPasswordCheckList = function($scope, fileList, pdfPasswordCheckList, kbn) {
		angular.forEach(fileList, function(data) {
			if (data.userPasswordFlg || data.ownerPasswordFlg) {
				var file = {};
				file['fileId'] = data.fileId;
				file['fileName'] = data.fileName;
				file['userPassword'] = null;
				file['ownerPassword'] = null;
				file['userPasswordFlg'] = data.userPasswordFlg;
				file['ownerPasswordFlg'] = data.ownerPasswordFlg;
				if (kbn == Const.PDF_PASSWORD_CONFIRM_MODE_WORKFLOW_LIST_PRINT) {
					// ワークフロー一覧印刷の場合のみ値セット
					file['hanNo'] = data.hanNo;
					file['hanKanriIdList'] = [data.hanKanriId];
					file['workflowId'] = data.workflowId;
					file['sysHanNoMajor'] = data.sysHanNoMajor;
					// システム版番号メジャーの重複行取得
					var overlapIndex = getHanNoMajorOverlapIndex(pdfPasswordCheckList, file);
					if (overlapIndex != null) {
						// 重複行が存在した場合版管理IDのみセット
						pdfPasswordCheckList[overlapIndex].hanKanriIdList.push(data.hanKanriId);
						return;
					}
				} else {
					// 重複行が存在した場合、データを追加しない
					if (CommonService.isOverlapKey(pdfPasswordCheckList, file, 'fileId')) {
						return;
					}
				}
				// データを追加
				pdfPasswordCheckList.push(file);
			}
		});
		return pdfPasswordCheckList;
	}

	// ワークフロー一覧エリアのエラー表示設定
	var setWorkflowListErrorInfo = function($scope, details) {
		// 一覧にエラーを設定
		var errorMessages = {};
		angular.forEach(details, function(detail) {
			// ファイルIDの判断
			var shinseiFileId = detail.details.workflowShinseiFileId;
			if (!errorMessages[shinseiFileId]) {
				errorMessages[shinseiFileId] = [];
			}
			// ファイルチェック結果
			errorMessages[shinseiFileId].push(detail.message);
		});
		angular.forEach($scope.$parent.workflowListData, function(data) {
			angular.forEach(data.subGridOptions.data, function(subData) {
				var shinseiFileId = subData.id;
				if (errorMessages[shinseiFileId]) {
					subData.errorStatus = Const.STATUS_ERROR;
					subData.errorMessage = errorMessages[shinseiFileId].join("<br />");
				}
			});
		});
	}

	// 一覧エリアエラー表示設定
	var setListErrorInfo = function($scope, listData, details) {
		// 一覧にエラーを設定
		var errorMessages = {};
		angular.forEach(details, function(detail) {
			// ファイルIDの判断
			var fileId = detail.details.fileId;
			if (!errorMessages[fileId]) {
				errorMessages[fileId] = [];
			}
			// ファイルチェック結果
			if (!CommonService.isOverlapKey(errorMessages[fileId], detail.message)) {
				var message = detail.message;
				if (detail.details.zokuseiName) {
					message = detail.details.zokuseiName + ':' + message;
				}
				errorMessages[fileId].push(message);
			}
		});
		angular.forEach(listData, function(data) {
			var fileId = data.id;
			if (errorMessages[fileId]) {
				data.errorStatus = Const.STATUS_ERROR;
				data.errorMessage = errorMessages[fileId].join("<br />");
			}
		});
	}

	// ワークフロー一覧エリアエラー表示設定
	var clearWorkflowListErrorInfo = function(listData) {
		angular.forEach(listData, function(data) {
			clearListErrorInfo(data.subGridOptions.data);
		});
	}

	// ファイル一覧エリアエラー表示クリア
	var clearListErrorInfo = function(listData) {
		angular.forEach(listData, function(data) {
			data.errorStatus = null;
			data.errorMessage = null;
		});
	}

 	// ペイン幅の値をセット
	var setPainSize = function(num) {

		if (num > 99) {
			num = 99;
		}

		return '.' + ('00' + num).slice(-2);
	};

	// ツリー選択状態クリア
	var clearSelectBranch = function(data, selectedBranch) {
		angular.forEach(data, function(branch) {
			if (branch != selectedBranch) {
				// 選択状態をクリア
				branch.selected = false;
			}
			if (branch.children) {
				// 子階層が存在する場合、再帰呼出し
				clearSelectBranch(branch.children, selectedBranch);
			}
		});
	}

	// ファイル一覧再描写
	var fileListScroll = function($scope) {
		if ($scope.fileListScrollCancelFlg) {
			// 以降の処理を行わない
			$scope.fileListScrollCancelFlg = false;
			return;
		}

		// ファイル一覧表示処理
		if ($scope.fileListGridApi) {
			// gridデータが消えるため、スクロールを行う
			$scope.fileListGridApi.core.scrollTo( $scope.fileList_gridOptions.data[1], $scope.fileList_gridOptions.columnDefs[6]);
			// 選択行取得処理
			var selectedRowIndex = 0;
			if ($scope.$parent.hashKey) {
				angular.forEach($scope.fileList_gridOptions.data, function(data, index) {
					if ($scope.$parent.hashKey == data.$$hashKey) {
						selectedRowIndex = index;
					}
				});
			}
			$timeout(function() {
				// 選択行へスクロール
				$scope.fileListGridApi.core.scrollTo($scope.fileList_gridOptions.data[selectedRowIndex], $scope.fileList_gridOptions.columnDefs[0]);
			});
		}
	}

	// ワークフロー一覧再描写
	var workflowListScroll = function($scope) {
		if ($scope.workflowListScrollCancelFlg) {
			// 以降の処理を行わない
			$scope.workflowListScrollCancelFlg = false;
			return;
		}

		if ($scope.workflowListGridApi) {
			// gridデータが消えるため、スクロールを行う
			$scope.workflowListGridApi.core.scrollTo( $scope.workflowList_gridOptions.data[1], $scope.workflowList_gridOptions.columnDefs[1]);
			// 選択行取得処理
			var selectedRowIndex = 0;
			var selectedRow = $scope.workflowListGridApi.selection.getSelectedRows();
			if (selectedRow.length) {
				angular.forEach($scope.workflowList_gridOptions.data, function(data, index) {
					if (data.id == selectedRow[0].id) {
						selectedRowIndex = index;
					}
				});
			}
			$timeout(function() {
				// 選択行へスクロール
				$scope.workflowListGridApi.core.scrollTo( $scope.workflowList_gridOptions.data[selectedRowIndex], $scope.workflowList_gridOptions.columnDefs[0]);
			});
		}
	}

	var setDispData = function($scope) {
		// 表示データセット
		// 検索エリア（ツリー検索）選択状態の復元
		if ($scope.$parent.activeController && $scope.$parent.selectedBranch) {
			$scope.$parent.activeController.set_branch($scope.$parent.selectedBranch);
		}
		// ファイル一覧
		if ($scope.$parent.fileListGridApiState) {
			$scope.fileListGridApi.saveState.restore($scope, $scope.$parent.fileListGridApiState);
			// 選択情報、展開情報の設定
			angular.forEach($scope.fileListGridApi.grid.rows, function(row, index) {
				// 選択情報の設定
				row.isSelected = $scope.gridRowsState[index].isSelected;
				// 構成展開情報の設定
				row.treeNode.state = $scope.gridRowsState[index].state;
				// 行選択表示ハッシュキー更新
				if ($scope.gridRowsState[index].hashKey == $scope.$parent.hashKey) {
					$scope.$parent.hashKey = row.entity.$$hashKey;
				}
			});
			// 全選択状態チェック
			checkAllSelected($scope, $scope.fileListGridApi.grid);
			// サムネイル表示の場合、サムネイル情報を復元
			if (!$scope.$parent.dispList) {
				// サムネイル表示押下処理
				$scope.onDispListType(Const.DISP_LIST_TYPE_THUMBNAIL);
			}
		}
		if ($scope.$parent.listAreaZokuseiList && $scope.$parent.fileListRefreshFlg) {
			// リフレッシュを行う
			$scope.onListRefresh();
		} else {
			// プレビュー情報取得
			if ($scope.$parent.detailAreaData && $scope.$parent.listAreaSelectData) {
				if (isActiveTabWorkflow($scope)) {
					var fileId = $scope.$parent.listAreaSelectData.fileId;
				} else {
					var fileId = $scope.$parent.listAreaSelectData.id;
				}
				var workflowId = $scope.$parent.listAreaSelectData.workflowId;
				// プレビュー用PDF取得
				if (fileId) {
					getPdfFile($scope, fileId, workflowId);
				}
			}
			// 詳細エリア：構成図面情報セット
			if ($scope.$parent.koseiGridOptions) {
				$scope.kosei_gridOptions.columnDefs = $scope.$parent.koseiGridOptions.columnDefs;
				$scope.kosei_gridOptions.data = $scope.$parent.koseiGridOptions.data;
			}
			// 詳細エリア：関連ファイル情報セット
			if ($scope.$parent.kanrenGridOptions) {
				$scope.kanren_gridOptions.columnDefs = $scope.$parent.kanrenGridOptions.columnDefs;
				$scope.kanren_gridOptions.data = $scope.$parent.kanrenGridOptions.data;
			}
		}
		// ワークフロー一覧リフレッシュ処理
		if ($scope.$parent.workflowListRefreshFlg) {
			// 一覧エリアの初期化
			initWorkflowListAreaData($scope, true);
			// ワークフロー申請情報エリアの初期化
			initWorkflowShinseiInfoArea($scope, true);
			// ワークフロー進行状況エリアの初期化
			initWorkflowProgressState($scope, true);
			// ワークフロー一覧リフレッシュ
			$timeout(function() { getWorkflowListData($scope); }, 100);
		} else {
			// ワークフロー一覧
			if ($scope.$parent.workflowListGridApiState) {
				$scope.workflowListGridApi.saveState.restore($scope, $scope.$parent.workflowListGridApiState);
			}
			// ワークフロー一覧データ設定
			if ($scope.$parent.workflowListData) {
				$timeout(function() { workflowListScroll($scope); }, 300);
				// サブグリッドにスコープを付与
				angular.forEach($scope.$parent.workflowListData, function(data) {
					setShinseiFileOptions($scope, data);
					data.subGridOptions.appScopeProvider = $scope;
					var title = $scope.$parent.shinseiFileListTitle;
					if (title) {
						setFileListColumnDefs($scope, data.subGridOptions, title, null, true);
					}
					// 申請ファイルデータの設定
					if ($scope.$parent.shinseiFileListData) {
						for (var i = 0; i < $scope.$parent.shinseiFileListData.length; i++) {
							var shinseiFile = $scope.$parent.shinseiFileListData[i];
							if (shinseiFile.id == data.id) {
								data.subGridOptions.data = shinseiFile.data;
								break;
							}
						}
					}
				});
			}
			// ワークフロー進行状況エリア設定
			// 確認データの取得
			var pdfKakuninData = StorageService.getData('pdfKakuninData');
			if (pdfKakuninData && $scope.$parent.applicationInfo) {
				// ワークフローIDチェック
				if (pdfKakuninData.workflowId == $scope.$parent.applicationInfo.id) {
					// 申請ファイルチェック
					angular.forEach($scope.$parent.applicationInfo.shinseiFileList, function(data) {
						if (data.fileId == pdfKakuninData.fileId) {
							data.kakuninFlg = true;
						}
					})
					// 関連ファイルチェック
					angular.forEach($scope.$parent.applicationInfo.kanrenFileList, function(data) {
						if (data.fileId == pdfKakuninData.fileId) {
							data.kakuninFlg = true;
						}
					})
				}
			}
			// 添付ファイルの設定
			if ($scope.shonin_gridOptions && $scope.$parent.shoninFileList) {
				$scope.shonin_gridOptions.data = $scope.$parent.shoninFileList;
			}
		}
		// ファイル一覧リフレッシュフラグを Off にする。
		$scope.$parent.fileListRefreshFlg = false;
	}

 	// 検索タブが関連する操作（「一覧情報取得処理」、「CSV出力処理」）を行った際の操作ログ情報に必要な『操作詳細区分』を返却
	var getSosaDtlKbnSearch = function(sosaKbn, dtlInfo) {
		var sosaDtlKbn = null;

		// 「CSV 出力処理」且つ 検索条件無し の場合
		if (sosaKbn == Const.SOSA_LOG_SOSA_KBN_CSV && !dtlInfo.searchJoken) {
			return Const.SOSA_LOG_SOSA_DTL_KBN_CSV_OUTPUT_FILE_LIST_SELECTION;
		}

		// 検索タブ毎の判定
		switch (dtlInfo.searchJoken.tab) {
			case Const.KENSAKU_TAB_ZENBUN:
				// -----------------
				// 全文検索タブ
				// -----------------
				switch (sosaKbn) {
					case Const.SOSA_LOG_SOSA_KBN_LIST:
						// 一覧情報取得処理
						sosaDtlKbn = Const.SOSA_LOG_SOSA_DTL_KBN_FULL_TEXT_SEARCH;
						break;
					case Const.SOSA_LOG_SOSA_KBN_CSV:
						// CSV出力処理
						sosaDtlKbn = Const.SOSA_LOG_SOSA_DTL_KBN_CSV_OUTPUT_FULL_TEXT_SEARCH_RESULT;
						break;
				}
				break;
			case Const.KENSAKU_TAB_TREE:
				// -----------------
				// ツリー検索タブ
				// -----------------
				// 構造区分毎の判定
				switch (true) {
					case isKozoKbnTree(dtlInfo.searchJoken.type):
						// ツリー
						switch (sosaKbn) {
							case Const.SOSA_LOG_SOSA_KBN_LIST:
								// 一覧情報取得処理
								sosaDtlKbn = Const.SOSA_LOG_SOSA_DTL_KBN_TREE_SEARCH_TREE;
								break;
							case Const.SOSA_LOG_SOSA_KBN_CSV:
								// CSV出力処理
								sosaDtlKbn = Const.SOSA_LOG_SOSA_DTL_KBN_CSV_OUTPUT_TREE_SEARCH_TREE_RESULT;
								break;
						}
						break;
					case isKozoKbnFolder(dtlInfo.searchJoken.type):
						// フォルダ
						switch (sosaKbn) {
							case Const.SOSA_LOG_SOSA_KBN_LIST:
								// 一覧情報取得処理
								sosaDtlKbn = Const.SOSA_LOG_SOSA_DTL_KBN_TREE_SEARCH_FOLDER;
								break;
							case Const.SOSA_LOG_SOSA_KBN_CSV:
								// CSV出力処理
								sosaDtlKbn = Const.SOSA_LOG_SOSA_DTL_KBN_CSV_OUTPUT_TREE_SEARCH_FOLDER_RESULT;
								break;
						}
						break;
					case isKozoKbnStar(dtlInfo.searchJoken.type):
						// スター検索
						switch (sosaKbn) {
							case Const.SOSA_LOG_SOSA_KBN_LIST:
								// 一覧情報取得処理
								sosaDtlKbn = Const.SOSA_LOG_SOSA_DTL_KBN_TREE_SEARCH_STAR;
								break;
							case Const.SOSA_LOG_SOSA_KBN_CSV:
								// CSV出力処理
								sosaDtlKbn = Const.SOSA_LOG_SOSA_DTL_KBN_CSV_OUTPUT_TREE_SEARCH_STAR_RESULT;
								break;
						}
						break;
					case isKozoKbnJoken(dtlInfo.searchJoken.type):
						// 保存条件
						switch (sosaKbn) {
							case Const.SOSA_LOG_SOSA_KBN_LIST:
								// 一覧情報取得処理
								sosaDtlKbn = Const.SOSA_LOG_SOSA_DTL_KBN_TREE_SEARCH_SAVE;
								break;
							case Const.SOSA_LOG_SOSA_KBN_CSV:
								// CSV出力処理
								sosaDtlKbn = Const.SOSA_LOG_SOSA_DTL_KBN_CSV_OUTPUT_TREE_SEARCH_SAVE_RESULT;
								break;
						}
						break;
					case isKozoKbnTrashBox(dtlInfo.searchJoken.type):
						// ゴミ箱の場合 処理なし
						break;
				}
				break;
			case Const.KENSAKU_TAB_ZOKUSEI:
				// -----------------
				// 属性検索タブ
				// -----------------
				switch (sosaKbn) {
					case Const.SOSA_LOG_SOSA_KBN_LIST:
						// 一覧情報取得処理
						sosaDtlKbn = Const.SOSA_LOG_SOSA_DTL_KBN_ATTRIBUTE_SEARCH;
						break;
					case Const.SOSA_LOG_SOSA_KBN_CSV:
						// CSV出力処理
						sosaDtlKbn = Const.SOSA_LOG_SOSA_DTL_KBN_CSV_OUTPUT_ATTRIBUTE_SEARCH_RESULT;
						break;
				}
				break;
		}

		return sosaDtlKbn;
	}

	// 属性編集-文書種対応
	// 文書種切り替えによる非表示になった属性入力内容を保持
	var updateZokuseiListAll = function($scope) {
		// 入力済みの内容を保持
		angular.forEach($scope.$parent.detailAreaData.zokuseiList, function(zokusei) {
			for (var idx in $scope.$parent.detailAreaData.zokuseiListAll) {
				if (zokusei.zokuseiId != null &&
					($scope.$parent.detailAreaData.zokuseiListAll[idx].zokuseiId == zokusei.zokuseiId ||
						$scope.$parent.detailAreaData.zokuseiListAll[idx].id == zokusei.zokuseiId)) {
					$scope.$parent.detailAreaData.zokuseiListAll[idx] = zokusei;
					break;
				}
			}
		});
		// 文書種設定
		angular.forEach($scope.$parent.detailAreaData.zokuseiListAll, function(zokusei) {
			if (zokusei.kihonZokuseiSbt == Const.KIHON_ZOKUSEI_SBT_BUNSHOSHU) {
				zokusei.zokuseiId = zokusei.id;
				zokusei.kbn = $scope.$parent.detailAreaData.bunshoshuId;
			}
		});
	};

	// 検索とワークフロー間のタブ移動時、 詳細エリアとの境のバーの再描画処理
	var reDrawCenterLine = function(listData, listClosed) {
		// データがnull(初期表示)、または一覧データが存在しない場合
		if (listData == null || listData.length == 0) {
			// 境のバーを非表示
			myLayout.children.center.layout1.hide('north');
		} else if (listData.length > 0) {
			// 既に表示されている場合は、表示処理の中で開閉状態を復元する
			if (myLayout.children.center.layout1.north.state.isHidden) {
				// 一覧エリアの開閉状態を適用
				if (listClosed) {
					myLayout.children.center.layout1.show('north', false);
				} else {
					myLayout.children.center.layout1.show('north');
				}
			} else {
				// 一覧エリアの開閉状態を適用
				if (listClosed) {
					myLayout.children.center.layout1.close('north');
				} else {
					myLayout.children.center.layout1.open('north');
				}
			}
		}
	}

	// 詳細エリアとの境のバーの表示状態を保存
	var setListClosedFlg = function($scope, closedFlg) {
		if (isActiveTabWorkflow($scope)) {
			// ワークフロー検索タブの場合
			$scope.$parent.workflowListClosed = closedFlg;
		} else {
			// 検索タブの場合
			$scope.$parent.fileListClosed = closedFlg;
		}
	}

	// 構成図面含む/含まない情報取得
	var getKoseiInfo = function(kbn) {
		var koseiInfo = {};
		// 構成図面フラグ
		koseiInfo.koseiFlg = false;
		// API用ダウンロード区分
		koseiInfo.paramKbn = kbn;
		// 「構成図面含む」場合、フラグを true 区分を含まない時と統一する
		if (koseiInfo.paramKbn == Const.DOWNLOAD_KBN_ALL_KOSEI) {
			koseiInfo.paramKbn = Const.DOWNLOAD_KBN_ALL;
			koseiInfo.koseiFlg = true;
		} else if (koseiInfo.paramKbn == Const.DOWNLOAD_KBN_ORIGINAL_KOSEI) {
			koseiInfo.paramKbn = Const.DOWNLOAD_KBN_ORIGINAL;
			koseiInfo.koseiFlg = true;
		} else if (koseiInfo.paramKbn == Const.DOWNLOAD_KBN_PDF_KOSEI) {
			koseiInfo.paramKbn = Const.DOWNLOAD_KBN_PDF;
			koseiInfo.koseiFlg = true;
		}
		return koseiInfo;
	}

	// パスワード情報をリストに設定
	var setPdfPassword = function(dataList, pwDataList) {
		for (var idx in dataList) {
			var data = dataList[idx];
			if (!data.userPasswordFlg) {
				// ユーザパスワードが未設定の場合次データ
				continue;
			}
			for (var idxPw in pwDataList) {
				var pwData = pwDataList[idxPw];
				if (pwData.fileId != data.fileId) {
					continue;
				}
				if (pwData.hanKanriIdList && pwData.hanKanriIdList.indexOf(data.hanKanriId) == -1) {
					// ファイルIDが異なる 又は 版管理IDが含まれない場合次データ
					continue;
				}
				// パスワードをセット
				data.userPassword = pwData.userPassword;
				break;
			}
		}
	}

	// 印刷正常処理
	var printSuccess = function($scope, resolveData, id) {
		var param = {
			fileInfo: resolveData,
			oinId: id || 0,
			sosaDtlKbn: isActiveTabWorkflow($scope) ? Const.SOSA_LOG_SOSA_DTL_KBN_PRINT_WORKFLOW_LIST : Const.SOSA_LOG_SOSA_DTL_KBN_PRINT_FILE_LIST
		}
		StorageService.setParameter(Const.PATH_PRINT_PREVIEW, param);
		$location.path(Const.PATH_PRINT_PREVIEW);
	}

	// 印刷エラー処理
	var printError = function($scope, resolveData, dtlInfo, sosaDtlKbn, listData) {
		// エラーが１件以上存在
		CommonService.errorProcess($scope, resolveData, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_PRINT, dtlInfo, sosaDtlKbn)
			.then(
				function() {
					// 一覧エラー設定
					if (isActiveTabWorkflow($scope)) {
						setWorkflowListErrorInfo($scope, resolveData.errorInfo.details);
					} else {
						setListErrorInfo($scope, listData, resolveData.errorInfo.details);
					}
				}
			);
	}

	// システムメジャー版番号が重複する行を取得する
	var getHanNoMajorOverlapIndex = function(list, target) {
		for (var idx = 0; idx < list.length; idx++) {
			if (list[idx]['fileId'] == target['fileId']
				&& list[idx]['sysHanNoMajor'] == target['sysHanNoMajor']) {
				// ファイルID 及び システムメジャー版番号が等しい場合、行数を返す
 				return idx;
			}
		}
		// 重複がなかった場合 null
		return null;
	}

	// ファイル存在フラグをセット
	var setExistErrFlg = function(data) {
		var deferred = $.Deferred();
		// ファイル存在確認
		var promise = CommonService.checkUploadFileExists(data.file);
		promise.then(
			function() {
				// ファイル有
				deferred.resolve();
			},
			function() {
				// ファイル無しの場合エラーフラグを true に変更
				data.existErrFlg = true;
				deferred.resolve();
			}
		);
		return deferred.promise();
	};

	// 検索条件：名前を変更ボタン処理
	var kensakuJokenNameChange = function($scope) {
		// 対象データの取得
		var zokuseiKensakuWork = angular.copy($scope.$parent.selectedBranch);
		// 不要項目の削除
		deleteTreeFixedItem(zokuseiKensakuWork);
		$scope.modal = {
			'branch': zokuseiKensakuWork
		}
		// 検索条件入力
		var template = "app/kensaku-joken-name-change/kensaku-joken-name-change.html";
		var controller = "KensakuJokenNameChangeController";
		var promise = CommonService.openModal($scope, template, controller);
		promise.then(
			function(result) {
				// 検索条件名変更成功処理
				$scope.onRefresh(Const.GET_KENSAKU_TAB_PATTERN_TREE);
			}
		);
	}

	// 検索条件：条件を削除ボタン処理
	var kensakuJokenDelete = function($scope) {
		// 対象データの取得
		var zokuseiKensakuWork = angular.copy($scope.$parent.selectedBranch);
		// 不要項目の削除
		deleteTreeFixedItem(zokuseiKensakuWork);
		// 通信用パラメータの設定
		$scope.param = {
			'langKey': CommonService.getLanguageKey($scope),
			'data': zokuseiKensakuWork
		};
		// 初期情報の取得
		CommonService.httpModal($scope, ACTION_ATTR_DELETE, $scope.param, true,
			function(resolveData) {
				// 成功処理
				if (!CommonService.isError(resolveData)) {
					getSearchAreaData($scope, Const.GET_KENSAKU_TAB_PATTERN_TREE);
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

	// 公開時間のクリア処理
	var clearKokaiTime = function($scope, emptyFlg) {
		// ※time の値が不正値の場合に「見た目は値アリ」「でも変数はnull」という状態が発生する
		// よって、『空の状態』にしたい時も、見た目と変数値がクリアされる様に、一旦ダミーの値を入れています。
		$scope.$parent.detailAreaData.kokaiTimestamp.time = new Date(1970, 0, 1);
		if (emptyFlg) {
			$timeout(function() {
				$scope.$parent.detailAreaData.kokaiTimestamp.time = null;
			});
		}
	};

	// 表示用公開日時の値変更処理
	var changeDispKokaiTimestamp = function(kokaiTimestamp) {
		if (CommonService.isEmpty(kokaiTimestamp.date)
			&& CommonService.isEmpty(kokaiTimestamp.time)) {
			// 値をクリア
			kokaiTimestamp.dispTimestamp = "";
		} else if (!CommonService.isEmpty(kokaiTimestamp.date)
			&& !CommonService.isEmpty(kokaiTimestamp.time)) {
			// 入力された内容に変更
			kokaiTimestamp.dispTimestamp = kokaiTimestamp.date + CommonService.formatDate.format(kokaiTimestamp.time, " hh:mm");
		}
	};

	return {
		// 画面構成設定
		setLayout: function($scope) {
			// ユーザ情報の登録
			if (CommonService.getUserInfo()) {
				StorageService.setData('userInfo', CommonService.getUserInfo());
			}
			var userInfo = StorageService.getData('userInfo');
			// ユーザ情報が存在しない場合、空にする。
			if (!userInfo) {
				userInfo = [];
			}
			// Internet Explorer
			isIE = CommonService.isIE();
			// FireFox
			isFF = CommonService.isFirefox();
			// ボタンツールバーサイズ
			var btnToolbarSize = isIE ? Const.BTN_TOOLBAR_SIZE_IE : Const.BTN_TOOLBAR_SIZE;
			// ワークフロー情報エリアレイアウト設定
			var innerLayoutDetailWorkflow = {
				togglerContent_open: '<span class="glyphicon glyphicon-chevron-left resizer-icon-left resizer-icon-open"></span>',
				togglerContent_closed: '<span class="glyphicon glyphicon-chevron-right resizer-icon-right resizer-icon-closed"></span>',
				west: {
					paneSelector: '.pane-workflow-info',
					spacing_open: Const.RESIZER_SPACING_OPEN,
					spacing_closed: Const.RESIZER_SPACING_CLOSED,
					size: setPainSize(userInfo[Const.USER_SETTEI_PANE_RITSU_DW]),
					minSize: setPainSize(Const.RESIZER_MIN_SIZE),
					onresize: function(pane, $pane, state, options) {
						// 割合を計算
						var width = $('.pane-detail-parent').width() - Const.RESIZER_SPACING_OPEN;
						var percentage = Math.round((state.css.width / width) * 100);
						// ユーザ設定情報にセット
						CommonService.setUserSettei(Const.USER_SETTEI_PANE_RITSU_DW, percentage);
					}
				},
				center: {
					paneSelector: '.pane-workflow-status'
				}
			};
			// 詳細エリアレイアウト設定
			var innerLayoutDetail = {
				togglerContent_open: '<span class="glyphicon glyphicon-chevron-left resizer-icon-left resizer-icon-open"></span>',
				togglerContent_closed: '<span class="glyphicon glyphicon-chevron-right resizer-icon-right resizer-icon-closed"></span>',
				west: {
					paneSelector: '.pane-second-other',
					showOverflowOnHover: true,
					spacing_open: Const.RESIZER_SPACING_OPEN,
					spacing_closed: Const.RESIZER_SPACING_CLOSED,
					ondrag_start: function() { CommonService.previewAreaCheck(true); },
					ondrag_end: function() { CommonService.previewAreaCheck(false); },
					size: setPainSize(userInfo[Const.USER_SETTEI_PANE_RITSU_DW]),
					minSize: setPainSize(Const.RESIZER_MIN_SIZE),
					onresize: function(pane, $pane, state, options) {
						// 割合を計算
						var width = $('.pane-detail-parent').width() - Const.RESIZER_SPACING_OPEN;
						var percentage = Math.round((state.css.width / width) * 100);
						// ユーザ設定情報にセット
						CommonService.setUserSettei(Const.USER_SETTEI_PANE_RITSU_DW, percentage);
					},
					onopen_end: function() { if ($('.pane-second-other').zIndex() > 0) CommonService.previewAreaCheck(true); },
					onclose_end: function() { CommonService.previewAreaCheck(false); },
					childOptions: {
						togglerContent_open: '<span class="glyphicon glyphicon-chevron-down resizer-icon-down resizer-icon-open"></span>',
						togglerContent_closed: '<span class="glyphicon glyphicon-chevron-up comment-toggle resizer-icon-closed"></span>',
						center: {
							paneSelector: '.pane-detail',
							showOverflowOnHover: true,
							childOptions: {
								center: {
									paneSelector: '.pane-detail-body'
								},
								south: {
									paneSelector: '.pane-detail-toolbar',
									size: "auto",
									minSize: btnToolbarSize,
									resizable: false,
									slidable: false,
									closable: false,
									spacing_open: 0,
									showOverflowOnHover: true
								}
							}
						},
						south: {
							paneSelector: '.pane-comment',
							size: .70,
							minSize: setPainSize(Const.RESIZER_MIN_SIZE),
							spacing_open: Const.RESIZER_SPACING_OPEN,
							spacing_closed: Const.RESIZER_SPACING_CLOSED,
							initClosed: true,
							childOptions: {
								center: {
									paneSelector: '.pane-comment-body'
								},
								north: {
									paneSelector: '.pane-comment-toolbar-top',
									size: 58,
									resizable: false,
									slidable: false,
									closable: false,
									spacing_open: 0,
									showOverflowOnHover: true
								},
								south: {
									paneSelector: '.pane-comment-toolbar-bottom',
									size: "auto",
									minSize: btnToolbarSize,
									resizable: false,
									slidable: false,
									closable: false,
									spacing_open: 0,
									showOverflowOnHover: true
								}
							}
						}
					}
				},
				center: {
					paneSelector: '.pane-preview'
				}
			};
			// メインレイアウト設定
			var mainLayout = {
				togglerContent_open: '<span class="glyphicon glyphicon-chevron-left resizer-icon-left resizer-icon-open"></span>',
				togglerContent_closed: '<span class="glyphicon glyphicon-chevron-right resizer-icon-right resizer-icon-closed"></span>',
				west: {
					paneSelector: '.pane-serach',
					spacing_open: Const.RESIZER_SPACING_OPEN,
					spacing_closed: Const.RESIZER_SPACING_CLOSED,
					size: setPainSize(userInfo[Const.USER_SETTEI_PANE_RITSU_KW]),
					minSize: setPainSize(Const.RESIZER_MIN_SIZE),
					onresize: function(pane, $pane, state, options) {
						// 割合を計算
						var width = $('#main-layout').width() - Const.RESIZER_SPACING_OPEN;
						var percentage = Math.round((state.css.width / width) * 100);
						// ユーザ設定情報にセット
						CommonService.setUserSettei(Const.USER_SETTEI_PANE_RITSU_KW, percentage);
					},
					onopen_end: function() { if ($('.pane-serach').zIndex() > 0) CommonService.previewAreaCheck(true); },
					onclose_end: function() { CommonService.previewAreaCheck(false); },
					childOptions: {
						south: {
							paneSelector: '.pane-serach-toolbar',
							showOverflowOnHover: true,
							size: "auto",
							minSize: btnToolbarSize,
							resizable: false,
							slidable: false,
							closable: false,
							spacing_open: 0
						},
						center: {
							paneSelector: '.pane-serach-body'
						}
					}
				},
				center: {
					paneSelector: '.pane-first-other',
					childOptions: {
						togglerContent_open: '<span class="glyphicon glyphicon-chevron-up resizer-icon-up resizer-icon-open"></span>',
						togglerContent_closed: '<span class="glyphicon glyphicon-chevron-down resizer-icon-down resizer-icon-closed"></span>',
						north: {
							paneSelector: '.pane-list',
							spacing_open: Const.RESIZER_SPACING_OPEN,
							spacing_closed: Const.RESIZER_SPACING_CLOSED,
							showOverflowOnHover: true,
							size: setPainSize(userInfo[Const.USER_SETTEI_PANE_RITSU_IH]),
							minSize: setPainSize(Const.RESIZER_MIN_SIZE),
							onresize: function(pane, $pane, state, options) {
								// 割合を計算
								var height = $('#main-layout').height() - Const.RESIZER_SPACING_OPEN;
								var percentage = Math.round((state.css.height / height) * 100);
								// ユーザ設定情報にセット
								CommonService.setUserSettei(Const.USER_SETTEI_PANE_RITSU_IH, percentage);
							},
							onopen_end: function() {
								if ($('.pane-list').zIndex() > 0) CommonService.previewAreaCheck(true);
								if (isActiveTabWorkflow($scope)) {
									// ワークフロー一覧表示処理
									workflowListScroll($scope);
								} else {
									// ファイル一覧表示処理
									fileListScroll($scope);
								}
								setListClosedFlg($scope, false);
							},
							onclose_end: function() {
								CommonService.previewAreaCheck(false);
								setListClosedFlg($scope, true);
							},
							ondrag_start: function() { CommonService.previewAreaCheck(true); },
							ondrag_end: function() { CommonService.previewAreaCheck(false); },
							childOptions: {
								center: {
									paneSelector: '.pane-list-body',
									onresize: function (pane, $pane, state, options) {
										$('.grid').css('height', state.innerHeight + 'px');
									}
								},
								south: {
									paneSelector: '.pane-list-toolbar-bottom',
									showOverflowOnHover: true,
									size: "auto",
									minSize: btnToolbarSize,
									resizable: false,
									slidable: false,
									closable: false,
									spacing_open: 0
								},
								north: {
									paneSelector: '.pane-list-toolbar-top',
									size: "auto",
									minSize: btnToolbarSize,
									resizable: false,
									slidable: false,
									closable: false,
									spacing_open: 0
								}
							}
						},
						center: {
							paneSelector: '.pane-detail-parent'
						}
					}
				}
			};
			// メイン画面レイアウト設定
			myLayout = $('#main-layout').layout(mainLayout);
			// ファイル詳細エリアレイアウト設定
			$('#inner-layout-detail').layout(innerLayoutDetail);
			// ワークフロー詳細エリアレイアウト設定
			$('#inner-layout-detail-workflow').layout(innerLayoutDetailWorkflow);
			// 各詳細エリアの設定
			showInnerLayout(Const.LAYOUT_DETAIL_WORKFLOW);
			showInnerLayout(Const.LAYOUT_DETAIL_FILE);
			// ローディングを非表示
			$("#loading").hide();
		},
		// 初期処理
		init: function($scope) {
			// 初期処理
			this.initData($scope);
			// 初期化処理が終わっていない場合、初期処理を行う
			if (!$scope.$parent.initialized) {
				// 一覧エリア表示設定(リスト表示)
				$scope.$parent.dispList = true;
				// デフォルトタブ設定
				if (!$scope.$parent.searchAreaTabs) {
					$scope.$parent.searchAreaTabs = [
						{active: false},
						{active: false},
						{active: false},
						{active: false}
					];
				}
				// データの取得
				getSearchAreaData($scope);
			} else {
				// ファイル一覧データ設定
				if ($scope.$parent.listAreaZokuseiList) {
					setFileListColumnDefs($scope, $scope.fileList_gridOptions, $scope.$parent.listAreaZokuseiList, $scope.$parent.listAreafixedColName);
					if ($scope.$parent.fileListGridData) {
						$scope.fileList_gridOptions.data = $scope.$parent.fileListGridData;
					}
				}
				// データの取得
				getSearchAreaData($scope, Const.GET_KENSAKU_TAB_PATTERN_REDISPLAY);
			}
		},
		// データ初期化処理
		initData: function($scope) {
			// ストレージデータ削除
			StorageService.deleteData('headerNonCheckErrorCnt');
			StorageService.deleteData('workflowShinseiData');
			// 検索エリア初期処理
			initSearchAreaData($scope);
			// 一覧エリア初期処理
			initListAreaData($scope);
			// 詳細エリアの初期化
			initDetailAreaData($scope);
			// コメントエリアの初期化
			initComentAreaData($scope);
			// プレビューエリアの初期化
			initPreviewAreaData($scope);
			// ワークフロー一覧エリア初期処理
			initWorkflowListAreaData($scope);
			// ワークフロー申請情報エリア初期化処理
			initWorkflowShinseiInfoArea($scope);
			// ワークフロー進行状況エリア初期化処理
			initWorkflowProgressState($scope);
		},
		// ワークフロータブ表示チェック
		checkWorkflowTabVisible: function($scope) {
			// オプション：ワークフロー（有） 且つ 機能制限：ワークフロー検索（ON） の場合
			return (CommonService.getOption($scope, Const.OPTION_SBT_WORKFLOW) &&
					CommonService.getKinoSeigen($scope, Const.KINO_SBT_SEARCH_WORKFLOW));
		},
		// ツリータブ表示チェック
		checkTreeTabVisible: function($scope) {
			// 機能制限：ツリー検索（ON） の場合
			return (CommonService.getKinoSeigen($scope, Const.KINO_SBT_SEARCH_TREE));
		},
		// 属性タブ表示チェック
		checkZokuseiTabVisible: function($scope) {
			// 機能制限：属性検索（ON） の場合
			return (CommonService.getKinoSeigen($scope, Const.KINO_SBT_SEARCH_ATTRIBUTE));
		},
		// 全文検索タブ表示チェック
		checkZenbunTabVisible: function($scope) {
			// 機能制限：全文検索（ON） の場合
			return (CommonService.getOption($scope, Const.OPTION_SBT_FULL_TEXT_SEARCH) &&
					CommonService.getKinoSeigen($scope, Const.KINO_SBT_SEARCH_FULL_TEXT));
		},
		// 初期表示タブ設定
		setDefalutTab: function($scope) {
			var tabIndex = null;
			if (this.checkWorkflowTabVisible($scope) && ($scope.$parent.cntWorkflowSendback > 0 || $scope.$parent.cntWorkflowWating > 0 || $scope.$parent.cntProcessorInvalid > 0)) {
				tabIndex = Const.KENSAKU_TAB_WORKFLOW;
			} else if (this.checkTreeTabVisible($scope)) {
				tabIndex = Const.KENSAKU_TAB_TREE;
			} else if (this.checkZokuseiTabVisible($scope)) {
				tabIndex = Const.KENSAKU_TAB_ZOKUSEI;
			} else if (this.checkWorkflowTabVisible($scope)) {
				tabIndex = Const.KENSAKU_TAB_WORKFLOW;
			} else if (this.checkZenbunTabVisible($scope)) {
				tabIndex = Const.KENSAKU_TAB_ZENBUN;
			}
			// デフォルトタブ設定
			$scope.$parent.activeTabIndex = tabIndex;
			// 検索タブ設定処理
			this.selectKensakuTab($scope, tabIndex);
		},
		// 検索タブ選択処理
		selectKensakuTab: function($scope, tabIndex) {
			// ワークフロー検索タブ選択　且つ 申請ファイル未選択 の場合のみワークフロー詳細レイアウトを設定
			if (tabIndex == Const.KENSAKU_TAB_WORKFLOW && !$scope.$parent.shinseiHashKey) {
				var layout = Const.LAYOUT_DETAIL_WORKFLOW;
			} else {
				var layout = Const.LAYOUT_DETAIL_FILE;
			}
			// 検索タブ設定
			angular.forEach($scope.$parent.searchAreaTabs, function(tab, index) {
				if (index == tabIndex) {
					tab.active = true;
				} else {
					tab.active = false;
				}
			});
			// タブ毎の情報の設定
			if ($scope.$parent.activeTabIndex == Const.KENSAKU_TAB_WORKFLOW && !isActiveTabWorkflow($scope)) {
				// ワークフロータブ ⇒ その他タブ
				// ページング情報の設定
				$scope.$parent.workflowListPagination = angular.copy($scope.$parent.pagination);
				$scope.$parent.pagination = angular.copy($scope.$parent.fileListPagination);
				// ファイル詳細情報の設定
				$scope.$parent.workflowDetailAreaData = angular.copy($scope.$parent.detailAreaData);
				$scope.$parent.detailAreaData = angular.copy($scope.$parent.fileDetailAreaData);
				// 一覧選択情報
				$scope.$parent.workflowListAreaSelectData = angular.copy($scope.$parent.listAreaSelectData);
				$scope.$parent.listAreaSelectData = angular.copy($scope.$parent.fileListAreaSelectData);
				// 一覧エリアの開閉状態の設定
				$scope.$parent.workflowListClosed = myLayout.children.center.layout1.north.state.isClosed;
				// 詳細エリアとの境のバーを再描画
				reDrawCenterLine($scope.fileList_gridOptions.data, $scope.$parent.fileListClosed);
				// 一覧の再描写
				if ($scope.$parent.fileListClosed) {
					$timeout(function() { fileListScroll($scope); }, 300);
				}
			} else if ($scope.$parent.activeTabIndex != Const.KENSAKU_TAB_WORKFLOW && isActiveTabWorkflow($scope)) {
				// その他タブ ⇒ ワークフロータブ
				// ページング情報の設定
				$scope.$parent.fileListPagination = angular.copy($scope.$parent.pagination);
				$scope.$parent.pagination = angular.copy($scope.$parent.workflowListPagination);
				// ファイル詳細情報の設定
				$scope.$parent.fileDetailAreaData = angular.copy($scope.$parent.detailAreaData);
				$scope.$parent.detailAreaData = angular.copy($scope.$parent.workflowDetailAreaData);
				// 一覧選択情報
				$scope.$parent.fileListAreaSelectData = angular.copy($scope.$parent.listAreaSelectData);
				$scope.$parent.listAreaSelectData = angular.copy($scope.$parent.workflowListAreaSelectData);
				// 一覧エリアの開閉状態の設定
				$scope.$parent.fileListClosed = myLayout.children.center.layout1.north.state.isClosed;
				// 詳細エリアとの境のバーを再描画
				reDrawCenterLine($scope.$parent.workflowListData, $scope.$parent.workflowListClosed);
				// 一覧の再描写
				if ($scope.$parent.workflowListClosed) {
					$timeout(function() { workflowListScroll($scope); }, 300);
				}
			}
			// 選択タブの設定
			$scope.$parent.activeTabIndex = tabIndex;
			// 詳細エリアの設定
			showInnerLayout(layout);
			// 一覧の高さ調整
			$timeout(function() {
				var height = $('.pane-list-body').height();
				$('.grid').css('height', height + 'px');
			});
			// 一覧が選択されていた場合、プレビューの取得
			if ($scope.$parent.listAreaSelectData) {
				if (isActiveTabWorkflow($scope)) {
					var fileId = $scope.$parent.listAreaSelectData.fileId;
				} else {
					var fileId = $scope.$parent.listAreaSelectData.id;
				}
				var workflowId = $scope.$parent.listAreaSelectData.workflowId;
				// プレビュー用PDF取得
				if (fileId) {
					getPdfFile($scope, fileId, workflowId);
				}
			}
		},
		// 『検索エリア』-「ワークフロー検索」リスト押下処理
		selectWorkflow: function($scope, kbn) {
			// ワークフローリストデータ取得
			$scope.$parent.workflowSelectedKbn = kbn;
			// 検索情報の作成
			var searchJoken = {};
			searchJoken.kbn = kbn;
			// 検索エリアからの検索処理
			this.getListDataFirst($scope, searchJoken);
		},
		// 『検索エリア』-「ツリー検索」リスト押下処理
		selectTree: function($scope, index) {
			// アクティブコントローラの初期化
			$scope.$parent.activeController = null;
			// ツリー表示情報制御
			angular.forEach($scope.$parent.treeSearchView, function(tree, i) {
				if (i == index) {
					// 選択ツリーのコントローラを設定
					$scope.$parent.activeController = tree.controller;
					clearSelectBranch(tree.data, tree.controller.get_selected_branch());
				} else {
					// 選択ツリー以外の選択状態をクリア
					tree.controller.select_branch(null);
					clearSelectBranch(tree.data);
				}
			});
			// 検索条件（名前を変更・条件を削除）ボタンを非活性化
			$scope.$parent.kensakuJokenDisabled = true;
			// コントローラチェック
			var controller = $scope.$parent.activeController;
			if (!controller) { return; }
			// 選択データの取得
			var branch = controller.get_selected_branch();
			// 選択データの保持
			$scope.$parent.selectedBranch = angular.copy(branch);
			// 検索が必要無い場合（検索条件トップ）
			if (branch.noSearch) { return; }
			// 検索情報の作成
			var searchJoken = {};
			if (isKozoKbnTree(controller.type)) {
				// ツリーの場合

				// ツリーIDの設定
				searchJoken.id = branch.treeHyojiId;
				// ツリー表示条件の設定
				searchJoken.treeHyojiJoken = getParentTreeHyojiJoken(controller, branch);
				// 階層番号の設定
				searchJoken.no = branch.no ? branch.no : 1;
				// アップロード用属性情報の設定
				searchJoken.uploadInitialValue = branch.uploadInitialValue;
				// 属性情報の取得
				searchJoken.zokuseiData = getParentZokuseiData(controller, branch);
				// 条件式情報の取得
				searchJoken.jokenshikiData = getParentJokenshikiData(controller, branch);
				// 表示階層タイプ区分の取得
				searchJoken.hyojiKaisoTypeKbn = getParentHyojiKaisoTypeKbn(controller, branch);

				// データ取得区分の設定
				searchJoken.dataFetchKbn = Const.TREE_DATA_FETCH_KBN_TREE;
				if (searchJoken.no > Const.TREE_SEARCH_POSITION_TOP && branch.clickPlaceKbn == Const.TREE_CLICK_PLACE_KBN_NAME) {
					// 2階層目以降の場合、子階層データ及び一覧データを取得
					searchJoken.dataFetchKbn = Const.TREE_DATA_FETCH_KBN_ALL;
				}
				
			} else if (isKozoKbnFolder(controller.type)) {
				// フォルダーの場合

				// 最下層以外のアイコン部をクリックした場合、検索処理を行わない。
				if (branch.clickPlaceKbn == Const.TREE_CLICK_PLACE_KBN_ICON && branch.children.length > 0) {
					return;
				}
				// ツリーIDの設定
				searchJoken.id = branch.treeHyojiId;
				// 階層番号の設定
				searchJoken.no = branch.no ? branch.no : 0;
				// 属性情報の取得
				searchJoken.zokuseiData = getZokuseiData(controller, branch);
				// データ取得区分の設定
				searchJoken.dataFetchKbn = Const.TREE_DATA_FETCH_KBN_DATA;
			} else if (isKozoKbnStar(controller.type)) {
				// スターの場合 処理なし
			} else if (isKozoKbnJoken(controller.type)) {
				// 検索条件の場合

				// 属性検索ワークの設定
				searchJoken.zokuseiKensakuWork = deleteTreeFixedItem(angular.copy(branch));

				// 保存条件に合わせて一覧文書種プルダウン変更
				$scope.$parent.bunshoshu = null;
				angular.forEach(searchJoken.zokuseiKensakuWork.choicesList, function(choice) {
					if ($scope.$parent.bunshoshuZokusei.id == choice.zokuseiId) {
						$scope.$parent.bunshoshu = choice.kensakuValSentakushi[0];
						return;
					}
				});
				// 検索条件（名前を変更・条件を削除）ボタンを活性化
				$scope.$parent.kensakuJokenDisabled = false;
			} else if (isKozoKbnTrashBox(controller.type)) {
				// ゴミ箱の場合 処理なし
			}
			// 選択タブの設定
			searchJoken.tab = Const.KENSAKU_TAB_TREE;
			// ツリータイプの設定
			searchJoken.type = controller.type;
			// 検索エリアからの検索処理
			this.getListDataFirst($scope, searchJoken);
		},
		// 『検索エリア』-「ツリー検索」コンテキスト（右クリック）メニュー設定
		getMenuOptions: function($scope) {
			var menu = [];
			var controller = $scope.$parent.activeController;
			if (!controller) {
				// コントローラが設定されていない場合
				return [];
			}
			// 選択行の取得
			var branch = controller.get_selected_branch();
			if (isKozoKbnTree(controller.type) || isKozoKbnFolder(controller.type)) {
				// ツリー 又は フォルダー の場合
				if (CommonService.getKinoSeigen($scope, Const.KINO_SBT_IO_FILE_UPLOAD)) {
					menu.push([
						$translate.instant("upload"),
						function ($itemScope) {
							// 引き渡し用データの取得
							StorageService.setData('uploadDefaultZokuseiData', branch.uploadInitialValue);
							// 「アップロード画面」に遷移
							$location.path(Const.PATH_UPLOAD);
						}
					]);
				}
			} else if (isKozoKbnJoken(controller.type) && !branch.noSearch) {
				menu = [
					[
						$translate.instant("name_change"),
						function ($itemScope) {
							kensakuJokenNameChange($scope);
						}
					],
					[
						$translate.instant("joken_delete"),
						function ($itemScope) {
							kensakuJokenDelete($scope);
						}
					]
				];
			}
			return menu;
		},
		// 『検索エリア』 - 「名前を変更」ボタン押下処理
		onKensakuJokenNameChange: function($scope) {
			kensakuJokenNameChange($scope)
		},
		// 『検索エリア』 - 「条件を削除」ボタン押下処理
		onKensakuJokenDelete: function($scope) {
			// 確認メッセージ
			var promise = CommonService.dispMessage($scope, 'Q00001', ['jokenDelete']);
			promise.then(
				function(result) {
					kensakuJokenDelete($scope)
				}
			);
		},
		// 『検索エリア』 - 「文書種」ブルダウン変更処理
		changeBunshoshuZokusei: function($scope) {
			// 変更前の属性一覧を保持
			var zokuseiPrev = angular.copy($scope.$parent.zokusei);

			// 通信用パラメータの設定
			var param = {
				'langKey': CommonService.getLanguageKey($scope),
				'patterns': "attribute",
				'bunshoshuId': $scope.$parent.searchAreaData.bunshoshu
			};
			// 初期情報の取得
			CommonService.httpModal($scope, ACTION, param, true,
				function(resolveData) {
					// 成功処理
					if (!CommonService.isError(resolveData)) {
						// 属性検索設定
						$scope.$parent.zokusei = resolveData.zokusei;
						angular.forEach($scope.$parent.zokusei, function(zokuseiData) {
							if (ZokuseiSearchService.isZokuseiDataTypeKbnFlg(zokuseiData.dataTypeKbn)) {
								// フラグの場合、初期値を設定
								zokuseiData.kensakuJokenString = "null";
							}
						});
						// 変更前の属性がある場合は、その属性を設定（検索値保持）
						for (var lp = 0; lp < $scope.$parent.zokusei.length; lp++) {
							angular.forEach(zokuseiPrev, function(prev) {
								if ($scope.$parent.zokusei[lp].id == prev.id) {
									$scope.$parent.zokusei[lp] = prev;
									return;
								}
							});
						}
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
		},
		// 『検索エリア』-「属性検索」リスト押下処理
		selectZokusei: function($scope, index) {
			var zokuseiInfo = null;
			switch (index) {
				case ZOKUSEI_SEARCH_FILE_ID:
					zokuseiInfo = $scope.$parent.searchAreaData.fileId;
					break;
				case ZOKUSEI_SEARCH_CHECK_OUT_USER:
					zokuseiInfo = $scope.$parent.searchAreaData.checkOutUser;
					break;
				default:
					zokuseiInfo = $scope.$parent.zokusei[index];
					break;
			}

			$scope.modal = {
				'dropdown': $scope.dropdown,
				'zokuseiInfo': zokuseiInfo,
				'userMaster': $scope.userMaster,
				'bunshoshuList': $scope.$parent.bunshoshuList
			}
			// 検索条件入力
			var template = 'app/zokusei/zokusei.html';
			var controller = 'ZokuseiController';
			var promise = CommonService.openModal($scope, template, controller);
			promise.then(
				function(result) {
					// 検索条件入力成功処理
					switch (index) {
						case ZOKUSEI_SEARCH_FILE_ID:
							// ファイルIDの更新
							$scope.$parent.searchAreaData.fileId = result;
							break;
						case ZOKUSEI_SEARCH_CHECK_OUT_USER:
							// チェックアウト者の更新
							$scope.$parent.searchAreaData.checkOutUser = result;
							break;
						default:
							// 属性情報の更新
							$scope.$parent.zokusei[index] = result;
							break;
					}
				}
			);
		},
		// 「更新」ボタン押下処理
		refresh: function($scope, pattern) {
			if (isActiveTabWorkflow($scope)) {
				// 検索エリア選択状態のクリア
				$scope.$parent.workflowSelectedKbn = null;
				// 一覧エリアの初期化
				initWorkflowListAreaData($scope, true);
				// ワークフロー申請情報エリアの初期化
				initWorkflowShinseiInfoArea($scope, true);
				// ワークフロー進行状況エリアの初期化
				initWorkflowProgressState($scope, true);
				// パターン設定
				pattern = Const.GET_KENSAKU_TAB_PATTERN_WORKFLOW;
			} else {
				// 一覧エリアの初期化
				initListAreaData($scope, true);
				// 詳細エリアの初期化
				initDetailAreaData($scope, true);
				// コメントエリアの初期化
				initComentAreaData($scope, true);
				// プレビューエリアの初期化
				initPreviewAreaData($scope, true);
				// パターン設定
				pattern = Const.GET_KENSAKU_TAB_PATTERN_TREE;
			}
			// 詳細エリアとの境のバーを非表示
			myLayout.children.center.layout1.hide('north');
			// データの再取得
			getSearchAreaData($scope, pattern);
		},
		// 「検索」ボタン押下処理
		search: function($scope) {
			var searchJoken = {};
			var thisService = this;
			if (isActiveTabZokusei($scope)) {
				// 「属性検索」タブの場合
				searchJoken.tab = Const.KENSAKU_TAB_ZOKUSEI
				// 属性検索ワーク情報設定
				searchJoken.zokuseiKensakuWork = createZokuseiKensakuWork($scope);
				// 一覧エリア文書種プルダウン設定
				$scope.$parent.bunshoshu = $scope.$parent.searchAreaData.bunshoshu;
				// 検索処理
				this.getListDataFirst($scope, searchJoken);
			} else if (isActiveTabZenbun($scope)) {
				// 「全文検索」タブの場合
				searchJoken.tab = Const.KENSAKU_TAB_ZENBUN
				// 検索処理
				$timeout(function() {
					// タブ情報の設定
					searchJoken.zenbunKensakuVal = angular.copy(CommonService.tagToDb($scope.$parent.searchAreaData.zenbunKensakuVal, 'text'));
					searchJoken.zenbunKensakuAndFlg = $scope.$parent.searchAreaData.zenbunKensakuAndFlg;
					searchJoken.zenbunKensakuKanzenIcchiFlg = $scope.$parent.searchAreaData.zenbunKensakuKanzenIcchiFlg;
					searchJoken.zenbunKensakuPdfAddACharacterFlg = $scope.$parent.searchAreaData.zenbunKensakuPdfAddACharacterFlg;
					searchJoken.zenbunKensakuIncludChoiceFlg = $scope.$parent.searchAreaData.zenbunKensakuIncludChoiceFlg;
					searchJoken.zenbunKensakuIncludPdfTextOldFlg = $scope.$parent.searchAreaData.zenbunKensakuIncludPdfTextOldFlg;
					searchJoken.zenbunKensakuBunshoshu = $scope.$parent.searchAreaData.bunshoshuZenbun;
					// 一覧エリア文書種プルダウン設定
					$scope.$parent.bunshoshu = $scope.$parent.searchAreaData.bunshoshuZenbun;
					// 検索処理
					thisService.getListDataFirst($scope, searchJoken);
				}, 100);
			}
		},
		// 初期一覧データ検索
		getListDataFirst: function($scope, searchJoken) {
			// 「ツリー検索」リスト押下処理、「検索」ボタン押下処理
			// ページング情報の設定
			searchJoken.dispPage = 1;
			// 指定件数以外の場合,20を設定
			if ($scope.$parent.dataTypePage != 10 && $scope.$parent.dataTypePage != 20 && $scope.$parent.dataTypePage != 50 && $scope.$parent.dataTypePage != 100) {
				searchJoken.dispCnt = 20;
			} else {
				searchJoken.dispCnt = $scope.$parent.dataTypePage;
			}
			// 一覧ソート条件の取得
			if (isActiveTabWorkflow($scope)) {
				var search = $scope.$parent.workflowListSearchJoken;
			} else {
				var search = $scope.$parent.fileListSearchJoken;
			}

			searchJoken.sortColumn = null;
			if (search && search.sortColumn) {
				searchJoken.sortColumn = search.sortColumn;
			}

			searchJoken.sortDirection = null;
			if (search && search.sortDirection) {
				searchJoken.sortDirection = search.sortDirection;
			}

			// 文書種
			if (angular.isUndefined($scope.$parent.bunshoshu)) {
				// 初期設定
				$scope.$parent.bunshoshu = CommonService.getUserInfo(Const.USER_SETTEI_BUNSHOSHU);
			} else if (!$scope.$parent.bunshoshu) {
				// 「(条件なし)」(==null)の場合は未設定を設定
				var obj = CommonService.getBunshoshuMiSettei($scope.$parent.bunshoshuList);
				$scope.$parent.bunshoshu = obj.id;
			}

			getListData($scope, searchJoken, true);
		},
		// 「検索用CSV取込」ボタン押下処理
		kensakuCsvTorikomi: function($scope) {
			// 『検索エリア』-「検索用CSV取込」押下処理
			$scope.modal = {
				'zokusei': $scope.$parent.defaultZokusei,
				'dropdown': $scope.dropdown,
				'userMaster': $scope.userMaster,
				'fileIdZokuseiName': $scope.$parent.searchAreaData.fileId.name
			}
			// 検索用CSV取込
			var template = "app/kensaku-csv-torikomi/kensaku-csv-torikomi.html";
			var controller = "KensakuCsvTorikomiController";
			var promise = CommonService.openModal($scope, template, controller);
			promise.then(
				function(result) {
					// 検索用CSV取込成功処理
					$scope.$parent.zokusei = result.zokusei;
					$scope.$parent.searchAreaData.checkOutJoken = result.checkout;
					$scope.$parent.searchAreaData.checkOutUser.kensakuJokenString = result.checkoutUser.kensakuJokenString;
					$scope.$parent.searchAreaData.checkOutUser.work = result.checkoutUser.work;
					$scope.$parent.searchAreaData.bunshoshu = result.bunshoshu;
					$scope.$parent.searchAreaData.fileId.kensakuJokenString = result.fileId.kensakuJokenString;
					$scope.$parent.searchAreaData.fileId.work = result.fileId.work;
					// 一覧エリアのリフレッシュ
					$scope.onSearch();
				}
			);
		},
		// 「属性条件保存」ボタン押下処理
		zokuseiJokenSave: function($scope) {
			// 『検索エリア』-「検索条件を保存」押下処理
			// 属性検索ワーク情報設定
			var zokuseiKensakuWork = createZokuseiKensakuWork($scope)
			$scope.modal = {
				'data': zokuseiKensakuWork
			}
			// 検索条件入力
			var template = 'app/kensaku-joken-name-input/kensaku-joken-name-input.html';
			var controller = 'KensakuJokenNameInputController';
			var promise = CommonService.openModal($scope, template, controller);
			promise.then(
				function(result) {
					// 検索条件入力成功処理
				}
			);
		},
		// 「クリア」ボタン押下処理
		clear: function($scope) {
			if (isActiveTabZokusei($scope)) {
				// 属性情報(検索条件)のクリア
				angular.forEach($scope.$parent.zokusei, function(zokuseiData) {
					if (zokuseiData.id) {
						if (ZokuseiSearchService.isZokuseiDataTypeString(zokuseiData.dataTypeKbn)) {
							// 文字列系の場合
							// 検索条件項目の設定
							zokuseiData.select = null;
							zokuseiData.kensakuJokenString = null;
							zokuseiData.work.kensakuValText = [];
							zokuseiData.work.ronriJokenKbn = null;
							zokuseiData.work.miSetteiFlg = false;
						} else if (ZokuseiSearchService.isZokuseiDataTypeKbnNum(zokuseiData.dataTypeKbn)) {
							// 数値系の場合
							// 検索条件項目の設定
							zokuseiData.select = null;
							zokuseiData.kensakuJokenString = null;
							zokuseiData.work.kensakuValNumFrom = null;
							zokuseiData.work.kensakuValNumTo = null;
							zokuseiData.work.miSetteiFlg = false;
						} else if (ZokuseiSearchService.isZokuseiDataTypeKbnFlg(zokuseiData.dataTypeKbn)) {
							// フラグの場合
							zokuseiData.kensakuJokenString = "null";
						} else if (ZokuseiSearchService.isZokuseiDataTypeKbnDate(zokuseiData.dataTypeKbn)) {
							// 日付系の場合
							// 検索条件項目の設定
							zokuseiData.select = null;
							zokuseiData.kensakuJokenString = null;
							zokuseiData.work.kensakuValDateFrom = null;
							zokuseiData.work.kensakuValDateTo = null;
							zokuseiData.work.kensakuValDateNissu = null;
							zokuseiData.work.futaiJokenKbn = null;
							zokuseiData.work.hikakuJokenKbn = null;
							zokuseiData.work.miSetteiFlg = false;
						} else if (ZokuseiSearchService.isZokuseiDataTypeSelect(zokuseiData.dataTypeKbn)) {
							// 選択肢系の場合
							// 検索条件項目の設定
							zokuseiData.select = null;
							zokuseiData.work.kensakuValSentakushi = [];
							zokuseiData.kensakuJokenString = null;
							zokuseiData.work.ronriJokenKbn = null;
							zokuseiData.work.miSetteiFlg = false;
						}
					}
				});
				// チェックアウト（検索条件）のクリア
				$scope.$parent.searchAreaData.checkOutJoken = "null";
				// チェックアウト者（検索条件）のクリア
				$scope.$parent.searchAreaData.checkOutUser.kensakuJokenString = null;
				$scope.$parent.searchAreaData.checkOutUser.work.kensakuValSentakushi = null;
				// ファイルID（検索条件）のクリア
				$scope.$parent.searchAreaData.fileId.kensakuJokenString = null;
				$scope.$parent.searchAreaData.fileId.work.kensakuValFileId = null;
				$scope.$parent.searchAreaData.fileId.work.kensakuValFileIdFrom = null;
				$scope.$parent.searchAreaData.fileId.work.kensakuValFileIdTo = null;
			} else if (isActiveTabZenbun($scope)) {
				$scope.$parent.searchAreaData.zenbunKensakuVal = null;
				$scope.$parent.searchAreaData.zenbunKensakuAndFlg = false;
				$scope.$parent.searchAreaData.zenbunKensakuKanzenIcchiFlg = false;
				$scope.$parent.searchAreaData.zenbunKensakuPdfAddACharacterFlg = false;
				$scope.$parent.searchAreaData.zenbunKensakuIncludChoiceFlg = false;
				$scope.$parent.searchAreaData.zenbunKensakuIncludPdfTextOldFlg = false;
			}
		},
		// [一覧エリア]
		// 一覧表示タイプ変更処理
		dispListType: function($scope, type) {
			if (type == Const.DISP_LIST_TYPE_THUMBNAIL) {
				var thumbnailHeightMax = CommonService.getSystemSettei(Const.SYSTEM_INFO_THUMBNAIL_HEIGHT_MAX);
				$('.thumbnail-fileArea').css('width', thumbnailHeightMax + 'px');
				$('.thumbnail-fileArea').css('height', thumbnailHeightMax + 'px');
				$('.thumbnail-info').css('width', thumbnailHeightMax + 'px');
				// サムネイル表示押下処理
				getThumbnail($scope, 0);
			}
		},
		// ページング変更処理
		changePage: function($scope, pageKbn) {
			if (angular.isDefined(pageKbn)) {
				// ページング変更処理
				$scope.$parent.pagination.dispPage = CommonService.setDispPage($scope.$parent.pagination, pageKbn);
			}
			// 表示件数を変更した場合、ユーザ設定に設定
			if (pageKbn == Const.PAGING_DISPCNT) {
				CommonService.setUserSettei(Const.USER_SETTEI_LIST_HYOJI_KENSU, $scope.$parent.dataTypePage);
			}
			// ワークフロー画面の場合、ワークフローIDを付与
			if (isActiveTabWorkflow($scope)) {
				// 保持している検索条件の取得
				var searchJoken = $scope.$parent.workflowListSearchJoken;
			} else {
				// 保持している検索条件の取得
				var searchJoken = $scope.$parent.fileListSearchJoken;
			}
			// 検索条件を設定
			searchJoken.dispPage = $scope.$parent.pagination.dispPage;
			// 表示件数の設定
			searchJoken.dispCnt = $scope.$parent.dataTypePage;
			// データ取得処理
			getListData($scope, searchJoken);
		},
		// 「文書種」ブルダウン変更処理
		changeBunshoshu: function($scope) {
			// 検索エリア情報取得(getSearchAreaData)で文書種リスト更新
			// ->changeBunshoshu()イベントが発生するので、一覧非表示の場合は実行しない
			if ($scope.$parent.initialized && $scope.$parent.listAreaZokuseiList) {
				// リフレッシュ
				$scope.onListRefresh();
			}
		},
		// 「構成逆展開」変更処理
		toggleKosei: function($scope) {
			if ($scope.fileListGridApi.grid.rows.length == 0) {
				return;
			}			
			// ファイル一覧、構成アイコン変更処理
			var fileListData = [];
			for (var i = 0; i < $scope.fileList_gridOptions.data.length; i++) {
				// 展開状態を閉じる
				$scope.fileListGridApi.grid.rows[i].treeNode.state = "collapsed"
				var row = $scope.fileList_gridOptions.data[i];
				// 選択状態のファイルが構成ファイルの場合、詳細エリアをクリア
				if (row.$$hashKey == $scope.$parent.hashKey && row.$$treeLevel > 0) {
					$scope.$parent.hashKey = null;
					initDetailAreaData($scope, true);
				}
				// 構成ファイル以外を対象にリストを作成
				if (row.$$treeLevel == 0) {
					fileListData.push(row);
					// 構成情報を初期化
					row.kosei = null;
					row.searched = false;
					if ((!$scope.$parent.koseiGyakuTenkai && row.koseiFileExists)
					|| ($scope.$parent.koseiGyakuTenkai && row.oyaFileExists)) {
						// 構成ファイルがある場合
						var child = {$$treeLevel: 1};
						fileListData.push(child)
						row.kosei = [];
						row.kosei.push(child);
					}
				}
			}
			$scope.fileList_gridOptions.data = fileListData;
			$scope.$parent.fileListGridData = angular.copy($scope.fileList_gridOptions.data);
			$scope.fileListGridApi.grid.refresh();
		},		
		// 「スターアイコン」選択処理
		starIcon: function($scope, data) {
			// 通信用パラメータの設定
			var param = {
				'langKey': CommonService.getLanguageKey($scope),
				'data': data
			};
			// 一覧情報の取得
			CommonService.httpPost(ACTION_STAR, param,
				function(resolveData) {
					// 成功処理
					if (!CommonService.isError(resolveData)) {
						if (data.$$hashKey) {
							// 一覧エリアのスター
							if ($scope.$parent.detailAreaData && (data.id == $scope.$parent.detailAreaData.id)) {
								// 詳細に表示されているファイルの場合
								$scope.$parent.detailAreaData.star = data.star;
							}
						}
						// 一覧エリアの同ファイルのスター反映
						angular.forEach($scope.fileList_gridOptions.data, function(row) {
							// 対象データと同じIDの場合にスター情報を更新
							if (row.id == data.id) {
								row.star = data.star;
							}
						});
						$scope.$parent.fileListGridData = angular.copy($scope.fileList_gridOptions.data);
				} else {
						if (resolveData.errorInfo.code == 'W00021') {
							// 既にファイルが削除されている場合
							var promise = CommonService.dispMessage($scope, resolveData.errorInfo.code, null, resolveData.errorInfo.message);
							promise.then(function(result) {
								// リフレッシュを行う
								$scope.onListRefresh();
							});
						} else {
							// 失敗処理
							CommonService.errorProcess($scope, resolveData);
						}
					}
				},
				function(rejectData, state) {
					// 失敗処理
					CommonService.systemError($scope, state);
				}
			);
		},
		// 「一覧行」選択処理
		rowSelectionChanged: function($scope, entity) {
			// 一覧選択データ
			$scope.$parent.listAreaSelectData = entity;
			if (isActiveTabWorkflow($scope)) {
				// ワークフロー詳細エリアの切り替え
				showInnerLayout(Const.LAYOUT_DETAIL_FILE);
				// 選択行の設定(背景色の設定で使用)
				$scope.$parent.shinseiHashKey = entity.$$hashKey;
				// ワークフロー一覧の選択を解除する
				$scope.workflowListGridApi.selection.clearSelectedRows();
				// 詳細情報の取得
				getFileDetailData($scope, entity.fileId, entity.workflowId);
			} else if (!$scope.$parent.trashBoxMode) {
				// 選択行の設定(背景色の設定で使用)
				$scope.$parent.hashKey = entity.$$hashKey;
				// 詳細情報の取得
				getFileDetailData($scope, entity.id);
			}
		},
		// 「リフレッシュ」ボタン押下処理
		listRefresh: function($scope) {
			// 詳細エリアの初期化
			initDetailAreaData($scope, true);
			// コメントエリアの初期化
			initComentAreaData($scope, true);
			// プレビューエリアの初期化
			initPreviewAreaData($scope, true);
			// データの取得
			getListData($scope);
		},
		// 「印刷」ボタン押下処理
		print: function($scope, id) {
			// JNLPファイル実行パスをクリア
			$scope.jnlp = null;
			// 通信用パラメータの設定
			if (isActiveTabWorkflow($scope)) {
				// 一覧エラー情報をクリア
				clearWorkflowListErrorInfo($scope.$parent.workflowListData);
				var listData = getWorkflowShinseiFileGridSelectedData($scope);
			} else {
				// 一覧エラー情報をクリア
				clearListErrorInfo($scope.fileList_gridOptions.data);
				var listData = CommonService.getGridSelectData($scope.fileListGridApi);
			}
			var param = {
				'langKey': CommonService.getLanguageKey($scope),
				'data': listData,
				'id': id,
				'isWorkflow': isActiveTabWorkflow($scope)
			};
			var dtlInfo = {
				oinIchiId: id
			};
			if (param.isWorkflow) {
				// ワークフロー一覧の場合
				dtlInfo.workflowShinseiFileInfo = [];
			} else {
				// 上記以外
				dtlInfo.fileId = [];
			}

			for (var idx in listData) {
				if ('workflowShinseiFileInfo' in dtlInfo) {
					dtlInfo.workflowShinseiFileInfo.push({
						id: listData[idx].id,
						fileId: listData[idx].fileId
					});
				} else {
					dtlInfo.fileId.push(listData[idx].id);
				}
			}
			var sosaDtlKbn = isActiveTabWorkflow($scope) ? Const.SOSA_LOG_SOSA_DTL_KBN_PRINT_WORKFLOW_LIST : Const.SOSA_LOG_SOSA_DTL_KBN_PRINT_FILE_LIST;
			// 詳細情報の取得
			CommonService.httpModal($scope, ACTION_PRINT, param, true,
				function(resolveData) {
					// 成功処理
					if (!CommonService.isError(resolveData) || resolveData.fileList) {
						// パスワード入力チェック対象データリスト作成
						$scope.pdfPasswordCheckList = [];
						var gamenKbn = null;
						if (param.isWorkflow) {
							gamenKbn = Const.PDF_PASSWORD_CONFIRM_MODE_WORKFLOW_LIST_PRINT;
						} else {
							gamenKbn = Const.PDF_PASSWORD_CONFIRM_MODE_FILE_LIST_PRINT;
						}
						setPdfPasswordCheckList($scope, resolveData.fileList, $scope.pdfPasswordCheckList, gamenKbn);
						if ($scope.pdfPasswordCheckList.length == 0) {
							// 対象にセキュリティ設定済みのファイルを含まない
							printSuccess($scope, resolveData.fileList, id);
						} else {
							// ファイルID昇順，版管理ID（最小値）昇順でソート
							$scope.pdfPasswordCheckList.sort(function(a, b) {
								if (a.fileId < b.fileId) return -1;
								if (a.fileId > b.fileId) return 1;
								if (Math.min.apply(null, a.hanKanriIdList) < Math.min.apply(null, b.hanKanriIdList)) return -1;
								if (Math.min.apply(null, a.hanKanriIdList) > Math.min.apply(null, b.hanKanriIdList)) return 1;
							});
							// 対象にセキュリティ設定済みのファイルを含む
							$scope.modal = {
								title: $translate.instant('pdf_password_input'),
							}
							if (param.isWorkflow) {
								// ワークフロー一覧印刷
								$scope.pdfPasswordConfirmMode = Const.PDF_PASSWORD_CONFIRM_MODE_WORKFLOW_LIST_PRINT;

								// ワークフローID毎にシステム操作ログ登録情報を作成する
								$scope.pdfPasswordConfirmLogData = [];
								var fileIdMap = new Map();
								// ワークフローIDをキーとしたマップにデータをセット
								angular.forEach(resolveData.fileList, function(obj) {
									if (!obj.userPasswordFlg && !obj.ownerPasswordFlg) {
										// ユーザパスワード，権限パスワードが未設定のデータはスルー
										return;
									}
									var setValue = {
										fileIdList: [],
										hanKanriIdList: []
									};
									if (fileIdMap.has(obj.workflowId)) {
										// 同一ワークフローIDが既に存在する場合、ファイルIDを取得する
										setValue = fileIdMap.get(obj.workflowId);
									}
									setValue.fileIdList.push(obj.fileId);
									setValue.hanKanriIdList.push(obj.hanKanriId);
									// マップにワークフローIDとファイルIDをセット
									fileIdMap.set(obj.workflowId, setValue);
								});
								// マップ情報をログ用に整形
								fileIdMap.forEach(function(value, workflowId) {
									// ログ用に整形（ワークフローIDはログ表示時に数値型として扱うため Number）
									var info = {
										fileId: value.fileIdList,
										hanKanriIdList: value.hanKanriIdList,
										workflowId: Number(workflowId)
									}
									$scope.pdfPasswordConfirmLogData.push(info);
								});
							} else {
								// 一覧エリア印刷
								$scope.pdfPasswordConfirmMode = Const.PDF_PASSWORD_CONFIRM_MODE_FILE_LIST_PRINT;
							}
							// パスワード確認（複数ファイル）ダイアログを表示
							var template = "app/password-input-list-modal/password-input-list-modal.html";
							var controller = "PasswordInputListModalController";
							var size = "lg";
							var promise = CommonService.openModal($scope, template, controller, size);
							promise.then(
								function(pwResolveData) {
									// パスワード入力済み
									// パスワード情報を印刷対象データに反映
									setPdfPassword(resolveData.fileList, pwResolveData);
									// 成功処理
									printSuccess($scope, resolveData.fileList, id, pwResolveData);
								},
								function() {
									// 印刷エラー発生処理
									printError($scope, resolveData, dtlInfo, sosaDtlKbn, listData);
								}
							);
						}
					} else {
						if (resolveData.errorInfo.details && resolveData.errorInfo.details[0].details) {
							// エラーが１件以上存在
							printError($scope, resolveData, dtlInfo, sosaDtlKbn, listData);
						} else {
							// 失敗処理
							CommonService.errorProcess($scope, resolveData, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_PRINT, dtlInfo, sosaDtlKbn)
								.then(function() {
									// 一覧エリアの更新を促すエラーメッセージが返却されてきた場合、一覧をリフレッシュ
									if (resolveData.errorInfo.code == 'W00021') {
										// 検索エリア(ワークフロー)情報取得
										getSearchAreaData($scope, Const.GET_KENSAKU_TAB_PATTERN_WORKFLOW);
										// 一覧エリアをリフレッシュ
										getWorkflowListData($scope);
									}
								});
						}
					}
				},
				function(rejectData, state) {
					// 失敗処理
					if (state != 'cancel') {
						CommonService.systemError($scope, state, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_PRINT, dtlInfo, sosaDtlKbn);
					} else {
						// 一時保存ファイルの削除
						var param = { 'filename': rejectData.fileName };
						CommonService.httpPost(ACTION_JNLP_FILE_REMOVE, param, function(resolveData) {}, function(rejectData) {});
					}
				}
			);
		},
		// 「CSV出力」ボタン押下処理
		csvOutput: function($scope, id) {
			// 確認メッセージ
			var promise = CommonService.dispMessage($scope, 'Q00001', ['zokuseiInfoCsvOutPut']);
			promise.then(
				function(result) {
					// 一覧エラー情報をクリア
					clearListErrorInfo($scope.fileList_gridOptions.data);
					// 検索条件の保持
					if (id == Const.CSV_OUTPUT_KBN_SELECT) {
						// 選択行のデータをセット
						var data = CommonService.getGridSelectData($scope.fileListGridApi);
					} else {
						// 一覧表示検索条件をセット
						var data = $scope.$parent.fileListSearchJoken;
					}

					// 通信用パラメータの設定
					var param = {
						'langKey': CommonService.getLanguageKey($scope),
						'id': id,
						'data': data,
						'bunshoshuId': $scope.$parent.bunshoshu
					};
					var dtlInfo = {};
					if (id == Const.CSV_OUTPUT_KBN_SELECT) {
						// 選択したデータを出力
						dtlInfo.fileId = [];
						for (var idx in data) {
							dtlInfo.fileId.push(data[idx].id);
						}
					} else {
						// 全件を出力
						dtlInfo.searchJoken = $scope.$parent.fileListSearchJoken;
					}
					// 詳細情報の取得
					CommonService.httpModal($scope, ACTION_CSV_OUTPUT, param, false,
						function(resolveData) {
							// 成功処理
							// システム操作ログ登録（成功）
							var promiseRes = CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_CSV, dtlInfo, getSosaDtlKbnSearch(Const.SOSA_LOG_SOSA_KBN_CSV, dtlInfo));
							promiseRes.then(
								function() {
									var fileName = CommonService.getSystemSettei(Const.SYSTEM_INFO_ATTRIBUTES_INFO_CSV_FILE_NAME);
									CommonService.linkDownload($scope, resolveData, fileName);
								}
							);
						},
						function(rejectData, state) {
							if (state != 'cancel') {
								// 失敗処理
								var reader = new FileReader();
								reader.onload = function(re) {
									var errorJson = {};
									// エラー情報の生成
									errorJson.errorInfo = JSON.parse(re.target.result);
									if (id == Const.CSV_OUTPUT_KBN_SELECT && errorJson.errorInfo.details[0].details) {
										// リストから「選択したデータを出力」を選択 且つ エラーが１件以上存在
										CommonService.errorProcess($scope, errorJson, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_CSV, dtlInfo, getSosaDtlKbnSearch(Const.SOSA_LOG_SOSA_KBN_CSV, dtlInfo))
											.then(
												function() {
												// 一覧エラー設定
												setListErrorInfo($scope, data, errorJson.errorInfo.details);
												}
											);
									} else {
										// 失敗処理
										if (errorJson.errorInfo.errorInfo) {
											CommonService.errorProcess($scope, errorJson.errorInfo, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_CSV, dtlInfo, getSosaDtlKbnSearch(Const.SOSA_LOG_SOSA_KBN_CSV, dtlInfo));
										} else {
											CommonService.errorProcess($scope, errorJson, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_CSV, dtlInfo, getSosaDtlKbnSearch(Const.SOSA_LOG_SOSA_KBN_CSV, dtlInfo));
										}
									}
								};
								var blob = new Blob([rejectData], { type: "text/plain" });
								reader.readAsText(blob);
							}
						},
						{responseType: 'arraybuffer'}
					);
				}
			)
		},
		// 「チェックアウト」ボタン押下処理
		checkOut: function($scope) {
			$scope.selectData = CommonService.getGridSelectData($scope.fileListGridApi, 'id');
			$scope.checkOutMode = Const.CHECK_OUT_MODE_DEFAULT;
			// チェックアウト
			var template = "app/check-out/check-out.html";
			var controller = "CheckOutController";
			var promise = CommonService.openModal($scope, template, controller);
			promise.then(
				function(result) {
					// リフレッシュを行う
					$scope.onListRefresh();
				}
			);
		},
		// 「チェックイン」ボタン押下処理
		checkIn: function($scope) {
			$scope.selectData = CommonService.getGridSelectData($scope.fileListGridApi, 'id');
			$scope.checkInMode = Const.CHECK_IN_MODE_DEFAULT;
			// チェックイン
			var template = "app/check-in/check-in.html";
			var controller = "CheckInController";
			var size = "lg";
			var promise = CommonService.openModal($scope, template, controller, size);
			promise.then(
				function(result) {
					// リフレッシュを行う
					$scope.onListRefresh();
				}
			);
		},
		// 「チェックアウト解除」ボタン押下処理
		checkOutKaijo: function($scope) {
			$scope.selectData = CommonService.getGridSelectData($scope.fileListGridApi, 'id');
			// チェックアウト解除
			var template = "app/check-out-kaijo/check-out-kaijo.html";
			var controller = "CheckOutKaijoController";
			var promise = CommonService.openModal($scope, template, controller);
			promise.then(
				function(result) {
					// リフレッシュを行う
					$scope.onListRefresh();
				}
			);
		},
		// 「上書き更新」ボタン押下処理
		overwrite: function($scope) {
			$scope.selectData = CommonService.getGridSelectData($scope.fileListGridApi, 'id');
			// 上書き更新
			$scope.checkInMode = Const.CHECK_IN_MODE_UPDATE;
			var template = "app/check-in/check-in.html";
			var controller = "CheckInController";
			var size = "lg";
			var promise = CommonService.openModal($scope, template, controller, size);
			promise.then(
				function(result) {
					// リフレッシュを行う
					$scope.onListRefresh();
				}
			);
		},
		// 「ファイル比較」ボタン押下処理
		compare: function($scope) {
			// ファイル比較画面遷移処理
			var selectData = CommonService.getGridSelectData($scope.fileListGridApi, 'id');
			OptionService.locationCompare($scope, selectData)
		},
		// 「ワークフロー」ボタン押下処理
		workflow: function($scope, id) {
			// 「ワークフロー申請画面」に遷移
			if (id) {
				// 下書き申請、再申請の場合
				StorageService.setParameter(Const.PATH_WORKFLOW_SHINSEI, {id: id});
				$location.path(Const.PATH_WORKFLOW_SHINSEI);
			} else {
				// 新規申請の場合
				// 選択データの取得
				var selectData = CommonService.getGridSelectData($scope.fileListGridApi);
				StorageService.setData('workflowShinseiData', selectData);
				StorageService.setParameter(Const.PATH_WORKFLOW_SHINSEI, {id: null});
				$location.path(Const.PATH_WORKFLOW_SHINSEI);
			}
		},
		// 「削除/削除取消」ボタン押下処理
		listDelete: function($scope, cancelFlg) {
			// モード毎の設定
			var modeSettei = {};
			if (cancelFlg) {
				// 「削除取消」の場合
				modeSettei['msgPartsStart'] = ['deleteFileCancel'];
				modeSettei['msgPartsFinish'] = ['fileDeleteCancel'];
				modeSettei['actionPath'] = ACTION_LIST_DELETE_CANCEL;
				modeSettei['sosaLogKbn'] = Const.SOSA_LOG_SOSA_KBN_DELETE_FILE_CANCEL;
			} else {
				// 「削除」の場合
				modeSettei['msgPartsStart'] = ['deleteFile'];
				modeSettei['msgPartsFinish'] = ['fileDelete'];
				modeSettei['actionPath'] = ACTION_LIST_DELETE;
				if ($scope.$parent.trashBoxMode) {
					modeSettei['sosaLogKbn'] = Const.SOSA_LOG_SOSA_KBN_DELETE_FILE_PERFECT;
				} else {
					modeSettei['sosaLogKbn'] = Const.SOSA_LOG_SOSA_KBN_DELETE_FILE;
				}
			}
			// 確認メッセージ
			var promise = CommonService.dispMessage($scope, 'Q00001', modeSettei.msgPartsStart);
			promise.then(
				function(result) {
					// 一覧エラー情報をクリア
					clearListErrorInfo($scope.fileList_gridOptions.data);
					// 通信用パラメータの設定
					var data = CommonService.getGridSelectData($scope.fileListGridApi, 'id');
					var param = {
						'langKey': CommonService.getLanguageKey($scope),
						'data': data
					};
					// 「削除」の場合、現在のモードを設定
					if (!cancelFlg) {
						param['trashBoxMode'] = $scope.$parent.trashBoxMode;
					}
					var dtlInfo = {
						fileId: data
					};
					// 詳細情報の取得
					CommonService.httpModal($scope, modeSettei.actionPath, param, true,
						function(resolveData) {
							// 成功処理
							if (!CommonService.isError(resolveData)) {
								var promise = CommonService.dispMessage($scope, 'I00001', modeSettei.msgPartsFinish);
								promise.then(function(result) {
									// 一覧エリアをリフレッシュ
									$scope.onListRefresh();
								});
								// システム操作ログ登録（成功）
								CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_MAIN, modeSettei.sosaLogKbn, dtlInfo);
							} else {
								if (resolveData.errorInfo.details && resolveData.errorInfo.details[0].details) {
									// エラーが１件以上存在
									CommonService.errorProcess($scope, resolveData, Const.SOSA_LOG_GAMEN_KBN_MAIN, modeSettei.sosaLogKbn, dtlInfo)
										.then(
											function() {
												// 一覧エラー設定
												setListErrorInfo($scope, CommonService.getGridSelectData($scope.fileListGridApi), resolveData.errorInfo.details);
											}
										);
								} else {
									// 失敗処理
									CommonService.errorProcess($scope, resolveData, Const.SOSA_LOG_GAMEN_KBN_MAIN, modeSettei.sosaLogKbn, dtlInfo);
								}
							}
						},
						function(rejectData, state) {
							// 失敗処理
							CommonService.systemError($scope, state, Const.SOSA_LOG_GAMEN_KBN_MAIN, modeSettei.sosaLogKbn, dtlInfo);
						}
					);
				}
			)
		},
		// 「ZIPファイルダウンロード」ボタン押下処理
		zipFileDownload: function($scope, kbn) {
			// 確認メッセージ
			var promise = CommonService.dispMessage($scope, 'Q00001', ['download']);
			promise.then(
				function(result) {
					// 一覧エラー情報をクリア
					clearListErrorInfo($scope.fileList_gridOptions.data);
					// 通信用パラメータの設定
					var data = CommonService.getGridSelectData($scope.fileListGridApi, 'id');
					var koseiInfo = getKoseiInfo(kbn);
					var param = {
						'langKey': CommonService.getLanguageKey($scope),
						'data': data,
						'downloadKbn': koseiInfo.paramKbn,
						'koseiFlg': koseiInfo.koseiFlg
					};
					var dtlInfo = {
						fileId: data,
						downloadKbn: koseiInfo.paramKbn,
						koseiFlg: koseiInfo.koseiFlg
					};

					// iOS の場合新規タブを開く
					var win = CommonService.windowOpen($scope);

					// 詳細情報の取得
					CommonService.httpModal($scope, ACTION_DOWNLOAD, param, false,
						function(resolveData) {
							// 成功処理
							// システム操作ログ登録（成功）
							var promiseRes = CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DOWNLOAD, dtlInfo, Const.SOSA_LOG_SOSA_DTL_KBN_DOWNLOAD_FILE_LIST_SELECTION);
							promiseRes.then(
								function() {
									var fileName = "download_" + CommonService.formatDate.format(new Date(), "yyyyMMddhhmmss") + ".zip";
									CommonService.linkDownload($scope, resolveData, fileName, win);
								}
							)
						},
						function(rejectData, state) {
							// 失敗処理
							if (state != 'cancel') {
								// 失敗処理
								var reader = new FileReader();
								reader.onload = function(re) {
									var errorJson = {};
									// エラー情報の生成
									errorJson.errorInfo = JSON.parse(re.target.result);
									if (errorJson.errorInfo.details && errorJson.errorInfo.details[0].details) {
										// エラーが１件以上存在
										CommonService.errorProcess($scope, errorJson, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DOWNLOAD, dtlInfo, Const.SOSA_LOG_SOSA_DTL_KBN_DOWNLOAD_FILE_LIST_SELECTION)
											.then(function() {
												// 一覧エラー設定
												setListErrorInfo($scope, CommonService.getGridSelectData($scope.fileListGridApi), errorJson.errorInfo.details);
											});
									} else {
										// 失敗処理
										if (errorJson.errorInfo.errorInfo) {
											CommonService.errorProcess($scope, errorJson.errorInfo, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DOWNLOAD, dtlInfo, Const.SOSA_LOG_SOSA_DTL_KBN_DOWNLOAD_FILE_LIST_SELECTION);
										} else {
											CommonService.errorProcess($scope, errorJson, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DOWNLOAD, dtlInfo, Const.SOSA_LOG_SOSA_DTL_KBN_DOWNLOAD_FILE_LIST_SELECTION);
										}
									}
								};
								var blob = new Blob([rejectData], { type: "text/plain" });
								reader.readAsText(blob);
							}
							if (win != null) {
								win.close();
							}
						},
						{responseType: 'arraybuffer'}
					);
				}
			)
		},
		// [詳細エリア]
		// 「削除」ボタン押下処理
		deleteRow: function($scope, sbt, data) {
			if (sbt == Const.DETAIL_TAB_KOSEI) {
				var delListData = $scope.$parent.delKoseiListData;
				var listData = $scope.kosei_gridOptions.data;
			} else {
				var delListData = $scope.$parent.delKanrenListData;
				var listData = $scope.kanren_gridOptions.data;
			}
			// データ削除
			if (!data.addFlg) {
				// 既存データは、削除リストに格納
				delListData.push(data);
			}
			// 一覧から削除
			CommonService.spliceGridRow(listData, data, 'id', true);
		},
		// 「追加」ボタン押下処理
		addFile: function($scope, sbt) {
			// 一覧タイトルの設定（ファイル選択ダイアログ用）
			$scope.gridTitle = {};
			angular.forEach($scope.kosei_gridOptions.columnDefs, function(column) {
				if (column.id == 0) {
					$scope.gridTitle.fileName = column.displayName;
				} else if (column.id == 1) {
					$scope.gridTitle.zumenNo = column.displayName;
				}
			});
			// ファイル選択画面表示
			var template = "app/select-file/select-file.html";
			var controller = "SelectFileController";
			var promise = CommonService.openModal($scope, template, controller);
			// ダイアログの結果
			promise.then(function(result) {
				// OKの場合、データを反映
				angular.forEach(result, function(data) {
					if (sbt == Const.DETAIL_TAB_KOSEI) {
						var delListData = $scope.$parent.delKoseiListData;
						var listData = $scope.kosei_gridOptions.data;
					} else {
						var delListData = $scope.$parent.delKanrenListData;
						var listData = $scope.kanren_gridOptions.data;
					}
					var addData = {
						"id": data.id,
						"addFlg": true,
						"zokuseiList": [
							{
								"kbn": data[Const.KIHON_ZOKUSEI_SBT_FILENAME],
								"label": data[Const.KIHON_ZOKUSEI_SBT_FILENAME],
								"dataTypeKbn": 1,
							},
							{
								"kbn": data[Const.KIHON_ZOKUSEI_SBT_ZUMEN_NO],
								"label": data[Const.KIHON_ZOKUSEI_SBT_ZUMEN_NO],
								"dataTypeKbn": 1,
							}
						]
					}
					if (sbt == Const.DETAIL_TAB_KOSEI) {
						// 構成図面の場合、数量を追加
						addData.zokuseiList.push({
							"kbn": "",
							"label": "",
							"dataTypeKbn": 3,
						});
					}
					// ファイルの追加
					var delData = CommonService.getListMapToMap(delListData, 'id', addData.id);
					if (delData != null) {
						// 削除データから削除
						CommonService.spliceGridRow(delListData, addData, 'id', true);
						listData.push(delData);
					} else if (!CommonService.getListMapToMap(listData, 'id', addData.id)) {
						listData.push(addData);
					}
				});
			});
		},
		// 「PDF編集」ボタン押下処理
		pdfEdit: function($scope, id) {
			// 「PDF編集画面」に遷移
			StorageService.setParameter(Const.PATH_PDF_EDIT, {workflowId: 0, id: id, jotaiKanriId: 0});
			$location.path(Const.PATH_PDF_EDIT);
		},
		// 「PDFセキュリティ設定」ボタン押下処理
		pdfSecurity: function($scope) {
			// PDFセキュリティ設定
			$scope.modal = {
				id: $scope.$parent.detailAreaData.id
			}
			var template = "app/pdf-security/pdf-security.html";
			var controller = "PdfSecurityController";
			CommonService.openModal($scope, template, controller);
		},
		// 「属性編集」ボタン押下処理
		zokuseiEdit: function($scope) {
			changeMode($scope, true);
		},
		// 「ファイル削除」ボタン押下処理
		fileDelete: function($scope) {
			// 確認メッセージ
			var promise = CommonService.dispMessage($scope, 'Q00001', ['remove']);
			promise.then(
				function(result) {
					// 通信用パラメータの設定
					var param = {
						'langKey': CommonService.getLanguageKey($scope),
						'data': $scope.$parent.detailAreaData
					};
					var dtlInfo = {
						fileId: param.data.id
					};
					// 詳細情報の取得
					CommonService.httpModal($scope, ACTION_FILE_REMOVE, param, true,
						function(resolveData) {
							// 成功処理
							if (!CommonService.isError(resolveData)) {
								var promise = CommonService.dispMessage($scope, 'I00001', ['remove']);
								promise.then(function(result) {
									// 一覧エリアをリフレッシュ
									$scope.onListRefresh();
								});
								// システム操作ログ登録（成功）
								CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DELETE_FILE, dtlInfo);
							} else {
								// 失敗処理
								CommonService.errorProcess($scope, resolveData, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DELETE_FILE, dtlInfo);
							}
						},
						function(rejectData, state) {
							// 失敗処理
							CommonService.systemError($scope, state, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DELETE_FILE, dtlInfo);
						}
					);
				}
			)
		},
		// 「アプリ連携」ボタン押下処理
		appLink: function($scope, id) {
			$scope.jnlp = null
			if (id == Const.APP_LINK_DOWNLOAD) {
				// ダウンロード
				// 確認メッセージ
				var promise = CommonService.dispMessage($scope, 'Q00001', ['downloadFileApplicationStart']);
				promise.then(
					function(result) {
						// 通信用パラメータの設定
						var param = {
							'langKey': CommonService.getLanguageKey($scope),
							'id': $scope.$parent.detailAreaData.id,
							'fileName': $scope.$parent.detailAreaData.fileName
						};
						var dtlInfo = {
							fileId: $scope.$parent.detailAreaData.id
						};
						// 詳細情報の取得
						CommonService.httpModal($scope, ACTION_APP_LINK, param, false,
							function(resolveData) {
								// 成功処理
								if (!CommonService.isError(resolveData)) {
									$scope.jnlp = CommonService.getJnlpFile(resolveData.fileName, Const.JWS_START_MODE_EXEC);
									$timeout(function() {
										$('#jnlp')[0].click();
									}, 500);
									// システム操作ログ登録（成功）
									CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DOWNLOAD, dtlInfo, Const.SOSA_LOG_SOSA_DTL_KBN_DOWNLOAD_APPLICATION_LINKAGE);
								} else {
									// 失敗処理
									CommonService.errorProcess($scope, resolveData, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DOWNLOAD, dtlInfo, Const.SOSA_LOG_SOSA_DTL_KBN_DOWNLOAD_APPLICATION_LINKAGE);
								}
							},
							function(rejectData, state) {
								// 失敗処理
								if (state != 'cancel') {
									CommonService.systemError($scope, state, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DOWNLOAD, dtlInfo, Const.SOSA_LOG_SOSA_DTL_KBN_DOWNLOAD_APPLICATION_LINKAGE);
								} else {
									// 一時保存ファイルの削除
									var param = { 'filename': rejectData.fileName };
									CommonService.httpPost(ACTION_JNLP_FILE_REMOVE, param, function(resolveData) {}, function(rejectData) {});
								}
							}
						);
					}
				)
			} else {
				// チェックアウト
				$scope.selectData = [
					$scope.$parent.detailAreaData.id
				];
				$scope.checkOutMode = Const.CHECK_OUT_MODE_APPLINK;
				var template = "app/check-out/check-out.html";
				var controller = "CheckOutController";
				var promise = CommonService.openModal($scope, template, controller);
				promise.then(
					function(result) {
						// リフレッシュを行う
						$scope.onListRefresh();
					}
				);
			}
		},
		// 「PDF変換」ボタン押下処理
		pdfConvert: function($scope) {
			// 確認メッセージ
			var promise = CommonService.dispMessage($scope, 'Q00001', ['pdfConvert']);
			promise.then(
				function(result) {
					// 通信用パラメータの設定
					var param = {
						'langKey': CommonService.getLanguageKey($scope),
						'data': detailFixedItem($scope.$parent.detailAreaData)
					};
					// 詳細情報の取得
					CommonService.httpModal($scope, ACTION_PDF_CONVERT, param, true,
						function(resolveData) {
							// 成功処理
							if (!CommonService.isError(resolveData)) {
								var promise = CommonService.dispMessage($scope, 'I00001', ['pdfConvertOrder']);
								promise.then(
									function(result) {
										// エラーPDFの表示設定
										$scope.errorPreview = null;
										$scope.noPrint = false;
										$scope.pdfSrc = "pdf/pdfHenkanJokyo_1.pdf"
									}
								)
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
			)
		},
		// 「ファイル差し替え」
		fileReplace: function($scope) {
			$scope.selectData = [
				$scope.$parent.detailAreaData.id
			];
			$scope.checkInMode = Const.CHECK_IN_MODE_FILE_REPLACE;
			// チェックイン
			var template = "app/check-in/check-in.html";
			var controller = "CheckInController";
			var size = "lg";
			var promise = CommonService.openModal($scope, template, controller, size);
			promise.then(
				function(result) {
					// リフレッシュを行う
					$scope.onListRefresh();
				}
			);
		},
		// 「図脳ファイルから属性情報取得」押下処理
		onZokuseiAcquisition: function($scope) {
			OptionService.getZunoFileAttribute($scope, $scope.$parent.detailAreaData);
		},
		// 「保存」ボタン押下処理
		save: function($scope) {
			// 入力済みの内容を保持
			updateZokuseiListAll($scope);

			// 入力値チェック
			if (!checkZokusei($scope, $scope.$parent.detailAreaData)) {
				// 確認メッセージ
				var promise = CommonService.dispMessage($scope, 'Q00001', ['save']);
				promise.then(
					function(result) {
						// 詳細情報データ
						var data = angular.copy($scope.$parent.detailAreaData);
						// 登録用構成図面データ
						var koseiData = [];
						// 表示データセット
						createUpdateListData(koseiData, data.kosei, null, $scope.originDetailAreaData.kosei);
						// 削除データセット
						createUpdateListData(koseiData, $scope.$parent.delKoseiListData, Const.UPDATE_STATUS_DELETE);
						// 登録用関連ファイルデータ
						var kanrenData = [];
						// 表示データセット
						createUpdateListData(kanrenData, data.kanren, null, $scope.originDetailAreaData.kanren);
						// 削除データセット
						createUpdateListData(kanrenData, $scope.$parent.delKanrenListData, Const.UPDATE_STATUS_DELETE);
						// 通信用パラメータの設定
						var param = {
							'langKey': CommonService.getLanguageKey($scope),
							'data': detailFixedItem(data),
							'koseiData': koseiData,
							'kanrenData': kanrenData,
						};
						var dtlInfo = {
							fileId: data.id
						};
						// 詳細情報の取得
						CommonService.httpModal($scope, ACTION_FILE_SAVE, param, true,
							function(resolveData) {
								// 成功処理
								if (!CommonService.isError(resolveData)) {
									var promise = CommonService.dispMessage($scope, 'I00001', ['save']);
									promise.then(function(result) {
										changeMode($scope, false);
										// 一覧エリアをリフレッシュ
										$timeout(function() {
											$scope.onListRefresh();
										});
									});
									// システム操作ログ登録（成功）
									dtlInfo.fileLogId = resolveData.fileLogId;
									CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_ZOKUSEI, dtlInfo);
								} else {
									var errorInfo = resolveData.errorInfo;
									// システム操作ログ登録（失敗）
									dtlInfo.errorInfo = errorInfo;
									CommonService.systemSosaLogFailure($scope, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_ZOKUSEI, dtlInfo);
									if (errorInfo.code == 'W00038') {
										var bunshoshuError = null;
										// タブにエラーアイコンを表示
										$scope.hasDetailTabZokuseiError = true;
										// 属性項目へセット
										var errorMessages = {};
										angular.forEach(errorInfo.details, function(error) {
											// 属性IDの判断
											var id = error.details.id;
											if (!errorMessages[id]) {
												errorMessages[id] = [];
											}
											// メッセージチェック
											if (!CommonService.isOverlapKey(errorMessages[id], error.message)) {
												errorMessages[id].push(error.message);
											}
											// 文書種エラー
											if (id == $scope.$parent.bunshoshuZokusei.id) {
												bunshoshuError = id;
											}
										});
										angular.forEach($scope.$parent.detailAreaData.zokuseiList, function(data) {
											var id = data.zokuseiId;
											if (errorMessages[id]) {
												// エラーメッセージを表示
												data.error = errorMessages[id].join("<br />");
											}
										});
										if (bunshoshuError) {
											$scope.$parent.detailAreaData.bunshoshuError = errorMessages[bunshoshuError].join("<br />");
										}
									} else if (errorInfo.code == 'W00045') {
										// タブにエラーアイコンを表示
										$scope.hasDetailTabKoseiError = true;
										// 構成図面へセット
										var errorMessages = {};
										angular.forEach(resolveData.errorInfo.details, function(id) {
											// 属性IDの判断
											if (!errorMessages[id]) {
												errorMessages[id] = [];
											}
											// メッセージチェック
											if (!CommonService.isOverlapKey(errorMessages[id], errorInfo.message)) {
												errorMessages[id].push(errorInfo.message);
											}
										});
										angular.forEach($scope.$parent.detailAreaData.kosei, function(kosei) {
											var id = kosei.id;
											if (errorMessages[id]) {
												// エラーメッセージを表示
												kosei.errorMessage = errorMessages[id].join("<br />");
											}
										});
									} else {
										// メッセージダイアログを表示
										CommonService.errorProcess($scope, resolveData);
									}
								}
							},
							function(rejectData, state) {
								// 失敗処理
								CommonService.systemError($scope, state, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_ZOKUSEI, dtlInfo);
							}
						);
					}
				)
			}
		},
		// 「キャンセル」ボタン押下処理
		cancel: function($scope) {
			// 構成図面情報・削除データクリア
			$scope.$parent.delKoseiListData = [];
			// 関連ファイル情報・削除データクリア
			$scope.$parent.delKanrenListData = [];
			changeMode($scope, false);
			$scope.$parent.detailAreaData = angular.copy($scope.originDetailAreaData);
			// 一覧データセット
			$scope.kosei_gridOptions.data = $scope.$parent.detailAreaData.kosei;
			$scope.kanren_gridOptions.data = $scope.$parent.detailAreaData.kanren;
		},
		// 『詳細エリア』 - 「文書種」ブルダウン変更処理
		changeBunshoshuDetail: function($scope) {
			var fileId = $scope.$parent.detailAreaData.id;
			// 入力済みの内容を保持
			updateZokuseiListAll($scope);

			// 通信用パラメータの設定
			var param = {
				'langKey': CommonService.getLanguageKey($scope),
				'id': fileId,
				'bunshoshuId': $scope.$parent.detailAreaData.bunshoshuId
			};
			var dtlInfo = {
				fileId: fileId
			};
			// プレビューエリア非表示
			CommonService.previewAreaCheck(true);
			// 詳細情報の取得
			CommonService.httpModal($scope, ACTION_SEARCH_DETAIL, param, true,
				function(resolveData) {
					// 成功処理
					if (!CommonService.isError(resolveData)) {
						// プレビューエリア表示
						CommonService.previewAreaCheck(false);
						// 取得データの設定
						$scope.$parent.detailAreaData.zokuseiList = angular.copy(resolveData.fileInfo.zokuseiList);
						angular.forEach($scope.$parent.detailAreaData.zokuseiList, function(zokusei) {
							if (ZokuseiSearchService.isZokuseiDataTypeKbnDate(zokusei.dataTypeKbn)) {
								// 日付系の場合、項目変換
								if (zokusei.kihonZokuseiSbt == Const.KIHON_ZOKUSEI_SBT_UPLOAD_DATE || zokusei.kihonZokuseiSbt == Const.KIHON_ZOKUSEI_SBT_FILE_UPDATE) {
									zokusei.kbn = CommonService.dbToDatepicker(zokusei.kbn, true);
								} else {
									zokusei.kbn = CommonService.dbToDatepicker(zokusei.kbn);
								}
							} else if (ZokuseiSearchService.isZokuseiDataTypeSelect(zokusei.dataTypeKbn)) {
								// 選択肢系の場合、属性選択肢情報取得
								if (zokusei.sentakushiDataShutokusakiKbn == Const.SENTAKUSHI_DATA_SHUTOKUSAKI_KBN_USER_MASTER) {
									zokusei.zokuseiSentakushi = $scope.userMaster;
								} else if (zokusei.sentakushiDataShutokusakiKbn == Const.SENTAKUSHI_DATA_SHUTOKUSAKI_KBN_BUNSHOSHU) {
									zokusei.zokuseiSentakushi = $scope.$parent.bunshoshuList;
								}
								// 複数選択肢の場合、取得した選択肢を使用してタグ項目の変更
								if (ZokuseiSearchService.isZokuseiDataTypeKbnSelectMulti(zokusei.dataTypeKbn)) {
									zokusei.kbn = CommonService.dbToChoiceTag(zokusei.kbn, zokusei.zokuseiSentakushi, 'id');
								}
							}
						});
						// 入力済みの内容を反映
						angular.forEach($scope.$parent.detailAreaData.zokuseiListAll, function(input) {
							if (input.zokuseiId) {
								for (var idx in $scope.$parent.detailAreaData.zokuseiList) {
									if ($scope.$parent.detailAreaData.zokuseiList[idx].zokuseiId == input.zokuseiId) {
										$scope.$parent.detailAreaData.zokuseiList[idx] = input;
										break;
									}
								}
							} else if (input.id && angular.isDefined(input.kbn)) {
								for (var idx in $scope.$parent.detailAreaData.zokuseiList) {
									if ($scope.$parent.detailAreaData.zokuseiList[idx].zokuseiId == input.id) {
										$scope.$parent.detailAreaData.zokuseiList[idx].kbn = input.kbn;
										break;
									}
								}
							}
						});
						// 「ng-class="{'input-group': {{$first}} ...」ではクラスが反映されないため
						// first変数を追加して、この変数で処理させる。
						var bFirst = true;
						angular.forEach($scope.$parent.detailAreaData.zokuseiList, function(zokusei) {
							zokusei.first = (zokusei.zokuseiId != null) ? bFirst : false;
							bFirst = false;
						});
					} else {
						// 失敗処理
						CommonService.errorProcess($scope, resolveData, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DETAIL, dtlInfo);
					}
				},
				function(rejectData, state) {
					// 失敗処理
					CommonService.systemError($scope, state, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DETAIL, dtlInfo);
				}
			);
		},
		// [コメントエリア]
		// 「オリジナルファイルダウンロード」ボタン押下処理
		originalFileDownload: function($scope, id, hanKanriId, fileName, kbn) {
			// 確認メッセージ
			var promise = CommonService.dispMessage($scope, 'Q00001', ['download']);
			promise.then(
				function(result) {
					// 通信用パラメータの設定
					var param = {
						'langKey': CommonService.getLanguageKey($scope),
						'id': id,
						'hanKanriId': hanKanriId,
						'downloadKbn': kbn
					};
					var dtlInfo = {
						hanKanriId: hanKanriId,
						downloadKbn: kbn
					};
					// ワークフロー画面の場合、ワークフローIDを付与
					if (isActiveTabWorkflow($scope)) {
						param['workflowId'] = $scope.$parent.listAreaSelectData.workflowId;
						dtlInfo.workflowId = $scope.$parent.listAreaSelectData.workflowId;
					}

					// iOS の場合新規タブを開く
					var win = CommonService.windowOpen($scope);

					// 詳細情報の取得
					CommonService.httpModal($scope, ACTION_ORIGINALFILE_DOWNLOAD, param, false,
						function(resolveData) {
							// 成功処理
							// システム操作ログ登録（成功）
							var promiseRes = CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DOWNLOAD, dtlInfo, Const.SOSA_LOG_SOSA_DTL_KBN_DOWNLOAD_VERSION_SPECIFICATION);
							promiseRes.then(
								function() {
									CommonService.linkDownload($scope, resolveData, fileName, win);
								}
							) 
						},
						function(rejectData, state) {
							// 失敗処理
							if (state != 'cancel') {
								// 失敗処理
								var reader = new FileReader();
								reader.onload = function(re) {
									var errorJson = {};
									// エラー情報の生成
									errorJson.errorInfo = JSON.parse(re.target.result);
									if (errorJson.errorInfo.code == 'W00021') {
										CommonService.errorProcess($scope, errorJson, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DOWNLOAD, dtlInfo, Const.SOSA_LOG_SOSA_DTL_KBN_DOWNLOAD_VERSION_SPECIFICATION)
											.then(
											function(result) {
												// 一覧エリアをリフレッシュ
												$scope.onListRefresh();
											}
										)
									} else {
										// 失敗処理
										if (errorJson.errorInfo.errorInfo) {
											CommonService.errorProcess($scope, errorJson.errorInfo, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DOWNLOAD, dtlInfo, Const.SOSA_LOG_SOSA_DTL_KBN_DOWNLOAD_VERSION_SPECIFICATION);
										} else {
											CommonService.errorProcess($scope, errorJson, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DOWNLOAD, dtlInfo, Const.SOSA_LOG_SOSA_DTL_KBN_DOWNLOAD_VERSION_SPECIFICATION);
										}
									}
								};
								var blob = new Blob([rejectData], { type: "text/plain" });
								reader.readAsText(blob);
							}
							if (win != null) {
								win.close();
							}
						},
						{responseType: 'arraybuffer'}
					);
				}
			)
		},
		// 「コメント登録」ボタン押下処理
		commentSave: function($scope) {
			// 確認メッセージ
			var promise = CommonService.dispMessage($scope, 'Q00001', ['commentRegister']);
			promise.then(
				function(result) {
					// 通信用パラメータの設定
					var param = {
						'langKey': CommonService.getLanguageKey($scope),
						'fileId': $scope.$parent.detailAreaData.id,
						'kakuninFlg': $scope.$parent.detailAreaData.createUserId == CommonService.getUserInfo(Const.USER_SETTEI_ID),
						'comment': $scope.comment
					};
					// ワークフロー画面の場合、ワークフローIDを付与
					if (isActiveTabWorkflow($scope)) {
						param['workflowId'] = $scope.$parent.listAreaSelectData.workflowId;
					}
					// 詳細情報の取得
					CommonService.httpModal($scope, ACTION_COMMENT_SAVE, param, true,
						function(resolveData) {
							// 成功処理
							if (!CommonService.isError(resolveData)) {
								$scope.comment = null;
								// コメントの取得
								// 登録したコメントの送信
								socket.emit('send-comment', resolveData);
								if (param.kakuninFlg) {
									// パラメータ.確認フラグが true の場合、未確認コメント件数の更新を行う。
									StorageService.setData('headerNonCheckCommentCnt', resolveData.totalRowCount);
								} else {
									// パラメータ.確認フラグが false の場合、通知処理を行う。
									socket.emit('send-comment-user', $scope.$parent.detailAreaData.createUserId);
								}
							} else {
								if (resolveData.errorInfo.code == 'W00021') {
									var promise = CommonService.dispMessage($scope, resolveData.errorInfo.code, null, resolveData.errorInfo.message);
									promise.then(
										function(result) {
											// 一覧エリアをリフレッシュ
											$scope.onListRefresh();
										}
									)
								} else {
									// 失敗処理
									CommonService.errorProcess($scope, resolveData);
								}
							}
						},
						function(rejectData, state) {
							// 失敗処理
							CommonService.systemError($scope, state);
						}
					);
				}
			)
		},
		// コメント表示チェック変更処理
		toggleComment: function($scope) {
			getComment($scope);
		},
		// コメント表示チェック変更処理
		scrollComment: function($scope) {
			getComment($scope, true);
		},
		// 「ワークフローファイル確認」ボタン押下処理
		workflowFilePdfEdit: function($scope, workflowId, fileId, jotaiKanriId) {
			// 「PDF編集画面」に遷移
			StorageService.setParameter(Const.PATH_PDF_EDIT, {workflowId: workflowId, id: fileId, jotaiKanriId: jotaiKanriId});
			$location.path(Const.PATH_PDF_EDIT);
		},
		// 「ワークフローファイルダウンロード」ボタン押下処理
		workflowFileDownload: function($scope, workflowId, fileId, fileName, sbt) {
			// 確認メッセージ
			var promise = CommonService.dispMessage($scope, 'Q00001', ['download']);
			promise.then(
				function(result) {
					// 通信用パラメータの設定
					var param = {
						'langKey': CommonService.getLanguageKey($scope),
						'id': workflowId,
						'fileId': fileId,
						'sbt': sbt
					};
					var dtlInfo = {
						workflowId: workflowId
					};
					if (sbt == Const.WORKFLOW_DOWNLOAD_APPLICATION) {
						// ワークフロー申請時の添付ファイルをダウンロードした時
						dtlInfo["workflowShinseiFileId"] = fileId;
						sosaDtlKbn = Const.SOSA_LOG_SOSA_DTL_KBN_DOWNLOAD_WORKFLOW_APPLIED_ATTACHMENT_FILE;
					} else {
						// ワークフロー承認時の添付ファイルをダウンロードした時
						dtlInfo["workflowJotaiKanriTempuFileId"] = fileId;
						sosaDtlKbn = Const.SOSA_LOG_SOSA_DTL_KBN_DOWNLOAD_WORKFLOW_APPROVED_ATTACHMENT_FILE;
					}
					var sosaDtlKbn = sbt == Const.WORKFLOW_DOWNLOAD_APPLICATION ? Const.SOSA_LOG_SOSA_DTL_KBN_DOWNLOAD_WORKFLOW_APPLIED_ATTACHMENT_FILE : Const.SOSA_LOG_SOSA_DTL_KBN_DOWNLOAD_WORKFLOW_APPROVED_ATTACHMENT_FILE;

					// iOS の場合新規タブを開く
					var win = CommonService.windowOpen($scope);

					// 詳細情報の取得
					CommonService.httpModal($scope, ACTION_WORKFLOW_DOWNLOAD, param, false,
						function(resolveData) {
							// 成功処理
							// システム操作ログ登録（成功）
							var promiseRes = CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DOWNLOAD, dtlInfo, sosaDtlKbn);
							promiseRes.then(
								function() {
									CommonService.linkDownload($scope, resolveData, fileName, win);
								}
							)
						},
						function(rejectData, state) {
							// 失敗処理
							if (state != 'cancel') {
								// 失敗処理
								var reader = new FileReader();
								reader.onload = function(re) {
									var errorJson = {};
									// エラー情報の生成
									errorJson.errorInfo = JSON.parse(re.target.result);
									// 失敗処理
									if (errorJson.errorInfo.errorInfo) {
										CommonService.errorProcess($scope, errorJson.errorInfo, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DOWNLOAD, dtlInfo, sosaDtlKbn);
									} else {
										CommonService.errorProcess($scope, errorJson, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DOWNLOAD, dtlInfo, sosaDtlKbn);
									}
								};
								var blob = new Blob([rejectData], { type: "text/plain" });
								reader.readAsText(blob);
							}
							if (win != null) {
								win.close();
							}
						},
						{responseType: 'arraybuffer'}
					);
				}
			)
		},
		// 「下書き削除」ボタン押下処理
		draftCancel: function($scope, id) {
			// 確認メッセージ
			var promise = CommonService.dispMessage($scope, 'Q00001', ['deleteDraft']);
			promise.then(
				function(result) {
					// 通信用パラメータの設定
					var param = {
						'langKey': CommonService.getLanguageKey($scope),
						'id': id
					};
					var dtlInfo = {
						workflowId: param.id
					}
					// 詳細情報の取得
					CommonService.httpModal($scope, ACTION_WORKFLOW_DRAFT_CANCEL, param, true,
						function(resolveData) {
							// 成功処理
							if (!CommonService.isError(resolveData)) {
								var promise = CommonService.dispMessage($scope, 'I00001', ['draftDelete']);
								promise.then(
									function(result) {
										// 検索エリア(ワークフロー)情報取得
										getSearchAreaData($scope, Const.GET_KENSAKU_TAB_PATTERN_WORKFLOW);
										// 一覧エリアをリフレッシュ
										getWorkflowListData($scope);
									}
								);
								// システム操作ログ登録（成功）
								CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DELETE_DRAFT, dtlInfo);
							} else {
								// 失敗処理
								CommonService.errorProcess($scope, resolveData, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DELETE_DRAFT, dtlInfo);
							}
						},
						function(rejectData, state) {
							// 失敗処理
							CommonService.systemError($scope, state, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_DELETE_DRAFT, dtlInfo);
						}
					);
				}
			)
		},
		// 「削除」ボタン押下処理
		completedDelete: function($scope, id) {
			// 確認メッセージ
			var promise = CommonService.dispMessage($scope, 'Q00001', ['delete']);
			promise.then(
				function(result) {
					// 通信用パラメータの設定
					var param = {
						'langKey': CommonService.getLanguageKey($scope),
						'id': id
					};
					var dtlInfo = {
						workflowId: param.id
					}
					// 詳細情報の取得
					CommonService.httpModal($scope, ACTION_WORKFLOW_COMPLETED_DELETE, param, true,
						function(resolveData) {
							// 成功処理
							if (!CommonService.isError(resolveData)) {
								var promise = CommonService.dispMessage($scope, 'I00001', ['delete']);
								promise.then(
									function(result) {
										// 検索エリア(ワークフロー)情報取得
										getSearchAreaData($scope, Const.GET_KENSAKU_TAB_PATTERN_WORKFLOW);
										// 一覧エリアをリフレッシュ
										getWorkflowListData($scope);
									}
								);
								// システム操作ログ登録（成功）
								CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_COMPLETE_DELETE, dtlInfo);
							} else {
								// 失敗処理
								CommonService.errorProcess($scope, resolveData, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_COMPLETE_DELETE, dtlInfo);
							}
						},
						function(rejectData, state) {
							// 失敗処理
							CommonService.systemError($scope, state, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_COMPLETE_DELETE, dtlInfo);
						}
					);
				}
			)
		},
		// 「承認」事前処理
		approvalBefore: function($scope) {
			angular.forEach($scope.shonin_gridOptions.data, function(data) {
				// ファイル存在フラグを初期化
				data.existErrFlg = false;
			});

			// ファイルサイズ取得可能ブラウザはファイル読込を行わない
			// 添付ファイルが存在しない場合存在チェックを行わない
			if (!CommonService.isFileSizeCanNotGetBrowser() || $scope.shonin_gridOptions.data.length == 0) {
				this.approval($scope);
				return;
			}

			var thisService = this;
			var fileDeferred = [];
			angular.forEach($scope.shonin_gridOptions.data, function(data) {
				// 処理完了確認用に配列にセット
				fileDeferred.push(setExistErrFlg(data));
			});
			$.when.apply($, fileDeferred).
				then(function() {
					// 処理完了後に承認処理を行う
					thisService.approval($scope);
			});
		},
		// 承認処理
		approval: function($scope) {
			// チェック処理
			if (checkApproval($scope)) {
				return;
			}
			// 確認メッセージ
			var allConfirmationFlg = true;
			// 申請ファイルリスト
			angular.forEach($scope.$parent.applicationInfo.shinseiFileList, function(data) {
				if (!data.kakuninFlg) {
					allConfirmationFlg = false;
				}
			});
			if (allConfirmationFlg) {
				// 申請ファイル全て確認済み
				var promise = CommonService.dispMessage($scope, 'Q00001', ['approval']);
			} else {
				// 未確認の申請ファイル有り
				var promise = CommonService.dispMessage($scope, 'Q00003');
			}
			promise.then(
				function(result) {
					// OKの場合
					var approveData = {};
					approveData['workflowId'] = $scope.$parent.applicationInfo.id;
					approveData['workflowJotaiKanriId'] = $scope.$parent.authInfo.processingWorkflowJotaiKanriId;
					approveData['fileList'] = $scope.shonin_gridOptions.data;
					approveData['comment'] = $scope.$parent.workflowStatusComment;

					var template = "app/main-modal/main-modal.html";
					var controller = "MainModalController";
					var params = {
						approveData: approveData
					};
					var promise = CommonService.openModal($scope, template, controller, null, params);
					promise.then(
						// 承認成功処理
						function(result) {
							var promiseRes;
							if (result.code) {
								promiseRes = CommonService.dispMessage($scope, result.code, null, result.message);
							} else {
								promiseRes = CommonService.dispMessage($scope, "I00001", ['approval']);
							}
							promiseRes.then(
								function(result) {
									// 検索エリア(ワークフロー)情報取得
									getSearchAreaData($scope, Const.GET_KENSAKU_TAB_PATTERN_WORKFLOW);
									// 一覧エリアをリフレッシュ
									getWorkflowListData($scope);
								}
							);
						}
					).catch(
						// 承認失敗処理
						function(result) {
							if (CommonService.isError(result)) {
								CommonService.errorProcess($scope, result);
							}
						}
					);
				}
			)
		},
		// 「確認」ボタン押下処理
		confirmation: function($scope) {
			// 確認メッセージ
			var promise = CommonService.dispMessage($scope, 'Q00001', ['executeConfirmationProcess']);
			promise.then(
				function(result) {
					// 通信データの設定
					var data = {
						'workflowId': $scope.$parent.applicationInfo.id,
						'workflowJotaiKanriId': $scope.$parent.authInfo.processingWorkflowJotaiKanriId,
						'comment': $scope.$parent.workflowStatusComment
					}
					// 通信用パラメータの設定
					var param = {
						'langKey': CommonService.getLanguageKey($scope),
						'data': data
					};
					// 詳細情報の取得
					CommonService.httpModal($scope, ACTION_WORKFLOW_CONFIRM, param, true,
						function(resolveData) {
							// 成功処理
							if (!CommonService.isError(resolveData)) {
								if (resolveData.code) {
									// メール送信エラーの場合
									var promise = CommonService.dispMessage($scope, resolveData.code, null, resolveData.message);
								} else {
									var promise = CommonService.dispMessage($scope, 'I00001', ['confirmationProcess']);
								}
								promise.then(
									function(result) {
										// 検索エリア(ワークフロー)情報取得
										getSearchAreaData($scope, Const.GET_KENSAKU_TAB_PATTERN_WORKFLOW);
										// 一覧エリアをリフレッシュ
										getWorkflowListData($scope);
									}
								)
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
			)
		},
		// 「却下」ボタン押下処理
		dismissal: function($scope) {
			// 確認メッセージ
			var promise = CommonService.dispMessage($scope, 'Q00001', ['dismiss']);
			promise.then(
				function(result) {
					// 通信データの設定
					var data = {
						'workflowId': $scope.$parent.applicationInfo.id,
						'workflowJotaiKanriId': $scope.$parent.authInfo.processingWorkflowJotaiKanriId,
						'comment': $scope.$parent.workflowStatusComment
					}
					// 通信用パラメータの設定
					var param = {
						'langKey': CommonService.getLanguageKey($scope),
						'data': data
					};
					// 詳細情報の取得
					CommonService.httpModal($scope, ACTION_WORKFLOW_DISMISS, param, true,
						function(resolveData) {
							// 成功処理
							if (!CommonService.isError(resolveData)) {
								if (resolveData.code) {
									// メール送信エラーの場合
									var promise = CommonService.dispMessage($scope, resolveData.code, null, resolveData.message);
								} else {
									var promise = CommonService.dispMessage($scope, 'I00001', ['dismiss']);
								}
								promise.then(
									function(result) {
										// 検索エリア(ワークフロー)情報取得
										getSearchAreaData($scope, Const.GET_KENSAKU_TAB_PATTERN_WORKFLOW);
										// 一覧エリアをリフレッシュ
										getWorkflowListData($scope);
									}
								)
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
			)
		},
		// 「申請の取消」ボタン押下処理
		applicationCancel: function($scope) {
			// 確認メッセージ
			var promise = CommonService.dispMessage($scope, 'Q00001', ['theApplicationCancel']);
			promise.then(
				function(result) {
					// 通信用パラメータの設定
					var param = {
						'langKey': CommonService.getLanguageKey($scope),
						'id': $scope.$parent.applicationInfo.id
					};
					var dtlInfo = {
						workflowId: param.id
					};
					// 詳細情報の取得
					CommonService.httpModal($scope, ACTION_WORKFLOW_APPLICATION_CANCEL, param, true,
						function(resolveData) {
							// 成功処理
							if (!CommonService.isError(resolveData)) {
								if (resolveData.code) {
									// メール送信エラーの場合
									var promise = CommonService.dispMessage($scope, resolveData.code, null, resolveData.message);
								} else {
									var promise = CommonService.dispMessage($scope, 'I00001', ['applicationCancel']);
								}
								promise.then(
									function(result) {
										// 検索エリア(ワークフロー)情報取得
										getSearchAreaData($scope, Const.GET_KENSAKU_TAB_PATTERN_WORKFLOW);
										// 一覧エリアをリフレッシュ
										getWorkflowListData($scope);
									}
								);
								// システム操作ログ登録（成功）
								CommonService.systemSosaLogSuccess($scope, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_CANCEL, dtlInfo);
							} else {
								// 失敗処理
								CommonService.errorProcess($scope, resolveData, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_CANCEL, dtlInfo);
							}
						},
						function(rejectData, state) {
							// 失敗処理
							CommonService.systemError($scope, state, Const.SOSA_LOG_GAMEN_KBN_MAIN, Const.SOSA_LOG_SOSA_KBN_CANCEL, dtlInfo);
						}
					);
				}
			)
		},
		// 「承認の取消/確認の取消」ボタン押下処理
		approvalConfirmationCancel: function($scope, statusKbn) {
			// 確認メッセージ
			if (statusKbn == Const.WORKFLOW_STATUS_APPROVAL_CANCEL) {
				var promise = CommonService.dispMessage($scope, 'Q00001', ['theApprovalCancel']);
				$scope.pdfPasswordCheckToken = 'approvalCancel';
			} else {
				var promise = CommonService.dispMessage($scope, 'Q00001', ['theConfirmationCancel']);
				$scope.pdfPasswordCheckToken = 'confirmationCancel';
			}
			promise.then(
				function(result) {
					// パスワード入力チェックデータ作成
					$scope.pdfPasswordCheckList = [];
					// 申請ファイルの設定
					$scope.pdfPasswordCheckList = setPdfPasswordCheckList($scope, $scope.$parent.applicationInfo.shinseiFileList, $scope.pdfPasswordCheckList, Const.PDF_PASSWORD_CONFIRM_MODE_CONFIRMATION_WORKFLOW_APPROVAL);
					// 関連ファイルの設定
					$scope.pdfPasswordCheckList = setPdfPasswordCheckList($scope, $scope.$parent.applicationInfo.kanrenFileList, $scope.pdfPasswordCheckList, Const.PDF_PASSWORD_CONFIRM_MODE_CONFIRMATION_WORKFLOW_APPROVAL);
					// PDFパスワードの入力が必要な場合、PDFパスワード確認画面を表示する。
					if ($scope.pdfPasswordCheckList.length) {
						// 画面遷移元を設定
						$scope.pdfPasswordConfirmMode = Const.PDF_PASSWORD_CONFIRM_MODE_CONFIRMATION_WORKFLOW_APPROVAL;
						var template = "app/password-input-list-modal/password-input-list-modal.html";
						var controller = "PasswordInputListModalController";
						var size = "lg";
						var promise = CommonService.openModal($scope, template, controller, size);
						promise.then(
							function(resolveData) {
								// パスワード入力済み
								approvalConfirmationCancel($scope, statusKbn);
							},
							function() {
							}
						);
					} else {
						approvalConfirmationCancel($scope, statusKbn);
					}
				}
			)
		},
		// 「差し戻し」ボタン押下処理
		remand: function($scope, stepNo) {
			// 確認メッセージ
			var promise = CommonService.dispMessage($scope, 'Q00001', ['theRemand']);
			promise.then(
				function(result) {
					// 通信データの設定
					var data = {
						'workflowId': $scope.$parent.applicationInfo.id,
						'workflowJotaiKanriId': $scope.$parent.authInfo.processingWorkflowJotaiKanriId,
						'stepNo': stepNo,
						'comment': $scope.$parent.workflowStatusComment
					}
					// 通信用パラメータの設定
					var param = {
						'langKey': CommonService.getLanguageKey($scope),
						'data': data
					};
					// 詳細情報の取得
					CommonService.httpModal($scope, ACTION_WORKFLOW_REMAND, param, true,
						function(resolveData) {
							// 成功処理
							if (!CommonService.isError(resolveData)) {
								if (resolveData.code) {
									// メール送信エラーの場合
									var promise = CommonService.dispMessage($scope, resolveData.code, null, resolveData.message);
								} else {
									var promise = CommonService.dispMessage($scope, 'I00001', ['remand']);
								}
								promise.then(
									function(result) {
										// 検索エリア(ワークフロー)情報取得
										getSearchAreaData($scope, Const.GET_KENSAKU_TAB_PATTERN_WORKFLOW);
										// 一覧エリアをリフレッシュ
										getWorkflowListData($scope);
									}
								)
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
			)
		},
		// 「添付ファイル登録」処理
		setInputFile: function($scope) {
			var files = $scope.files;
			if (files && files.length) {
				angular.forEach(files, function(file) {
					var type = "";
					var message = "";
					var fileSizeOver = false;
					var addFile = {};
					// ファイルサイズオーバーチェック
					if (CommonService.isFileSizeOver(file.size)) {
						type = Const.STATUS_ERROR;
						fileSizeOver = true;
						message = $translate.instant("file_size_over");
					}
					// ファイル情報の設定
					addFile['id'] = -($scope.$parent.fileId);
					addFile['name'] = file.name;
					addFile['status'] = type;
					addFile['errorMessage'] = message;
					addFile['fileSizeOver'] = fileSizeOver;
					addFile['file'] = file;
					// アップロードデータ設定
					$scope.$parent.shoninFileList.push(addFile);
					$scope.shonin_gridOptions.data = $scope.$parent.shoninFileList;
					$scope.$parent.fileId++;
				});
			}
		},
		getWorkflowShinseiFileGridSelectedData: function($scope) {
			var data = getWorkflowShinseiFileGridSelectedData($scope);
			if (data && data.length) {
				return true;
			} else {
				return false;
			}
		},
		updateBunshoshu: function($scope) {
			if ($location.$$path == Const.PATH_MAIN && !$('#listBunshoshu').is(':visible')) {
				// 一覧の文書種プルダウンが表示されてない場合は文書種を更新する
				$scope.$parent.bunshoshu = CommonService.getUserInfo(Const.USER_SETTEI_BUNSHOSHU);
			}
		},
		checkStatus: function($scope, entity) {
			if (entity.checkoutFlg) {
				return STATUS_CHECKOUT_FLG;
			} else if (entity.workflowShinseiChuFlg) {
				 return STATUS_WORKFLOWSHINSEICHU_FLG;
			} else {
				return '';
			}
		},
		changeKokaiFlg: function($scope) {
			if ($scope.$parent.detailAreaData.kokaiFlg) {
				// 「公開する」は以降の処理は行わない
				return;
			}

			// 「公開しない」に変更した場合、公開日時と公開前アクセス可能者をクリア
			// (公開日時のクリアは、「日時をクリア」ボタン押下時の処理を実行)
			$scope.onClearKokaiTimestamp();
			$scope.$parent.detailAreaData.kokaimaeAccessKaUser.data = null;
		},
		clearKokaiTimestamp: function($scope) {
			// 現状、「公開日付」が空なのかどうかを保持
			// （空じゃない場合、別途「公開時間」のクリア処理を実行しなければならない）
			var dateEmpty = CommonService.isEmpty($scope.$parent.detailAreaData.kokaiTimestamp.date);

			// 「公開日付」をクリア
			$scope.$parent.detailAreaData.kokaiTimestamp.date = "";

			// 「公開時間」をクリア
			if (dateEmpty) {
				clearKokaiTime($scope, true);
			}
		},
		watchKokaiDate: function($scope, newValue, oldValue) {
			if (oldValue === undefined || newValue === undefined) {
				return;
			}
	
			// 日付がクリアされたら、時間もクリア
			if (!CommonService.isEmpty(oldValue)
				&& CommonService.isEmpty(newValue)) {
				clearKokaiTime($scope, true);
			}

			// 日付 10 桁入力されたが時間がクリアされた状態の場合、時間に初期値をセット
			if (!CommonService.isEmpty(newValue)
				&& newValue.length == 10
				&& CommonService.isEmpty($scope.$parent.detailAreaData.kokaiTimestamp.time)) {
				clearKokaiTime($scope, false);
			}

			// 日付が変更された場合、日時オブジェクトを更新
			if (CommonService.isEmpty(newValue) 
				|| (!CommonService.isEmpty(newValue) && newValue.length == 10)) {
				changeDispKokaiTimestamp($scope.$parent.detailAreaData.kokaiTimestamp);
			}
		},
		watchKokaiTime: function($scope, newValue, oldValue) {
			if (oldValue === undefined || newValue === undefined) {
				return;
			}
	
			// 共に null の場合は以降の処理は実施しない
			if (CommonService.isEmpty(oldValue) && CommonService.isEmpty(newValue)) {
				return;
			}

			// 時間が変更された場合、日時オブジェクトを更新
			if ((CommonService.isEmpty(oldValue) && !CommonService.isEmpty(newValue))
				|| (!CommonService.isEmpty(oldValue) && CommonService.isEmpty(newValue))
				|| (oldValue.getTime() != newValue.getTime())) {
				changeDispKokaiTimestamp($scope.$parent.detailAreaData.kokaiTimestamp);
			}
		},
		watchKokaiDispTimestamp: function($scope, newValue, oldValue) {
			if (oldValue === undefined || newValue === undefined) {
				return;
			}

			// 編集モードではない場合、移行の処理は実施しない
			if (!$scope.isEditMode()) {
				return;
			}

			// 公開日時が変更された場合、公開前アクセス可能者をクリアする
			if (oldValue != newValue) {
				$scope.$parent.detailAreaData.kokaimaeAccessKaUser.data = null;
			}
		}
	}
});
