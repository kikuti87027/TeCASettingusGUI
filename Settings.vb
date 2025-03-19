Imports System.IO
Imports System.Text

Public Class TECA_sets

    '================操作対象ファイル群パスを定義するクラス================
#If DEBUG Then
    Public Const API_PATH As String = "Z:\api"
    Public Const WEB_PATH As String = "Z:\web"
#Else
    Public Const API_PATH As String = "C:\TeCA\api"
    Public Const WEB_PATH As String = "C:\TeCA\web"
#End If
    Public Const Tomcat_PATH As String = "apache-tomcat-8.0.36"
    Public Const SelectFileJS As String = WEB_PATH + "\web\client\app\select-file\select-file.service.js"
    Public Const SelectFileHTML As String = WEB_PATH + "\web\client\app\select-file\select-file.html"
    Public Const SelectFileCSS As String = WEB_PATH + "\web\client\components\bootstrap\dist\css\bootstrap.min.css"
    Public Const preViewJS As String = WEB_PATH + "\web\client\components\angular-pdfjs-viewer\bower_components\pdf.js-viewer\pdf.js"
    Public Const IDpath As String = WEB_PATH + "\web\server\config\environment\production.js"
    Public Const KOKAI_FLG_File As String = WEB_PATH + "\web\client\app\upload\upload.service.js"
    Public Const Scrollpath As String = WEB_PATH + "\web\client\app\app.js"
    Public Const GrabModePath As String = WEB_PATH + "\web\client\components\angular-pdfjs-viewer\bower_components\pdf.js-viewer\pdf.js"
    Public Const mailPropPath As String = API_PATH + "\" + Tomcat_PATH + "\webapps\api#teca\WEB-INF\classes\mail.properties"

    'ID,SecretIDを取得
    Public Shared ClientID = TXTFunc.IDSearch(IDpath, "clientId", QUOTA.Apostrofy)
    Public Shared SecretID = TXTFunc.IDSearch(IDpath, "clientSecret", QUOTA.Apostrofy)

    'スクロールバッファの現在値の取得と、変更先の一覧を定義
    Public Shared vListScroll = TXTFunc.IDSearch(Scrollpath, "EXCESS_ROWS_FILE_LIST", QUOTA.ColonToCamma)
    Public Shared ReadOnly vScrollArray As String() = {"EXCESS_ROWS_FILE_LIST",
                                    "EXCESS_ROWS_WORKFLOW_LIST",
                                    "EXCESS_ROWS_SHINSEI_FILE_LIST",
                                    "EXCESS_ROWS_UPLOAD_FILE_LIST",
                                    "EXCESS_ROWS_SEARCH_USER_LIST",
                                    "EXCESS_ROWS_SELECT_USER_LIST",
                                    "EXCESS_ROWS_PDF_PASSWORD_KAKUNIN_FILE_LIST"}

    '公開/非公開の検索キー定義
    Public Const DefaultKokai_key As String = "zokusei[IDX_ZOKUSEI.KOKAI]"

    '手のひらツールのモード
    Public Shared GrabModeLine As String = TXTFunc.IDSearch(GrabModePath, GrabModeLineData.keyword, QUOTA.ColonToCamma)

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
                                     {API_PATH + "\" + Tomcat_PATH + "\conf\web.xml", "<session-timeout>", QUOTA.WebXLM},
                                     {WEB_PATH + "\web\server\config\environment\production.js", "sessionTimeout:", QUOTA.prodJS},
                                     {WEB_PATH + "\web\server\config\environment\development.js", "sessionTimeout:", QUOTA.prodJS},
                                     {API_PATH + "\" + Tomcat_PATH + "\webapps\api#teca\WEB-INF\beans.xml", "refreshTokenLifetime", QUOTA.beansXML}
                                     }

    Public Const connStr As String = "Host=localhost;Username=postgres;Password=PCJJWEqb2d;Database=db2"

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
        {"KOKAI_OFF_TriggerDROP", "DROP FUNCTION update_t_file_info_kokai_flg() CASCADE;"}
         }

    '================編集内容を切り替える定数をDICで定義================
    Public Class SwitchWords
        Public SelextFileDIC As New Dictionary(Of String, String) From {
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
    End Class

    Public Shared Function ReplaceTextInFile(OLDString As String, NEWString As String, filePath As String, Optional FindOnly As Boolean = False) As Integer
        Try
            ' ファイルの内容を読み込む
            Dim content As String = System.IO.File.ReadAllText(filePath)

            ' OLDString の出現回数をカウント
            Dim matchCount As Integer = (content.Length - content.Replace(OLDString, "").Length) \ OLDString.Length

            ' FilnOnlyでないときは置換処理
            If Not FindOnly Then
                Dim newContent As String = content.Replace(OLDString, NEWString)
                If matchCount > 0 Then
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
                Dim StartBuf As String = SRbuffer.Substring(SRbuffer.IndexOf(keyWord))

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
                        Dim firstApo As Integer = StartBuf.IndexOf("value=") + 6  '始まり[value=]の位置
                        Dim EndBuf As String = SRbuffer.Substring(firstApo, 10)
                        Dim lastApo As Integer = EndBuf.IndexOf(Chr(34)) + firstApo  '終わりカンマ位置

                        afterBuffer = Replace(SRbuffer, firstApo + 1, lastApo - firstApo, (Val(afterValue) * 60).ToString + " " + Chr(34))

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
End Class