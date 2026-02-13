Imports System.IO
Imports System.Text
Imports BCrypt.Net
Imports System.Reflection

Public Class TECA_sets

    '================操作対象ファイル群パスを定義するクラス================
    Public Const API_PATH As String = "C:\TeCA\api"
    Public Const WEB_PATH As String = "C:\TeCA\web"
    Public Const DB_IPaddr As String = "127.0.0.1"

    Public Const AllowedPWD As String = ".deny"
    Public Shared Tomcat_PATH As String = Misc.ExtractInstallPathFromPath(Environment.GetEnvironmentVariable("PATH", EnvironmentVariableTarget.Machine).ToString, "tomcat")

    Public Shared TeCAappPath As String = Tomcat_PATH & "\webapps\api#teca"
    Public Shared NDMSroot As String = TeCAappPath & "\WEB-INF\\classes\jp\co\photron\ndms"

    Public Const ApacheConf_PATH As String = WEB_PATH & "\Apache24\conf"
    Public Const ServerWebPath As String = WEB_PATH & "\web\server\config\environment"
    Public Const ClientWebPath As String = WEB_PATH & "\web\client"
    Public Const webVerPath As String = WEB_PATH & "\web\server\api\common\const.js"

    Public Const SelectFileJS As String = ClientWebPath & "\app\select-file\select-file.service.js"
    Public Const SelectFileHTML As String = ClientWebPath & "\app\select-file\select-file.html"
    Public Const SelectFileCSS_Width As String = ClientWebPath & "\components\bootstrap\dist\css\bootstrap.min.css"
    Public Const KOKAI_FLG_File As String = ClientWebPath & "\app\upload\upload.service.js"
    Public Const Scrollpath As String = ClientWebPath & "\app\app.js"
    Public Const mainHTMLpath As String = ClientWebPath & "\app\main\main.html"
    Public Const mainSVCjs_path As String = ClientWebPath & "\app\main\main.service.js"
    Public Const mainCSS_path As String = ClientWebPath & "\app\main\main.css"
    Public Const mainJS_path As String = ClientWebPath & "\app\main\main.js"
    Public Const preViewJS As String = ClientWebPath & "\components\angular-pdfjs-viewer\bower_components\pdf.js-viewer\pdf.js"

    '公開フラグ連携関連パス
    Public Const WebPublicSymc_AttrSVCJS As String = ClientWebPath & "\app\_admin\attribute\attribute.service.js"
    Public Const WebPublicSymc_DetailHTML As String = ClientWebPath & "\app\_admin\attribute\detail.html"
    Public Shared WebPublicSymc_MZMapperXML As String = NDMSroot & "\mapper\db2\MZokuseiMapper.xml"
    Public Shared WebPublicSymc_MZMapperCLS As String = NDMSroot & "\mapper\db2\MZokuseiMapper.class"
    Public Shared WebPublicSymc_attrRscCLS As String = NDMSroot & "\service\attribute\AttributeResource.class"
    Public Shared WebPublicSymc_attrSvcImplCLS As String = NDMSroot & "\service\attribute\AttributeServiceImpl.class"
    Public Shared WebPublicSymc_MZokuseiCLS As String = NDMSroot & "\model\MZokusei.class"

    Public Const IDpath As String = ServerWebPath & "\production.js"

    Public Shared mailPropPath As String = TeCAappPath & "\WEB-INF\classes\mail.properties"
    Public Shared pdfconvpropPath As String = TeCAappPath & "\Web-INF\classes\pdf_converter.properties"

    'ID,SecretIDを取得
    Public Shared ReadOnly ClientID As String = TXTFunc.IDSearch(IDpath, "clientId", QUOTA.Apostrofy)
    Public Shared ReadOnly SecretID = TXTFunc.IDSearch(IDpath, "clientSecret", QUOTA.Apostrofy)

    'TeCA環境かどうかを判断するサービスの名称
    Public Shared ReadOnly TeCAServices As String() = {"tomcat", "apache2.4", "postgresql"}

    'スクロールバッファの現在値の取得と、変更先の一覧を定義
    Public Shared ReadOnly vScrollArray As String() = {"EXCESS_ROWS_FILE_LIST",
                                    "EXCESS_ROWS_WORKFLOW_LIST",
                                    "EXCESS_ROWS_SHINSEI_FILE_LIST",
                                    "EXCESS_ROWS_UPLOAD_FILE_LIST",
                                    "EXCESS_ROWS_SEARCH_USER_LIST",
                                    "EXCESS_ROWS_SELECT_USER_LIST",
                                    "EXCESS_ROWS_PDF_PASSWORD_KAKUNIN_FILE_LIST"}

    '公開/非公開の検索キー定義
    Public Const DefaultKokai_key As String = "zokusei[IDX_ZOKUSEI.KOKAI]"

    'メール設定の項目リスト
    Public Shared ReadOnly mailPropArray As String() = {"mail.smtp.host",
                                    "mail.transport.protocol",
                                    "mail.smtp.port",
                                    "mail.smtp.connectiontimeout",
                                    "mail.smtp.timeout",
                                    "mail.smtp.writetimeout",
                                    "mail.smtp.starttls.enable",
                                    "mail.smtp.auth",
                                    "user",
                                    "password",
                                    "from.name"}

    '操作タイムアウトの変更先リスト
    Public Shared ReadOnly TOUTArray As String(,) = {
                                     {Tomcat_PATH + "\conf\web.xml", "<session-timeout>", QUOTA.WebXLM},
                                     {WEB_PATH + "\web\server\config\environment\production.js", "sessionTimeout:", QUOTA.prodJS},
                                     {WEB_PATH + "\web\server\config\environment\development.js", "sessionTimeout:", QUOTA.prodJS},
                                     {Tomcat_PATH + "\webapps\api#teca\WEB-INF\beans.xml", "refreshTokenLifetime", QUOTA.beansXML}
                                     }

    Public Const connStr As String = "Host=localhost;Username=postgres;Password=PCJJWEqb2d;Database=db2"
    Public Const connStrdb1 As String = "Host=localhost;Username=postgres;Password=PCJJWEqb2d;Database=db1"

    'SetLocal用定数群
    Public Shared ReadOnly SetLocalArray As String(,) = {
                                     {Tomcat_PATH & "\webapps\api#teca\WEB-INF\classes\db0.properties", "db0.url=jdbc:postgresql:", "db0.url=jdbc:postgresql://127.0.0.1:5432/db0"},
                                     {Tomcat_PATH & "\webapps\api#teca\WEB-INF\classes\db1.properties", "db1.url=jdbc:postgresql:", "db1.url=jdbc:postgresql://127.0.0.1:5432/db1"},
                                     {Tomcat_PATH & "\webapps\api#teca\WEB-INF\classes\db2.properties", "db2.url=jdbc:postgresql:", "db2.url=jdbc:postgresql://127.0.0.1:5432/db2"},
                                     {WEB_PATH & "\web\server\config\environment\production.js", "address", vbTab & vbTab & "address: '127.0.0.1',"}
                                     }

    'PDF_converter.propertiesの変更先リスト
    Public Shared ReadOnly pdfConvFtypeArray As String() = {"bmp=", "png=", "gif=", "tif=", "tiff=", "jpg=", "jpeg="}

    Public Class QUOTA
        Public Const ColonToCamma As Integer = 0  '      キーワード: 置換対象値,   【コロン～カンマ間が置換対象】
        Public Const Apostrofy As Integer = 1
        Public Const EqualToCR As Integer = 2
        Public Const prodJS As Integer = 3    ' [: 60 *]のよーにコロンで始まり、アスタで終わる文字
        Public Const beansXML As Integer = 4    ' [: 60 *]のよーにコロンで始まり、アスタで終わる文字
        Public Const WebXLM As Integer = 5    ' [>30<]   のよーに不等号で囲まれた文字
        Public Const WholeLine As Integer = 6    '       "キーワード": 置換対象値
    End Class

    Public Class GrabModeLineData
        Public Const isOFF As String = "   ""enableHandToolOnLoad"": false,"
        Public Const isON As String = "   ""enableHandToolOnLoad"": true,"
        Public Const keyword As String = "   ""enableHandToolOnLoad"":"
    End Class

