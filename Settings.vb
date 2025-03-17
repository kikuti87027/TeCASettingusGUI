Public Class TECA_sets

    Public Const API_PATH As String = "C:\TeCA\api"
    Public Const WEB_PATH As String = "C:\TeCA\web"
    Public Const Tomcat_PATH As String = "apache-tomcat-8.0.36"
    Public Const IDpath As String = WEB_PATH + "\web\server\config\environment\production.js"

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

    Public Const KOKAI_FLG_File As String = "C:\teca\web\web\client\app\upload\upload.service.js"
    Public Const DefaultKokai_key As String = "zokusei[IDX_ZOKUSEI.KOKAI]"
    Public Const connStr As String = "Host=localhost;Username=postgres;Password=PCJJWEqb2d;Database=db2"

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

    Public Shared Function ReplaceTextInFile(OLDString As String, NEWString As String, filePath As String) As Integer
        Try
            ' ファイルの内容を読み込む
            Dim content As String = System.IO.File.ReadAllText(filePath)

            ' OLDString の出現回数をカウント
            Dim matchCount As Integer = (content.Length - content.Replace(OLDString, "").Length) \ OLDString.Length

            ' 置換処理
            Dim newContent As String = content.Replace(OLDString, NEWString)

            ' 変更がある場合のみファイルを書き換え
            If matchCount > 0 Then
                System.IO.File.WriteAllText(filePath, newContent)
            End If

            ' 置換した回数を返す
            Return matchCount

        Catch ex As Exception
            ' エラー発生時は -1 を返す
            Return -1
        End Try
    End Function

End Class