End Class

''' <summary>
''' トリガーのSQL文を保持するクラス
''' </summary>
Public Class TRIGGERS
    Public TRIGGERS_SQL As New Dictionary(Of String, String) From {
        {"WKFL_Trigger", "CREATE TRIGGER trg_FUNC_SET_KOKAI AFTER UPDATE ON t_workflow FOR EACH ROW WHEN (NEW. kanryo_flg = TRUE) EXECUTE FUNCTION FUNC_SET_KOKAI();"},
        {"WKFL_TriggerFunc", "CREATE FUNCTION FUNC_SET_KOKAI() RETURNS TRIGGER AS $$" &
                            "  DECLARE" &
                            "    kokaiFile_ids int[];" &
                            "  BEGIN" &
                            "    IF NEW.kanryo_flg = TRUE AND OLD.kanryo_flg IS DISTINCT FROM TRUE THEN" &
                            "       SELECT array_agg(file_id) INTO kokaiFile_ids FROM t_workflow_shinsei_file WHERE workflow_id = NEW.id;" &
                            "       UPDATE t_file_info  SET kokai_flg = TRUE WHERE id = ANY(kokaiFile_ids);" &
                            "    END IF;" &
                            "    RETURN NEW;" &
                            "  END;" &
                            "$$ LANGUAGE plpgsql;"
        },
        {"WKFL_TriggerDROP", "DROP FUNCTION FUNC_SET_KOKAI() CASCADE;"},
        {"KOKAI_OFF_Trigger", "CREATE TRIGGER trg_update_t_file_info AFTER INSERT On t_han_kanri For Each ROW EXECUTE Function update_t_file_info_kokai_flg();"},
        {"KOKAI_OFF_TriggerFunc", "CREATE OR REPLACE FUNCTION update_t_file_info_kokai_flg() RETURNS TRIGGER AS $$ " &
                                  "BEGIN " &
                                 "    UPDATE t_file_info SET kokai_flg = FALSE WHERE id = NEW.file_id; " &
                                 "    RETURN NEW; " &
                                 "END; " &
                                 "$$ LANGUAGE plpgsql; "},
        {"KOKAI_OFF_TriggerDROP", "DROP FUNCTION update_t_file_info_kokai_flg() CASCADE;"},
        {"PublicSync_MakeColumn", "DO $$" &
                                   "BEGIN " &
                                      "IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='m_zokusei' AND column_name='public_link_flg') THEN " &
                                           "ALTER TABLE public.m_zokusei ADD COLUMN public_link_flg BOOLEAN DEFAULT FALSE;" &
                                      "END IF;" &
                                    "END $$;"},
        {"PublicSync_TriggerFunc", "CREATE OR REPLACE FUNCTION public.func_file_kokai_linkage() " &
                                   "RETURNS TRIGGER AS $$ " &
                                   "DECLARE " &
                                       "target_zokusei_id text; " &
                                   "BEGIN " &
                                      "IF (OLD.kokai_flg Is DISTINCT FROM New.kokai_flg) Then " &
                                          "FOR target_zokusei_id IN " &
                                             "SELECT id::text FROM Public.m_zokusei WHERE public_link_flg = True And data_type_kbn = 4 And del_flg = False " &
                                          "LOOP " &
                                              "IF (NEW.zokusei ? target_zokusei_id) THEN " &
                                                  "NEW.zokusei := jsonb_set( " &
                                                      "NEW.zokusei,  " &
                                                      "ARRAY[target_zokusei_id], " &
                                                      "CASE WHEN NEW.kokai_flg THEN 'true'::jsonb ELSE 'false'::jsonb END " &
                                                   "); " &
                                                "END IF; " &
                                          "END LOOP; " &
                                       "END IF; " &
                                       "RETURN NEW; " &
                                     "END; " &
                                     "$$ LANGUAGE plpgsql; "},
        {"PublicSync_Trigger", "CREATE TRIGGER trg_file_kokai_linkage BEFORE UPDATE OF kokai_flg ON public.t_file_info FOR EACH ROW EXECUTE FUNCTION public.func_file_kokai_linkage();"},
        {"PublicSync_TriggerDROP", "DROP TRIGGER IF EXISTS trg_file_kokai_linkage ON public.t_file_info;" &
                                   "DROP FUNCTION IF EXISTS public.func_file_kokai_linkage();" &
                                    "DO $$ " &
                                    "BEGIN " &
                                    "  IF EXISTS(SELECT 1 FROM information_schema.columns " &
                                    "         WHERE table_name ='m_zokusei' AND column_name='public_link_flg') THEN " &
                                    "     ALTER TABLE Public.m_zokusei DROP COLUMN public_link_flg;" &
                                    "  END IF;" &
                                    "END $$;"}
         }

    '================編集内容を切り替える定数をDICで定義================
    Public Class SwitchWords
        Public SelectFileCSS_Width As New Dictionary(Of String, String) From {
        {"HTML1_Normal", "<div class=""modal-header"">"}, {"HTML1_Wide", "<div class=""modal-header modal-lg"">"},
        {"HTML2_Normal", "<div class=""modal-body select-file-modal"">"}, {"HTML2_Wide", "<div class=""modal-lg select-file-modal"">"},
        {"HTML3_Normal", "<div class=""modal-footer"">"}, {"HTML3_Wide", "<div class=""modal-footer modal-lg"" >"},
        {"JS1_Normal", "{ name: ""id"", displayName: $scope.gridTitle.id, width: '110', cellClass: 'text-right' }"}, {"JS1_Wide", "{ name: ""id"", displayName: $scope.gridTitle.id, width: '70', cellClass: 'text-right' }"},
        {"JS2_Normal", "{ name: String(Const.KIHON_ZOKUSEI_SBT_FILENAME), displayName: $scope.gridTitle.fileName, width: '240'}"}, {"JS2_Wide", "{ name: String(Const.KIHON_ZOKUSEI_SBT_FILENAME), displayName: $scope.gridTitle.fileName, width: '550'}"},
        {"CSS_Normal", "{.modal-dialog{width:600px;margin:30px auto}"}, {"CSS_Wide", "{.modal-dialog{width:900px;margin:30px auto}"}
    }
        Public pdfJS As New Dictionary(Of String, String) From {
        {"自動ズーム", "var DEFAULT_SCALE_VALUE = 'auto';"},
        {"実際のサイズ", "var DEFAULT_SCALE_VALUE = 'page-actual';"},
        {"高さに合わせる", "var DEFAULT_SCALE_VALUE = 'page-height';"},
        {"幅に合わせる", "var DEFAULT_SCALE_VALUE = 'page-width';"},
        {"ページのサイズに合わせる", "var DEFAULT_SCALE_VALUE = 'page-fit';"}
    }
        Public pdfJS_Grab As New Dictionary(Of Boolean, String) From {
        {True, """enableHandToolOnLoad"": true,"},
        {False, """enableHandToolOnLoad"": false,"}
    }
        Public ThmbNailCmds As New Dictionary(Of String, String) From {
        {"小", "UPDATE t_system_info SET info_val = '150' WHERE info_key ='THUMBNAIL_HEIGHT_MAX';"},
        {"標準", "UPDATE t_system_info SET info_val = '300' WHERE info_key ='THUMBNAIL_HEIGHT_MAX';"},
        {"大", "UPDATE t_system_info SET info_val = '600' WHERE info_key ='THUMBNAIL_HEIGHT_MAX';"}
    }
        Public ThmbNailvalues As New Dictionary(Of String, String) From {
        {"小", "150"},
        {"標準", "300"},
        {"大", "600"}
    }
        Public ReINDEXcmds As New Dictionary(Of String, String) From {
        {"pgrnDrop", "DROP EXTENSION IF EXISTS pgroonga CASCADE;"},
        {"pgrnCreate1", "CREATE EXTENSION pgroonga;"},
        {"index1", "CREATE INDEX IDX_FILE_INFO_1_P ON public.t_file_info USING pgroonga (zokusei)  WITH (tokenizer='TokenBigramSplitSymbolAlphaDigit');"},
        {"index2", "CREATE INDEX IDX_FILE_INFO_2_P ON public.t_file_info USING pgroonga (pdf_text_zembun_kensaku COLLATE pg_catalog.""default"") WITH (tokenizer='TokenBigramSplitSymbolAlphaDigit');"},
        {"index3", "CREATE INDEX IDX_FILE_INFO_3_P ON public.t_file_info USING pgroonga (pdf_edit_comment_zembun_kensaku COLLATE pg_catalog.""Default"") WITH (tokenizer='TokenBigramSplitSymbolAlphaDigit');"},
        {"index4", "CREATE INDEX IDX_FILE_INFO_4_P ON public.t_file_info USING pgroonga (pdf_text_old_zembun_kensaku COLLATE pg_catalog.""default"") WITH (tokenizer='TokenBigramSplitSymbolAlphaDigit');"}
    }
        Public ApacheAH00558 As New Dictionary(Of String, String) From {
        {"Default", "#ServerName www.example.com:80"},
        {"Fixed", "ServerName localhost:80"}
    }
        Public RasConv As New Dictionary(Of String, String) From {
        {"CAD", "pdfZConverter"},
        {"EX", "pdfAutoConverterEx"}
    }
        Public ClientIDPATH As New Dictionary(Of String, String) From {
                {"beansXML", TECA_sets.TeCAappPath & "\WEB-INF\beans.xml"},
                {"developmentJS", TECA_sets.ServerWebPath & "\development.js"},
                {"prodductionJS", TECA_sets.IDpath},
                {"testJS", TECA_sets.ServerWebPath & "\test.js"}
    }
        '================ワークフロー詳細ペイン関連の編集(3か所）を切り替える定数をDICで定義================
        Public workFlowListExpandable As New Dictionary(Of Boolean, String) From {
        {False, "expandableRowTemplate: '<div class=""sub-grid"" ui-grid=""row.entity.subGridOptions"" ui-grid-save-state ui-grid-selection ui-grid-resize-columns ui-grid-auto-resize ui-grid-pinning></div>',"},
        {True, "expandableRowTemplate: '<div ui-grid=""row.entity.subGridOptions"" ng-style=""grid.appScope.getTableHeight(row.entity.subGridOptions, 50, 3, row.entity.subGridOptions.data.length )"" ui-grid-save-state ui-grid-selection ui-grid-resize-columns ui-grid-auto-resize ui-grid-pinning></div>',"}
    }
        Public Shared ReadOnly workFlowListSubGridStrings As String = <![CDATA[
					// ▼▼▼ 26-01-16 ワークフロー詳細ペイン：行数の自動増減機能の追加 ▼▼▼
					// 1. 高さの計算（CommonServiceを使って正しい高さを算出）
					//   第2引数:最大行数(50), 第3引数:最小行数(3) ※テンプレートの設定と合わせる
					　var heightStyle = CommonService.getTableHeight(subGridOptions, 50, 3);
					
					// 2. 計算結果（例: {height: "300px"}）から数値（300）を取り出す
					if (heightStyle && heightStyle.height) {
					    var numericHeight = parseInt(heightStyle.height.replace('px', ''));
					    
					    // 3. 親グリッドの行（row）に「展開時の高さ」としてセットする
					    row.expandedRowHeight = numericHeight;
					}
                                                       
					// 4. 親グリッドに「行の高さが変わった」ことを通知して再描画
					$timeout(function() {
					    $scope.workflowListGridApi.core.notifyDataChange(uiGridConstants.dataChange.ROW);
					});
					// ▲▲▲ 26-01-16 ワークフロー詳細ペイン：行数の自動増減機能の追加 ここまで▲▲▲]]>.Value
        Public workFlowListSubGridExpandable As New Dictionary(Of Boolean, String) From {
        {False, "subGridOptions.data = resolveData.fileList;" & vbCrLf & vbTab & vbTab & vbTab & vbTab & vbTab & "var subGridData = {"},
        {True, "subGridOptions.data = resolveData.fileList;" & vbCrLf & workFlowListSubGridStrings & vbCrLf & vbTab & vbTab & vbTab & vbTab & vbTab & "var subGridData = {"}
    }
        Public workFlowListsubGridValue_Expandable As New Dictionary(Of Boolean, String) From {
        {False, ".sub-grid {" & vbCrLf & vbTab & "height: 150px;"},
        {True, ".sub-grid {" & vbCrLf & vbTab & "height: auto;"}
    }

        '================属性変更ウィンドウ　最下段にカレンダーピッカーを表示させるとき、フレームにかぶらないように自動調整する================
        ' カレンダーピッカー
        Public AutoAdjustCalenderPosition As New Dictionary(Of Boolean, String) From {
        {False, "orientation: attrs.placement"},
        {True, "orientation: ""auto"""}
    }
        '================属性変更ウィンドウ　最下段にコンボを表示させるとき、フレームにかぶらないように自動調整する（main.js）===============
        Public Shared ReadOnly AutoAdjustComboPosition_js_Before As String = <![CDATA[
		});
});
]]>.Value
        Public Shared ReadOnly AutoAdjustComboPosition_js_After As String = <![CDATA[
		});
}); /* コンボのドロップダウン位置自動調整指示 */

app.directive('smartDropdownPosition', function($window, $timeout) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
		var adjustPosition = function() {
			var dropdownHeight = 200; 
			var rect = element[0].getBoundingClientRect();
			var windowHeight = $window.innerHeight;
			if ((windowHeight - rect.bottom) < dropdownHeight) {
				element.addClass('drop-up');
			} else {
				element.removeClass('drop-up');
			}
		};
		element.on('click keyup focusin', function() {
		$timeout(adjustPosition, 0);
		});
		}
	};
});
]]>.Value
        Public AutoAdjustComboPosition_js As New Dictionary(Of Boolean, String) From {
        {False, AutoAdjustComboPosition_js_Before},
        {True, AutoAdjustComboPosition_js_After}
    }

        'コンボ（main.css）
        Public Shared ReadOnly AutoAdjustComboPosition_css_Before As String = <![CDATA[
}

/* ワークフロー構成 - 進行状況エリア */
]]>.Value
        Public Shared ReadOnly AutoAdjustComboPosition_css_After As String = <![CDATA[
}
.drop-up .autocomplete {
	top: auto !important;
	bottom: 100% !important;
	margin-top: 0;
	margin-bottom: 5px; /* 入力欄との間隔 */
	border-radius: 4px 4px 0 0; /* 角丸の調整（任意） */
	box-shadow: 0 -2px 5px rgba(0,0,0,0.2); /* 影の向き調整（任意） */
}
/* ワークフロー構成 - 進行状況エリア */
]]>.Value
        Public AutoAdjustComboPosition_css As New Dictionary(Of Boolean, String) From {
        {False, AutoAdjustComboPosition_css_Before},
        {True, AutoAdjustComboPosition_css_After}
    }

        'コンボ（main.html）
        Public Shared ReadOnly AutoAdjustComboPosition_html_Before As String = <![CDATA[<tags-input id="{{$index}}" class="form-control form-control-zokusei form-control-tag" display-property="name" key-property="id" min-length="1" placeholder="add_attribute_value" replace-spaces-with-dashes="false"   on-tag-adding="onTagAdding($tag)" ng-model="zokusei.kbn" ng-disabled="!zokusei.henkoKaFlg">]]>.Value
        Public Shared ReadOnly AutoAdjustComboPosition_html_After As String = <![CDATA[<tags-input smart-dropdown-position id="{{$index}}" class="form-control form-control-zokusei form-control-tag" display-property="name" key-property="id" min-length="1" placeholder="add_attribute_value" replace-spaces-with-dashes="false"   on-tag-adding="onTagAdding($tag)" ng-model="zokusei.kbn" ng-disabled="!zokusei.henkoKaFlg">]]>.Value

        Public AutoAdjustComboPosition_html As New Dictionary(Of Boolean, String) From {
        {False, AutoAdjustComboPosition_html_Before},
        {True, AutoAdjustComboPosition_html_After}
    }

        '================履歴ウィンドウ　ペイン更新時には常にスクロールバーを最上部へ移動させる================
        Public Shared ReadOnly FileHistoryScrtollAlwaysOnTop_false As String = <![CDATA[
					if (!addFlg) {
						// ログの表示切り替えの場合
						$scope.$parent.detailAreaData.log = [];
					]]>.Value
        Public Shared ReadOnly FileHistoryScrtollAlwaysOnTop_true As String = <![CDATA[
					if (!addFlg) {
						// ログの表示切り替えの場合
						$scope.$parent.detailAreaData.log = [];
						$timeout(function() {
							$('.pane-comment-body').scrollTop(0);
						});
					]]>.Value

        Public FileHistoryScroll_onTOP As New Dictionary(Of Boolean, String) From {
        {False, FileHistoryScrtollAlwaysOnTop_false},
        {True, FileHistoryScrtollAlwaysOnTop_true}
    }
        '================属性変更　公開機能の使用/不使用に連動しWebコントーロール取得値を調整する（main.service.js[ mainSVCjs_path ])================
        Public Shared ReadOnly PublishDateDisplayON As String = <![CDATA[
			} else if ($('#kokaiTime').attr('class').split(" ").indexOf('ng-invalid') != -1) {
				// 時間入力エリア内で invalid が発生している場合、書式エラー
				detailAreaData.kokaiTimestampError = CommonService.getMessage($scope, "W00013", ["timestampFormatHhMm"]);
				rtnErrorFlg = true;
			]]>.Value

        Public Shared ReadOnly PublishDateDisplayOFF As String = <![CDATA[
			} else {
				// --- 修正箇所：物理的に要素が消えている場合の考慮 ---
				var kokaiTimeElement = $('#kokaiTime');
				// 要素が存在する場合のみ、クラス属性を取得して split 判定を行う
				if (kokaiTimeElement.length > 0) {
					var kokaiTimeClass = kokaiTimeElement.attr('class') || "";
					if (kokaiTimeClass.split(" ").indexOf('ng-invalid') != -1) {
						// 時間入力エリア内で invalid が発生している場合、書式エラー 
						detailAreaData.kokaiTimestampError = CommonService.getMessage($scope, "W00013", ["timestampFormatHhMm"]);
						rtnErrorFlg = true;
					}
				}
				// --- 修正箇所ここまで ---
			]]>.Value

        Public PublishDateControl As New Dictionary(Of Boolean, String) From {
        {False, PublishDateDisplayOFF},
        {True, PublishDateDisplayON}
    }


    End Class

    Public Shared Function ReplaceTextInFile(OLDString As String, NEWString As String, filePath As String, Optional FindOnly As Boolean = False) As Integer
        Try
            ' ファイルの内容を読み込む
            Dim content As String = System.IO.File.ReadAllText(filePath)

            ' 【修正点】改行コードの正規化対策
            ' Windowsのファイル(CRLF)に対して、OLDStringがLFのみで構成されている場合、ヒットしないため補正する
            If content.Contains(vbCrLf) AndAlso Not OLDString.Contains(vbCrLf) AndAlso OLDString.Contains(vbLf) Then
                OLDString = OLDString.Replace(vbLf, vbCrLf)
                ' 必要であればNEWStringも合わせておく
                NEWString = NEWString.Replace(vbLf, vbCrLf)
            End If

            ' OLDString の出現回数をカウント
            Dim matchCount As Integer = (content.Length - content.Replace(OLDString, "").Length) \ OLDString.Length

            ' FindOnlyでないときは置換処理
            If Not FindOnly Then
                Dim newContent As String = content.Replace(OLDString, NEWString)
                If matchCount > 0 Then
                    ' 書き込み (エンコーディング指定がないとShift-JIS/UTF-8等の問題が出る場合があるため注意)
                    System.IO.File.WriteAllText(filePath, newContent)
                End If
            End If

            ' 置換した回数を返す
            Return matchCount

        Catch ex As Exception
            ' エラー発生時は -1 を返す
            Return -1
        End Try
    End Function

End Class

Public Class TXTFunc
    Public Shared Function IDSearch(IDFile As String, keyWord As String, mode As Integer) As String

        '   mode : true   キーワード    '取り出す文字列'   アポォで挟まれたところをとりだす
        '   mode : 0(  　　キーワード:  取り出す文字列,　　 コロン以後からカンマまでをスペース除去で取り出す

        '読み込む文字コードの指定(ここでは、Shift JIS)
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance)
        Dim enc As System.Text.Encoding = System.Text.Encoding.GetEncoding("utf-8")

        '検索の結果を格納
        Dim result As String = ""

        If (IO.File.Exists(IDFile) = True) Then

            'すべての行を読み込む
            For Each fff As String In System.IO.File.ReadAllLines(IDFile, enc)
                '文字を検索
                If fff.Contains(keyWord) Then
                    Select Case mode
                        Case TECA_sets.QUOTA.Apostrofy
                            Dim firstApo As Integer = fff.IndexOf(Chr(39))  '始まりアポォ位置
                            Dim lasttApo As Integer = fff.LastIndexOf(Chr(39))  '終わりアポォ位置

                            fff = fff.Substring(firstApo + 1, lasttApo - firstApo - 1)
                            result = fff
                        Case TECA_sets.QUOTA.ColonToCamma
                            Dim firstApo As Integer = fff.IndexOf(Chr(58))  '始まりコロ位置
                            Dim lasttApo As Integer = fff.LastIndexOf(Chr(44))  '終わりカンマ位置

                            fff = fff.Substring(firstApo + 1, lasttApo - firstApo - 1).TrimStart
                            result = fff
                        Case TECA_sets.QUOTA.EqualToCR
                            Dim firstApo As Integer = fff.IndexOf(Chr(61))  '始まり[=]の位置
                            If (fff.Substring(0, 1) <> "#") Then
                                fff = fff.Substring(firstApo + 1)
                                result = fff
                            End If
                        Case TECA_sets.QUOTA.WebXLM
                            Dim firstApo As Integer = fff.IndexOf(Chr(62))  '始まり[>]の位置
                            Dim lasttApo As Integer = fff.LastIndexOf(Chr(60))  '終わり[<]の位置

                            fff = fff.Substring(firstApo + 1, lasttApo - firstApo - 1).TrimStart
                            result = fff
                        Case TECA_sets.QUOTA.beansXML
                            Dim firstApo As Integer = fff.IndexOf("value=") + 6  '始まり[value=]の位置
                            Dim lasttApo As Integer = fff.LastIndexOf(Chr(34))  '終わり["]の位置

                            fff = fff.Substring(firstApo + 1, lasttApo - firstApo - 1).TrimStart
                            result = fff
                        Case TECA_sets.QUOTA.prodJS
                            Dim firstApo As Integer = fff.IndexOf(Chr(58))  '始まり[:]の位置
                            Dim lasttApo As Integer = fff.IndexOf(Chr(42))  '終わり[*]の位置

                            fff = fff.Substring(firstApo + 1, lasttApo - firstApo - 1).TrimStart
                            result = fff

                        Case TECA_sets.QUOTA.WholeLine
                            result = fff

                        Case Else
                            result = "Invalid Qota Character"

                    End Select
                Else

                    '結果に格納
                End If
            Next
            IDSearch = result
        Else
            IDSearch = "File not Exist"
        End If

    End Function

    ' 文字列strのstart文字目からlength文字分をnewstrに置き換えるメソッド
    Shared Function Replace(ByVal str As String, ByVal start As Integer, ByVal length As Integer, ByVal newstr As String) As String
        Return String.Concat(str.AsSpan(0, start), newstr, str.AsSpan(start + length))
    End Function

    ''' <summary>
    ''' テキストファイルの指定キーワードを指定文字列に置換する     
    ''' </summary>
    ''' <param name="IDFile"></param>
    ''' <param name="keyWord"></param>
    ''' <param name="afterValue"></param>
    ''' <param name="mode"></param>
    ''' <returns></returns>
    Public Shared Function TextSwap(IDFile As String, keyWord As String, afterValue As String, mode As Integer) As String

        '読み取り属性を強制解除(Ver2.77）
        Dim fas As FileAttributes = File.GetAttributes(IDFile)
        If (fas And FileAttributes.ReadOnly) = FileAttributes.ReadOnly Then
            fas = fas And Not FileAttributes.ReadOnly
        End If
        File.SetAttributes(IDFile, fas)

        '読み込む文字コードの指定(UTF-8 Bombなし)
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance)
        Dim enc As System.Text.Encoding = System.Text.Encoding.GetEncoding("utf-8")

        Dim SRbuffer As String
        Dim afterBuffer As String = ""

        If (IO.File.Exists(IDFile) = True) Then

            'すべての行を読み込む
            Try
                Using SR As New StreamReader(IDFile, enc)
                    SRbuffer = SR.ReadToEnd()
                End Using
            Catch ex As Exception
                TextSwap = "TextSwap:" + ex.ToString
                Exit Function
            End Try

            '置換
            If SRbuffer.Contains(keyWord, StringComparison.CurrentCulture) Then
                Dim SRBuf_KeyPos As Integer = SRbuffer.IndexOf(keyWord)
                Dim StartBuf As String = SRbuffer.Substring(SRBuf_KeyPos)

                Select Case mode
                    Case TECA_sets.QUOTA.Apostrofy                             '  KEYWORD   'TARGETvalue'
                        Dim firstApo As Integer = StartBuf.IndexOf(Chr(39)) + SRbuffer.IndexOf(keyWord)  '始まりアポ位置
                        Dim EndBuf As String = SRbuffer.Substring(firstApo, 10)
                        Dim lastApo As Integer = EndBuf.IndexOf(Chr(39)) + firstApo  '終わりアポ位置

                        afterBuffer = Replace(SRbuffer, firstApo + 1, lastApo - firstApo, afterValue + Chr(39))

                    Case TECA_sets.QUOTA.ColonToCamma                             '  KEYWORD :TARGETvalue,
                        Dim firstApo As Integer = StartBuf.IndexOf(Chr(58)) + SRbuffer.IndexOf(keyWord)  '始まりコロ位置
                        Dim EndBuf As String = SRbuffer.Substring(firstApo, 10)
                        Dim lastApo As Integer = EndBuf.IndexOf(Chr(44)) + firstApo  '終わりカンマ位置

                        afterBuffer = Replace(SRbuffer, firstApo + 1, lastApo - firstApo, " " + afterValue + Chr(44))

                    Case TECA_sets.QUOTA.WebXLM
                        Dim firstApo As Integer = StartBuf.IndexOf(Chr(62)) + SRbuffer.IndexOf(keyWord)  '始まりコロ位置
                        Dim EndBuf As String = SRbuffer.Substring(firstApo, 10)
                        Dim lastApo As Integer = EndBuf.IndexOf(Chr(60)) + firstApo  '終わりカンマ位置

                        afterBuffer = Replace(SRbuffer, firstApo + 1, lastApo - firstApo, afterValue + " " + Chr(60))

                    Case TECA_sets.QUOTA.beansXML
                        Dim ValueStartPos As Integer = SRBuf_KeyPos + StartBuf.IndexOf("value=") + 6  　　　'値の始まり位置 [value=]の6文字分を飛ばす
                        Dim EndBuf As String = SRbuffer.Substring(ValueStartPos + 1, 10)
                        Dim ValueEndPos As Integer = ValueStartPos + 1 + EndBuf.IndexOf(Chr(34))            '値の終わり ["]の位置

                        afterBuffer = Replace(SRbuffer, ValueStartPos + 1, ValueEndPos - ValueStartPos - 1, (Val(afterValue) * 60).ToString)

                    Case TECA_sets.QUOTA.prodJS
                        Dim firstApo As Integer = StartBuf.IndexOf(Chr(58)) + SRbuffer.IndexOf(keyWord)    '始まり[:]の位置
                        Dim EndBuf As String = SRbuffer.Substring(firstApo, 10)
                        Dim lastApo As Integer = EndBuf.IndexOf(Chr(42)) + firstApo  '終わり[*]の位置

                        afterBuffer = Replace(SRbuffer, firstApo + 1, lastApo - firstApo, afterValue + " " + Chr(42))

                    Case TECA_sets.QUOTA.WholeLine
                        afterBuffer = SRbuffer.Replace(keyWord, afterValue)

                    Case Else
                        Dim unused As String = "Unsupported Qota Mode:" + mode.ToString

                End Select

            End If

            If afterBuffer.Length < 10 Then
                TextSwap = "Not Found String"
                Exit Function
            End If

            Try
                Dim SW As New StreamWriter(IDFile, False, enc)
                SW.Write(afterBuffer)
                SW.Close()

                SRbuffer = Nothing
                afterBuffer = Nothing

            Catch ex As Exception
                TextSwap = "Error"
                MessageBox.Show("【数値：" + afterValue.ToString + "】へ変更できません。" + vbCrLf + "管理者権限で再試行下さい", "数値変更エラー")
                Exit Function
            End Try

            TextSwap = "Success"
        Else
            TextSwap = "File not Found"
        End If

    End Function

    Public Shared Function HashPassword(password As String) As String
        ' 入力値
        Dim workFactor As Integer = 8  ' ← ストレッチング回数の調整

        ' ハッシュ生成
        Dim hashedPassword As String = BCrypt.Net.BCrypt.HashPassword(password, workFactor)

        ' 照合テスト
        Dim isValid As Boolean = BCrypt.Net.BCrypt.Verify(password, hashedPassword)
        If isValid Then
            Return hashedPassword
        Else
            Return "ERROR:hashing failed"
        End If
    End Function
End Class

Public Class HtmlLoader
    ' 埋め込みリソースのHTMLを読み込んで文字列として返す
    Public Shared Function LoadHtmlFromResource(resourceName As String) As String
        Dim assembly As Assembly = Assembly.GetExecutingAssembly()

        ' 名前空間.ファイル名 という形式で指定（プロジェクト名やフォルダ構造に応じて変化）
        Dim fullResourceName As String = assembly.GetManifestResourceNames().
            FirstOrDefault(Function(name) name.EndsWith(resourceName))

        If String.IsNullOrEmpty(fullResourceName) Then
            Throw New FileNotFoundException("リソースが見つかりません: " & resourceName)
        End If

        Using stream As Stream = assembly.GetManifestResourceStream(fullResourceName)
            Using reader As New StreamReader(stream)
                Return reader.ReadToEnd()
            End Using
        End Using
    End Function
End Class


''' <summary>
''' 公開フラグ連動機能の定数をまとめたクラス
''' </summary>
Public Class PubFlugLinkage

    '================属性設定：【表示スイッチと連動】の追加 MZokuseiMapper.xml(12箇所）================
    Public Shared ReadOnly ZokuseiSync_MZMapperXML1_OFF As String = <![CDATA[
    <result column="update_timestamp" jdbcType="TIMESTAMP" property="updateTimestamp" />
  </resultMap>]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML1_ON As String = <![CDATA[
    <result column="update_timestamp" jdbcType="TIMESTAMP" property="updateTimestamp" />
    <result column="public_link_flg" jdbcType="BIT" property="publicLinkFlg" />
  </resultMap>]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML2_OFF As String = <![CDATA[
    update_timestamp
  </sql>]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML2_ON As String = <![CDATA[
    update_timestamp
    ,public_link_flg
  </sql>]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML3_OFF As String = <![CDATA[
        update_timestamp,
      </if>
    </trim>]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML3_ON As String = <![CDATA[
        update_timestamp,
      </if>
      <if test="publicLinkFlg != null">
        public_link_flg,
      </if>
    </trim>]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML4_OFF As String = <![CDATA[
        #{updateTimestamp,jdbcType=TIMESTAMP},
      </if>
    </trim>
  </insert>]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML4_ON As String = <![CDATA[
        #{updateTimestamp,jdbcType=TIMESTAMP},
      </if>
      <if test="publicLinkFlg != null">
        #{publicLinkFlg,jdbcType=BIT},
      </if>
    </trim>
  </insert>]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML5_OFF As String = <![CDATA[
  <select id="select" resultMap="ExtendResultMap" parameterType="map" >
    SELECT
      zokusei.id,
      zokusei.kaisha_id,
      COALESCE(zokusei.name[${@jp.co.photron.ndms.common.LangThreadLocal@get()}], zokusei.name[1]) AS name,
      zokusei.hissu_flg, zokusei.unique_flg, zokusei.data_type_kbn,
      zokusei.char_num, zokusei.string_check_kbn,
      zokusei.string_check_naiyo, zokusei.num_val_format, zokusei.num_val_prefix, zokusei.num_val_suffix,
      zokusei.num_val_min, zokusei.num_val_max, zokusei.sentakushi_data_shutokusaki_kbn,
      zokusei.hyoji_jun_ichiran, zokusei.hyoji_jun_dtl, zokusei.hyoji_jun_kensaku, zokusei.hyoji_jun_smart_device,
      zokusei.invalid_flg,
      zokusei.del_flg, zokusei.create_user_id, zokusei.create_timestamp, zokusei.update_user_id, zokusei.update_timestamp,]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML5_ON As String = <![CDATA[
  <select id="select" resultMap="ExtendResultMap" parameterType="map" >
    SELECT
      zokusei.id,
      zokusei.kaisha_id,
      COALESCE(zokusei.name[${@jp.co.photron.ndms.common.LangThreadLocal@get()}], zokusei.name[1]) AS name,
      zokusei.hissu_flg, zokusei.unique_flg, zokusei.data_type_kbn,
      zokusei.char_num, zokusei.string_check_kbn,
      zokusei.string_check_naiyo, zokusei.num_val_format, zokusei.num_val_prefix, zokusei.num_val_suffix,
      zokusei.num_val_min, zokusei.num_val_max, zokusei.sentakushi_data_shutokusaki_kbn,
      zokusei.hyoji_jun_ichiran, zokusei.hyoji_jun_dtl, zokusei.hyoji_jun_kensaku, zokusei.hyoji_jun_smart_device,
      zokusei.invalid_flg,
      zokusei.del_flg, zokusei.create_user_id, zokusei.create_timestamp, zokusei.update_user_id, zokusei.update_timestamp,zokusei.public_link_flg, ]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML6_OFF As String = <![CDATA[
  <select id="selectById" resultMap="ExtendResultMap" parameterType="map" >
    SELECT
      zokusei.id,
      zokusei.kaisha_id,
      COALESCE(zokusei.name[${@jp.co.photron.ndms.common.LangThreadLocal@get()}], zokusei.name[1]) AS name,
      zokusei.hissu_flg, zokusei.unique_flg, zokusei.data_type_kbn,
      zokusei.char_num, zokusei.string_check_kbn,
      zokusei.string_check_naiyo, zokusei.num_val_format, zokusei.num_val_prefix, zokusei.num_val_suffix,
      zokusei.num_val_min, zokusei.num_val_max, zokusei.sentakushi_data_shutokusaki_kbn,
      zokusei.hyoji_jun_ichiran, zokusei.hyoji_jun_dtl, zokusei.hyoji_jun_kensaku, zokusei.hyoji_jun_smart_device,
      zokusei.invalid_flg,
      zokusei.del_flg, zokusei.create_user_id, zokusei.create_timestamp, zokusei.update_user_id, zokusei.update_timestamp,]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML6_ON As String = <![CDATA[
  <select id="selectById" resultMap="ExtendResultMap" parameterType="map" >
    SELECT
      zokusei.id,
      zokusei.kaisha_id,
      COALESCE(zokusei.name[${@jp.co.photron.ndms.common.LangThreadLocal@get()}], zokusei.name[1]) AS name,
      zokusei.hissu_flg, zokusei.unique_flg, zokusei.data_type_kbn,
      zokusei.char_num, zokusei.string_check_kbn,
      zokusei.string_check_naiyo, zokusei.num_val_format, zokusei.num_val_prefix, zokusei.num_val_suffix,
      zokusei.num_val_min, zokusei.num_val_max, zokusei.sentakushi_data_shutokusaki_kbn,
      zokusei.hyoji_jun_ichiran, zokusei.hyoji_jun_dtl, zokusei.hyoji_jun_kensaku, zokusei.hyoji_jun_smart_device,
      zokusei.invalid_flg,
      zokusei.del_flg, zokusei.create_user_id, zokusei.create_timestamp, zokusei.update_user_id, zokusei.update_timestamp,zokusei.public_link_flg, ]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML7_OFF As String = <![CDATA[
    <result column="update_user_name" property="updateUserName" jdbcType="VARCHAR" />
  </resultMap>
  <!-- 属性更新 -->]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML7_ON As String = <![CDATA[
    <result column="update_user_name" property="updateUserName" jdbcType="VARCHAR" />
    <result column="public_link_flg" property="publicLinkFlg" jdbcType="BIT" />
 </resultMap>
  <!-- 属性更新 -->]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML8_OFF As String = <![CDATA[
        update_timestamp = #{updateTimestamp,jdbcType=TIMESTAMP},
    </set>
    where
          id = #{record.id,jdbcType=INTEGER]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML8_ON As String = <![CDATA[
        update_timestamp = #{updateTimestamp,jdbcType=TIMESTAMP},
        public_link_flg = #{record.publicLinkFlg,jdbcType=BIT},
    </set>
    where
          id = #{record.id,jdbcType=INTEGER]]>.Value
    Public Shared ReadOnly ZokuseiSync_MZMapperXML9_OFF As String = <![CDATA[
  <select id="selectAllHierarchical" resultMap="HierarchicalResultMap" parameterType="map">
    SELECT
      zokusei.id,
      zokusei.kaisha_id,
      COALESCE(zokusei.name[${@jp.co.photron.ndms.common.LangThreadLocal@get()}], zokusei.name[1]) AS name,
      zokusei.hissu_flg, zokusei.unique_flg, zokusei.data_type_kbn,
      zokusei.char_num, zokusei.string_check_kbn,
      zokusei.string_check_naiyo, zokusei.num_val_format, zokusei.num_val_prefix, zokusei.num_val_suffix,
      zokusei.num_val_min, zokusei.num_val_max, zokusei.sentakushi_data_shutokusaki_kbn,
      zokusei.hyoji_jun_ichiran, zokusei.hyoji_jun_dtl, zokusei.hyoji_jun_kensaku, zokusei.hyoji_jun_smart_device,
      zokusei.invalid_flg,
      zokusei.del_flg, zokusei.create_user_id, zokusei.create_timestamp, zokusei.update_user_id, zokusei.update_timestamp,]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML9_ON As String = <![CDATA[
  <select id="selectAllHierarchical" resultMap="HierarchicalResultMap" parameterType="map">
    SELECT
      zokusei.id,
      zokusei.kaisha_id,
      COALESCE(zokusei.name[${@jp.co.photron.ndms.common.LangThreadLocal@get()}], zokusei.name[1]) AS name,
      zokusei.hissu_flg, zokusei.unique_flg, zokusei.data_type_kbn,
      zokusei.char_num, zokusei.string_check_kbn,
      zokusei.string_check_naiyo, zokusei.num_val_format, zokusei.num_val_prefix, zokusei.num_val_suffix,
      zokusei.num_val_min, zokusei.num_val_max, zokusei.sentakushi_data_shutokusaki_kbn,
      zokusei.hyoji_jun_ichiran, zokusei.hyoji_jun_dtl, zokusei.hyoji_jun_kensaku, zokusei.hyoji_jun_smart_device,
      zokusei.invalid_flg,
      zokusei.del_flg, zokusei.create_user_id, zokusei.create_timestamp, zokusei.update_user_id, zokusei.update_timestamp,zokusei.public_link_flg,]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML10_OFF As String = <![CDATA[
  <select id="selectHierarchicalById" resultMap="HierarchicalResultMap" parameterType="map">
    SELECT
      zokusei.id,
      zokusei.kaisha_id,
      COALESCE(zokusei.name[${@jp.co.photron.ndms.common.LangThreadLocal@get()}], zokusei.name[1]) AS name,
      zokusei.hissu_flg, zokusei.unique_flg, zokusei.data_type_kbn,
      zokusei.char_num, zokusei.string_check_kbn,
      zokusei.string_check_naiyo, zokusei.num_val_format, zokusei.num_val_prefix, zokusei.num_val_suffix,
      zokusei.num_val_min, zokusei.num_val_max, zokusei.sentakushi_data_shutokusaki_kbn,
      zokusei.hyoji_jun_ichiran, zokusei.hyoji_jun_dtl, zokusei.hyoji_jun_kensaku, zokusei.hyoji_jun_smart_device,
      zokusei.invalid_flg,
      zokusei.del_flg, zokusei.create_user_id, zokusei.create_timestamp, zokusei.update_user_id, zokusei.update_timestamp,]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML10_ON As String = <![CDATA[
  <select id="selectHierarchicalById" resultMap="HierarchicalResultMap" parameterType="map">
    SELECT
      zokusei.id,
      zokusei.kaisha_id,
      COALESCE(zokusei.name[${@jp.co.photron.ndms.common.LangThreadLocal@get()}], zokusei.name[1]) AS name,
      zokusei.hissu_flg, zokusei.unique_flg, zokusei.data_type_kbn,
      zokusei.char_num, zokusei.string_check_kbn,
      zokusei.string_check_naiyo, zokusei.num_val_format, zokusei.num_val_prefix, zokusei.num_val_suffix,
      zokusei.num_val_min, zokusei.num_val_max, zokusei.sentakushi_data_shutokusaki_kbn,
      zokusei.hyoji_jun_ichiran, zokusei.hyoji_jun_dtl, zokusei.hyoji_jun_kensaku, zokusei.hyoji_jun_smart_device,
      zokusei.invalid_flg,
      zokusei.del_flg, zokusei.create_user_id, zokusei.create_timestamp, zokusei.update_user_id, zokusei.update_timestamp,zokusei.public_link_flg,]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML11_OFF As String = <![CDATA[
  <select id="selectByIdNotCheckState" resultMap="HierarchicalResultMap" parameterType="map">
    SELECT
      zokusei.id,
      zokusei.kaisha_id,
      COALESCE(zokusei.name[${@jp.co.photron.ndms.common.LangThreadLocal@get()}], zokusei.name[1]) AS name,
      zokusei.hissu_flg, zokusei.unique_flg, zokusei.data_type_kbn,
      zokusei.char_num, zokusei.string_check_kbn,
      zokusei.string_check_naiyo, zokusei.num_val_format, zokusei.num_val_prefix, zokusei.num_val_suffix,
      zokusei.num_val_min, zokusei.num_val_max, zokusei.sentakushi_data_shutokusaki_kbn,
      zokusei.hyoji_jun_ichiran, zokusei.hyoji_jun_dtl, zokusei.hyoji_jun_kensaku, zokusei.hyoji_jun_smart_device,
      zokusei.invalid_flg,
      zokusei.del_flg, zokusei.create_user_id, zokusei.create_timestamp, zokusei.update_user_id, zokusei.update_timestamp,]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML11_ON As String = <![CDATA[
  <select id="selectByIdNotCheckState" resultMap="HierarchicalResultMap" parameterType="map">
    SELECT
      zokusei.id,
      zokusei.kaisha_id,
      COALESCE(zokusei.name[${@jp.co.photron.ndms.common.LangThreadLocal@get()}], zokusei.name[1]) AS name,
      zokusei.hissu_flg, zokusei.unique_flg, zokusei.data_type_kbn,
      zokusei.char_num, zokusei.string_check_kbn,
      zokusei.string_check_naiyo, zokusei.num_val_format, zokusei.num_val_prefix, zokusei.num_val_suffix,
      zokusei.num_val_min, zokusei.num_val_max, zokusei.sentakushi_data_shutokusaki_kbn,
      zokusei.hyoji_jun_ichiran, zokusei.hyoji_jun_dtl, zokusei.hyoji_jun_kensaku, zokusei.hyoji_jun_smart_device,
      zokusei.invalid_flg,
      zokusei.del_flg, zokusei.create_user_id, zokusei.create_timestamp, zokusei.update_user_id, zokusei.update_timestamp,zokusei.public_link_flg,]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML12_OFF As String = <![CDATA[
  </select>
</mapper>]]>.Value

    Public Shared ReadOnly ZokuseiSync_MZMapperXML12_ON As String = <![CDATA[
  </select>
  <update id="syncAllFileZokuseiValue" parameterType="java.lang.Integer">
    /* 指定された属性ID(JSONのキー)の値を、各行の公開フラグ(kokai_flg)と同期する */ 
    UPDATE public.t_file_info
    SET zokusei = zokusei || 
      jsonb_build_object(
        #{id}::text, 
        CASE WHEN kokai_flg::text = '1' OR kokai_flg::text = 'true' THEN true ELSE false END
      )
  </update>
</mapper>]]>.Value

    Public Shared ZokuseiSync_MZMapperXMLList As New List(Of (OFFval As String, ONval As String)) From {
            (ZokuseiSync_MZMapperXML1_OFF, ZokuseiSync_MZMapperXML1_ON),
            (ZokuseiSync_MZMapperXML2_OFF, ZokuseiSync_MZMapperXML2_ON),
            (ZokuseiSync_MZMapperXML3_OFF, ZokuseiSync_MZMapperXML3_ON),
            (ZokuseiSync_MZMapperXML4_OFF, ZokuseiSync_MZMapperXML4_ON),
            (ZokuseiSync_MZMapperXML5_OFF, ZokuseiSync_MZMapperXML5_ON),
            (ZokuseiSync_MZMapperXML6_OFF, ZokuseiSync_MZMapperXML6_ON),
            (ZokuseiSync_MZMapperXML7_OFF, ZokuseiSync_MZMapperXML7_ON),
            (ZokuseiSync_MZMapperXML8_OFF, ZokuseiSync_MZMapperXML8_ON),
            (ZokuseiSync_MZMapperXML9_OFF, ZokuseiSync_MZMapperXML9_ON),
            (ZokuseiSync_MZMapperXML10_OFF, ZokuseiSync_MZMapperXML10_ON),
            (ZokuseiSync_MZMapperXML11_OFF, ZokuseiSync_MZMapperXML11_ON),
            (ZokuseiSync_MZMapperXML12_OFF, ZokuseiSync_MZMapperXML12_ON)
        }


    '================属性設定：【表示スイッチと連動】の追加 detail.html(3箇所）================

    Public Shared ReadOnly ZokuseiSync_DetailHTML1_OFF As String = <![CDATA[
			<label class="col-sm-2 control-label">{{'unique'|translate}}</label>
			<div class="col-sm-8">
				<input type="checkbox" data-toggle="toggle" ng-text="'unique_on-off'|translate" ng-model="data.uniqueFlg" ng-disabled="data.id" togglebtn></input>
			</div>
		</div>
		<div class="form-group">]]>.Value

    Public Shared ReadOnly ZokuseiSync_DetailHTML1_ON As String = <![CDATA[
			<label class="col-sm-2 control-label">{{'unique'|translate}}</label>
			<div class="col-sm-8">
				<input type="checkbox" data-toggle="toggle" ng-text="'unique_on-off'|translate" ng-model="data.uniqueFlg" ng-disabled="data.id" togglebtn></input>
			</div>
		</div>
		<div class="form-group" ng-show="data.dataTypeKbn == Const.ATTR_DATATYPE_FLAG">
			<label class="col-sm-2 control-label">公開スイッチと連動</label>
			<div class="col-sm-8">
				<input type="checkbox" 
					data-toggle="toggle" 
					ng-model="data.publicLinkFlg" 
					togglebtn>
			</div>
		</div>
		<div class="form-group">]]>.Value

    Public Shared ReadOnly ZokuseiSync_DetailHTML2_OFF As String = <![CDATA[
			</div>
			<div class="btn-group footer-right-info" ng-show="data.updateUserName">]]>.Value

    Public Shared ReadOnly ZokuseiSync_DetailHTML2_ON As String = <![CDATA[
			</div>
            <!--
			<div class="btn-group footer-right-info" ng-show="data.updateUserName">]]>.Value

    Public Shared ReadOnly ZokuseiSync_DetailHTML3_OFF As String = <![CDATA[
			</div>
		</div>
	</div>
</form>]]>.Value
    Public Shared ReadOnly ZokuseiSync_DetailHTML3_ON As String = <![CDATA[
			</div>
-->
		</div>
	</div>
</form>]]>.Value

    Public Shared ZokuseiSync_DetailHTMLList As New List(Of (OFFval As String, ONval As String)) From {
            (ZokuseiSync_DetailHTML1_OFF, ZokuseiSync_DetailHTML1_ON),
            (ZokuseiSync_DetailHTML2_OFF, ZokuseiSync_DetailHTML2_ON),
            (ZokuseiSync_DetailHTML3_OFF, ZokuseiSync_DetailHTML3_ON)
        }

    '================属性設定：【表示スイッチと連動】の追加 attribute.service.js(3箇所）================

    Public Shared ReadOnly ZokuseiSync_AttrSvcJS1_OFF As String = <![CDATA[
		$scope.data.uniqueFlg = Const.ATTR_UNIQUE_FLG_OFF;
		$scope.data.dataTypeKbn = Const.ATTR_DATATYPE_TEXT;]]>.Value

    Public Shared ReadOnly ZokuseiSync_AttrSvcJS1_ON As String = <![CDATA[
		$scope.data.uniqueFlg = Const.ATTR_UNIQUE_FLG_OFF;
		$scope.data.publicLinkFlg = false; // ★追加：デフォルトは「しない(false)」
		$scope.data.dataTypeKbn = Const.ATTR_DATATYPE_TEXT;]]>.Value

    Public Shared ReadOnly ZokuseiSync_AttrSvcJS2_OFF As String = <![CDATA[
						dataTypeKbn: $scope.data.dataTypeKbn,
						stringCheckKbn: null,]]>.Value

    Public Shared ReadOnly ZokuseiSync_AttrSvcJS2_ON As String = <![CDATA[
						dataTypeKbn: $scope.data.dataTypeKbn,
						publicLinkFlg: $scope.data.publicLinkFlg, //「公開連動フラグ」の初期値はnull
						stringCheckKbn: null,]]>.Value

    Public Shared ReadOnly ZokuseiSync_AttrSvcJS3_OFF As String = <![CDATA[
						// フラグ
						// ※特になし]]>.Value

    Public Shared ReadOnly ZokuseiSync_AttrSvcJS3_ON As String = <![CDATA[
						// フラグ
						data.publicLinkFlg = $scope.data.publicLinkFlg;]]>.Value

    Public Shared ZokuseiSync_AttrSvcJS3List As New List(Of (OFFval As String, ONval As String)) From {
            (ZokuseiSync_AttrSvcJS1_OFF, ZokuseiSync_AttrSvcJS1_ON),
            (ZokuseiSync_AttrSvcJS2_OFF, ZokuseiSync_AttrSvcJS2_ON),
            (ZokuseiSync_AttrSvcJS3_OFF, ZokuseiSync_AttrSvcJS3_ON)
        }

    ' (リソース内のファイル名, 出力先のパス)
    Public Shared ReadOnly FileList As New List(Of (FileName As String, DestPath As String)) From {
        ("After_AttributeResource.class", Path.GetDirectoryName(TECA_sets.WebPublicSymc_attrRscCLS)),
        ("After_AttributeServiceImpl.class", Path.GetDirectoryName(TECA_sets.WebPublicSymc_attrSvcImplCLS)),
        ("After_MZokusei.class", Path.GetDirectoryName(TECA_sets.WebPublicSymc_MZokuseiCLS)),
        ("After_MZokuseiMapper.class", Path.GetDirectoryName(TECA_sets.WebPublicSymc_MZMapperCLS))
    }

    ''' <summary>
    ''' チェックボックスの状態に応じてファイルをデプロイします。
    ''' 保存時に "After_" または "Before_" を削除して本来のファイル名に戻します。
    ''' </summary>
    Public Shared Sub DeployFiles(ByVal isAfter As Boolean)
        Dim subFolder As String = If(isAfter, "After", "Before")
        Dim prefixToRemove As String = If(isAfter, "After_", "Before_")

        Dim currentAssembly As Assembly = Assembly.GetExecutingAssembly()
        Dim rootNamespace As String = "TeCASettings"

        For Each fileInfo In FileList
            ' 1. リソース内の実際のファイル名を特定
            ' Before展開時はリスト内の "After_" を "Before_" に読み替えてリソースを探す
            Dim actualResourceFileName As String = fileInfo.FileName
            If Not isAfter Then
                actualResourceFileName = actualResourceFileName.Replace("After_", "Before_")
            End If

            ' 2. 埋め込みリソースのフルパスを構築
            Dim resourcePath As String = $"{rootNamespace}.{actualResourceFileName}"

            ' 3. 出力時のクリーンなファイル名を生成 (接頭辞をカット)
            Dim cleanFileName As String = actualResourceFileName.Replace(prefixToRemove, "")

            ' 4. 出力先フルパスの構築
            Dim finalDestPath As String = Path.Combine(fileInfo.DestPath, cleanFileName)

            ' リソースをストリームとして取得
            Using resStream As Stream = currentAssembly.GetManifestResourceStream(resourcePath)
                If resStream IsNot Nothing Then
                    ' 出力先フォルダの作成
                    Dim targetDir As String = Path.GetDirectoryName(finalDestPath)
                    If Not Directory.Exists(targetDir) Then Directory.CreateDirectory(targetDir)

                    ' ファイルの書き出し
                    Using fileStream As New FileStream(finalDestPath, FileMode.Create, FileAccess.Write)
                        resStream.CopyTo(fileStream)
                    End Using
                    Debug.WriteLine($"Success: {cleanFileName} を {subFolder} から展開しました。")
                Else
                    MessageBox.Show($"Error: リソースが見つかりません" & vbCrLf & $"ファイル名[{resourcePath}] ")
                End If
            End Using
        Next
    End Sub


End Class