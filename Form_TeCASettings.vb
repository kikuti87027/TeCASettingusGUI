Imports System.IO
Imports System.ServiceProcess
Imports System.Text
Imports System.Threading
Imports TeCASettings.TECA_sets
Imports TeCASettings.TRIGGERS

Public Class Form_TeCASettings
    Inherits System.Windows.Forms.Form

    Dim ClientID = IDSearch(IDpath, "clientId", QUOTA.Apostrofy)
    Dim SecretID = IDSearch(IDpath, "clientSecret", QUOTA.Apostrofy)

    Dim Scrollpath As String = WEB_PATH + "\web\client\app\app.js"
    Dim vListScroll = IDSearch(Scrollpath, "EXCESS_ROWS_FILE_LIST", QUOTA.ColonToCamma)
    Dim vScrollArray() As String = {"EXCESS_ROWS_FILE_LIST",
                                    "EXCESS_ROWS_WORKFLOW_LIST",
                                    "EXCESS_ROWS_SHINSEI_FILE_LIST",
                                    "EXCESS_ROWS_UPLOAD_FILE_LIST",
                                    "EXCESS_ROWS_SEARCH_USER_LIST",
                                    "EXCESS_ROWS_SELECT_USER_LIST",
                                    "EXCESS_ROWS_PDF_PASSWORD_KAKUNIN_FILE_LIST"}

    Dim GrabModePath As String = WEB_PATH + "\web\client\components\angular-pdfjs-viewer\bower_components\pdf.js-viewer\pdf.js"
    Dim GrabModeLine As String = IDSearch(GrabModePath, GrabModeLineData.keyword, QUOTA.ColonToCamma)

    Dim mailPropPath As String = API_PATH + "\" + Tomcat_PATH + "\webapps\api#teca\WEB-INF\classes\mail.properties"
    Dim mailPropArray() As String = {"mail.smtp.host",
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

    Dim TOUTArray As String(,) = {
                                     {API_PATH + "\" + Tomcat_PATH + "\conf\web.xml", "<session-timeout>", QUOTA.WebXLM},
                                     {WEB_PATH + "\web\server\config\environment\production.js", "sessionTimeout:", QUOTA.prodJS},
                                     {WEB_PATH + "\web\server\config\environment\development.js", "sessionTimeout:", QUOTA.prodJS},
                                     {API_PATH + "\" + Tomcat_PATH + "\webapps\api#teca\WEB-INF\beans.xml", "refreshTokenLifetime", QUOTA.beansXML}
                                     }

    Dim CurrentPassword As String  '旧パスワード保管用

    Dim Dt_kaisha, Dt_systemInfo, DT_option, DT_systemInfoDB2 As New DataTable    '[db1.m_kaisha]、[db2.t_system_info]
    Dim ProgressValue As Integer = 0

    Public DefaultKokai_Exists, TRG_CheckInUNPUBLIC_exists, TRG_ApprovePUBLIC_exists As Boolean

    Private Sub Form_TeCASettings_Load(sender As Object, e As EventArgs) Handles MyBase.Load

        'コンボ初期化
        Me.ComboBox_LOG_LEVEL.DropDownStyle = ComboBoxStyle.DropDownList         '編集不可にする
        Me.ComboBox_ExecMode.DropDownStyle = ComboBoxStyle.DropDownList
        Me.ComboBox_vScroll.DropDownStyle = ComboBoxStyle.DropDownList
        Me.ComboBox_mail_transport_protocol.DropDownStyle = ComboBoxStyle.DropDownList

        With Me.ComboBox_LOG_LEVEL           '項目を追加する
            .Items.Add("INFO")
            .Items.Add("DEBUG")
        End With

        With Me.ComboBox_ExecMode           '項目を追加する
            .Items.Add("変更せず再起動")
            .Items.Add("変更して再起動")
            .Items.Add("TeCAを停止する")
            .Items.Add("TeCAを起動する")
        End With

        With Me.ComboBox_vScroll           '項目を追加する
            .Items.Add("100")
            .Items.Add("300")
            .Items.Add("500")
        End With

        With Me.ComboBox_mail_transport_protocol           '項目を追加する
            .Items.Add("smtp")
            .Items.Add("smtps")
        End With


        Me.ComboBox_ExecMode.SelectedItem = "変更せず再起動"
        Me.TextBox_DWG.Text = "ここが空白なら「取出」、ファイルドラッグで「更新」"
        Me.Button_DWG.Text = "取出"

        'プログレスバー初期化
        Me.GroupBox_Progress.Visible = False

        Dim rows1, rows2 As DataRow()

        '▼▼▼TeCA-DB1  値をコントロールに格納する

        Dim db1_msg As String
        Dim SQLCMD As String
        '--------------------------------------
        '[db1.m_kaisha]のSELECT結果をDt_kaisyaに格納
        '--------------------------------------
        SQLCMD = "select * from public.m_kaisha where invalid_flg = false"

        db1_msg = TeCA.DBtoDTBL("127.0.0.1", "db1", SQLCMD, Dt_kaisha)
        If (db1_msg.Length > 5) Then
            Label_notice.Text = db1_msg.ToString
            Exit Sub
        End If

        SQLCMD = Nothing
        db1_msg = Nothing

        '--------------------------------------
        '[db1.t_system_info_kyotsu]のSELECT結果を【Dt_systemInfo】に格納
        '--------------------------------------
        SQLCMD = "select * from public.t_system_info_kyotsu "

        db1_msg = TeCA.DBtoDTBL("127.0.0.1", "db1", SQLCMD, Dt_systemInfo)
        If (db1_msg.Length > 5) Then
            Label_notice.Text = db1_msg.ToString
            Exit Sub
        End If

        SQLCMD = Nothing
        db1_msg = Nothing

        '--------------------------------------
        '[db1.m_option]のSELECT結果（メール通知）を【Dt_option】に格納
        '--------------------------------------
        SQLCMD = "select umu_flg, name[1] from public.m_option where name[1]='メール通知'"

        db1_msg = TeCA.DBtoDTBL("127.0.0.1", "db1", SQLCMD, DT_option)
        If (db1_msg.Length > 5) Then
            Label_notice.Text = db1_msg.ToString
            Exit Sub
        End If

        SQLCMD = Nothing
        db1_msg = Nothing

        '--------------------------------------
        '[db2.t_system_info]のSELECT結果を[DT_systemInfoDB2]に格納
        '--------------------------------------
        SQLCMD = "select * from public.t_system_info where del_flg = false"

        db1_msg = TeCA.DBtoDTBL("127.0.0.1", "db2", SQLCMD, DT_systemInfoDB2)
        If (db1_msg.Length > 5) Then
            Label_notice.Text = db1_msg.ToString
            Exit Sub
        End If

        SQLCMD = Nothing
        db1_msg = Nothing



        '▼▼▼TeCA-DB2  値をコントロールに格納する
        '--------------------------------------
        '[DT_kaisya]でID=1（メインドメイン）を探し【ドメインと人数】をコントロールへ格納
        '--------------------------------------
        rows1 = Dt_kaisha.Select("id = 1")

        If rows1.Length <> 0 Then　　　　　　　　　　　　　　　'ID=1の行データ存在を確認
            For Each d1 As DataRow In rows1
                TextBox_Domain.Text = d1("domain_name")
                TextBox_MaxUsers.Text = d1("sys_riyo_user_max")
            Next
        End If

        '--------------------------------------
        '【DT_systemInfo】のキー検索結果を該当するTextBox/Comboに格納
        '--------------------------------------
        Dim info_keyArray() As String = {"UPLOAD_SIZE_MAX",
                                         "UPLOAD_FILE_NUMBER_MAX",
                                         "PDF_CONVERSION_MAX_IMMEDIATE",
                                         "PDF_CONVERSION_MAX_BATCH",
                                         "LOG_LEVEL"}

        For Each single_infoKey As String In info_keyArray

            rows1 = Dt_systemInfo.Select("info_key = '" + single_infoKey + "'")

            If rows1.Length <> 0 Then
                For Each d1 As DataRow In rows1

                    'TextBoxを探す
                    Dim csTX As Control() = Me.Controls.Find("TextBox_" + single_infoKey, True)
                    'ConboBoxを探す
                    Dim csCB As Control() = Me.Controls.Find("ComboBox_" + single_infoKey, True)

                    '見つかったらTextを直す
                    If csTX.Length > 0 Then
                        CType(csTX(0), TextBox).Text = d1("info_val")
                    End If
                    '見つかったらComboを直す
                    If csCB.Length > 0 Then
                        CType(csCB(0), ComboBox).SelectedItem = d1("info_val")
                    End If

                Next
            End If
        Next
        '--------------------------------------
        '【app.js】のvScroll値をComboBoxに格納
        '--------------------------------------

        ComboBox_vScroll.SelectedItem = vListScroll

        '--------------------------------------
        '【pdf.js】のHandToolOnLoad値をChechBoxに格納
        '       値が検出できればEnable、検出できないときはDisable
        '--------------------------------------
        CheckBox_GrabTool.Enabled = False

        Select Case GrabModeLine
            Case "false"
                CheckBox_GrabTool.Enabled = True
                CheckBox_GrabTool.Checked = False
            Case "true"
                CheckBox_GrabTool.Enabled = True
                CheckBox_GrabTool.Checked = True
            Case Else
                CheckBox_GrabTool.Enabled = False
        End Select

        '--------------------------------------
        '【タイムアウト値】の最小を求めてコンボへ格納
        '--------------------------------------
        Dim ResultValue(TOUTArray.GetLength(1) - 1) As Integer

        For X As Integer = 0 To TOUTArray.GetLength(1) - 1

            If TOUTArray(X, 2) = QUOTA.beansXML Then
                ResultValue(X) = Val(IDSearch(TOUTArray(X, 0), TOUTArray(X, 1), TOUTArray(X, 2)).Trim) \ 60
            Else
                ResultValue(X) = Val(IDSearch(TOUTArray(X, 0), TOUTArray(X, 1), TOUTArray(X, 2)).Trim)
            End If

        Next

        'コンボには求めた最小を中央値として、前後に倍々でコンボの選択肢を作る
        'ただし、マイナス値や１２時間（720分）超は作らないようにする

        With Me.ComboBox_LoginTimeout
            For N As Integer = -3 To 3
                Select Case N
                    Case < 0
                        If (ResultValue.Min \ ((N * 2) * -1)) > 0 Then
                            .Items.Add((ResultValue.Min \ ((N * 2) * -1)).ToString)
                        End If
                    Case 0
                        .Items.Add((ResultValue.Min).ToString)
                    Case > 0
                        If (ResultValue.Min * (N * 2)) < 721 Then
                            .Items.Add((ResultValue.Min * (N * 2)).ToString)
                        End If
                End Select
            Next
        End With

        ComboBox_LoginTimeout.SelectedItem = ResultValue.Min.ToString

        '--------------------------------------
        '【DT_option】のキー検索結果を該当するTextBoxに格納
        '--------------------------------------
        Dim option_keyArray() As String = {"メール通知"}

        For Each single_infoKey As String In option_keyArray

            rows2 = DT_option.Select("name = '" + single_infoKey + "'")

            If rows2.Length <> 0 Then
                For Each d1 As DataRow In rows2

                    'CheckBoxを探す
                    Dim cs As Control() = Me.Controls.Find("CheckBox_" + single_infoKey, True)

                    '見つかったらTextを直す
                    If cs.Length > 0 Then
                        CType(cs(0), CheckBox).Checked = d1("umu_flg")

                    End If
                Next
            End If
        Next

        '--------------------------------------
        '【DT_systemInfoDB2】のキー検索結果を該当するTextBoxに格納
        '--------------------------------------
        Dim DB2_keyArray() As String = {"UPLOAD_CHUNK_SIZE"}

        For Each single_infoKey As String In DB2_keyArray

            rows2 = DT_systemInfoDB2.Select("info_key = '" + single_infoKey + "'")

            If rows2.Length <> 0 Then
                For Each d1 As DataRow In rows2

                    'TextBoxを探す
                    Dim csTX As Control() = Me.Controls.Find("TextBox_" + single_infoKey, True)

                    '見つかったらTextを直す
                    If csTX.Length > 0 Then
                        CType(csTX(0), TextBox).Text = d1("info_val")
                    End If

                Next
            End If
        Next

        '--------------------------------------
        '【mail.properties】のキー検索結果を該当するControlに格納
        '--------------------------------------
        For Each MailCTRL As String In mailPropArray

            Dim mailTX As Control() = Me.Controls.Find("TextBox_" + Misc.ReplacePlural(MailCTRL, ".", "_"), True)
            Dim mailCB As Control() = Me.Controls.Find("ComboBox_" + Misc.ReplacePlural(MailCTRL, ".", "_"), True)
            Dim mailCHB As Control() = Me.Controls.Find("CheckBox_" + Misc.ReplacePlural(MailCTRL, ".", "_"), True)

            If mailTX.Length > 0 Then
                CType(mailTX(0), TextBox).Text = IDSearch(mailPropPath, MailCTRL, QUOTA.EqualToCR)
                If (MailCTRL = "password") Then
                    CurrentPassword = CType(mailTX(0), TextBox).Text  '前のパスワードは保管
                End If
            End If

            If mailCB.Length > 0 Then
                CType(mailCB(0), ComboBox).SelectedItem = IDSearch(mailPropPath, MailCTRL, QUOTA.EqualToCR)
            End If

            If mailCHB.Length > 0 Then
                If IDSearch(mailPropPath, MailCTRL, QUOTA.EqualToCR) = "true" Then
                    CType(mailCHB(0), CheckBox).Checked = True
                Else
                    CType(mailCHB(0), CheckBox).Checked = False
                End If
            End If
        Next

        '--------------------------------------
        '【公開/非公開】現状をチェックボックスに反映
        '--------------------------------------
        '【□　アップロードは非公開にする】
        DefaultKokai_Exists = Misc.FindFormula(KOKAI_FLG_File, DefaultKokai_key, "Const.UPLOAD_PUBLIC_OFF;")
        If DefaultKokai_Exists Then
            CheckBox_UploadDefault.Checked = True
        Else
            CheckBox_UploadDefault.Checked = False
        End If

        TRG_CheckInUNPUBLIC_exists = TeCA.CheckTriggerExists("trg_update_t_file_info", "update_t_file_info_kokai_flg", connStr)

        If TRG_CheckInUNPUBLIC_exists Then
            CheckBox_UnpublicCheckin.Checked = True
        Else
            CheckBox_UnpublicCheckin.Checked = False

        End If

        TRG_ApprovePUBLIC_exists = TeCA.CheckTriggerExists("trg_func_set_kokai", "func_set_kokai", connStr)

        If TRG_ApprovePUBLIC_exists Then
            CheckBox_PublicateWorkflowOK.Checked = True
        Else
            CheckBox_PublicateWorkflowOK.Checked = False

        End If


        'SMTP認証OFFのときはパスワードDisable
        If CheckBox_mail_smtp_auth.Checked = False Then
            TextBox_password.Enabled = False
            Label11.Enabled = False
        End If
        '--------------------------------------
        'ダイアログコントロールを全部非表示
        '--------------------------------------
        '全アイテムをDisable
        LockDialog(True, False)
        Button_Exec.Enabled = False
        GroupBox_MailServer.Enabled = False
        GroupBox_APIparams.Enabled = False
        GroupBox_DWG.Enabled = False
        CheckBox_Pipeman.Enabled = False
        CheckBox_Pipeman.Checked = True
        ComboBox_ExecMode.Enabled = False


        GroupBox_ninsyo.Text = "設定値を変更するにはClientIDとSecretIDを入力して下さい"
        TextBox_ClientID.Text = ""
        TextBox_SecretID.Text = ""

        'SecretIDは秘匿文字にする
        TextBox_SecretID.UseSystemPasswordChar = True
        '--------------------------------------
        'TeCAの生死を表示する
        '--------------------------------------
        Label_notice.AutoSize = True
        Label_notice.Text = TeCA.IsLive()
    End Sub

    Private Sub Button_Nunsyo_Click(sender As Object, e As EventArgs) Handles Button_Nunsyo.Click


        '認証未入力は抜ける
        If ((TextBox_ClientID.Text = "") Or (TextBox_SecretID.Text = "")) Then
            GroupBox_ninsyo.Text = "ClientIDとSecretIDが未入力です。"
            LockDialog(True, False)  '全アイテムをDisable
            Exit Sub
        End If

        '認証入力
        If ((TextBox_ClientID.Text = ClientID) And (TextBox_SecretID.Text = SecretID)) Then
            GroupBox_ninsyo.Text = "設定値を変更できます。"
            LockDialog(True, False)  '全アイテムをDisable
            LockDialog(False, True)  '制限付きでアイテムをEnable
            Button_Exec.Enabled = True
        Else
            If ((TextBox_ClientID.Text = "photron") And (TextBox_SecretID.Text = "ZUNOsupervisor")) Then
                GroupBox_ninsyo.Text = "★★Supervisor Mode★★"
                LockDialog(True, True)  '全アイテムをEnable
                Button_Exec.Enabled = True
            Else
                GroupBox_ninsyo.Text = "ClientID、SecretIDが間違っています。"
                LockDialog(True, False)  '全アイテムをDisable
                Button_Exec.Enabled = False

                Exit Sub

            End If
        End If

        If (CheckBox_メール通知.Checked = False) Then
            GroupBox_MailServer.Enabled = False
        End If

        Me.ComboBox_ExecMode.SelectedItem = "変更せず再起動"

    End Sub

    Private Sub Button_Exec_Click(sender As Object, e As EventArgs) Handles Button_Exec.Click

        Dim DOSENC1 As String = "java -jar " + API_PATH + "\jar\Encryptor\Encryptor.jar "
        Dim DOSENC2 As String = "> %TEMP%\ENC.txt"
        Dim DOSLINE As String

        Label_notice.Text = "処理中です。しばらくお待ちください。"
        Label_notice.Update()

        If Val(TextBox_UPLOAD_SIZE_MAX.Text.ToString) > 1073741824 Then
            Label_notice.Text = "「アップ時のファイルサイズ」は1GBが最大です。"
            Label_notice.Update()
            Exit Sub
        End If

        'プログレスバー初期化
        GroupBox_Progress.Visible = True
        ProgressBar.Minimum = 0
        ProgressBar.Maximum = 100
        ProgressBar.Value = 0


        Label_notice.AutoSize = True
        Select Case Me.ComboBox_ExecMode.SelectedItem.ToString
            Case "変更せず再起動"
                Label_notice.Text = TeCA_Exec("STOP", 0, 80).ToString

                'PipeMan実行
                If (CheckBox_Pipeman.Checked = True) And (CheckBox_Pipeman.Enabled = True) Then

                    Label_notice.Text = TeCA.SvcCtrls("PG_REBOOT") & "[Boot-Once]"
                    Thread.Sleep(3000)
                    Label_notice.Text = TeCA.SvcCtrls("PG_REBOOT") & "[Boot-Twice]"
                    Thread.Sleep(3000)

                    Label_notice.Text = "PipeMan : " & TeCA.UpdateDB("UPDATE t_shori_result_info SET del_flg = True WHERE shori_chu_flg = True;", "db2")
                    Label_notice.Text = "PipeMan : " & TeCA.UpdateDB("UPDATE t_shori_result_info SET shori_chu_flg = True WHERE shori_chu_flg = True;", "db2")

                    Label_notice.Text = "ReIndex : " & TeCA.UpdateDB("REINDEX INDEX IDX_FILE_INFO_1_P;", "db2")
                    Label_notice.Text = "ReIndex : " & TeCA.UpdateDB("REINDEX INDEX IDX_FILE_INFO_2_P;", "db2")
                    Label_notice.Text = "ReIndex : " & TeCA.UpdateDB("REINDEX INDEX IDX_FILE_INFO_3_P;", "db2")
                    Label_notice.Text = "ReIndex : " & TeCA.UpdateDB("REINDEX INDEX IDX_FILE_INFO_4_P;", "db2")
                End If

                Label_notice.Text = TeCA_Exec("START", 80, 100).ToString

            Case "変更して再起動"

                Dim tmpFOLDER As String = Path.GetTempPath()

                Label_notice.Text = TeCA_Exec("STOP", 0, 80).ToString

                '【app.js】スクロールパラメータの更新
                For Each targetKeyword As String In vScrollArray
                    If (TextSwap(Scrollpath.ToString, targetKeyword, ComboBox_vScroll.SelectedItem.ToString, QUOTA.ColonToCamma)) = "Error" Then
                        Label_notice.Text = "スクロールパラメータ更新エラー"
                        GroupBox_Progress.Visible = False
                        Exit Sub
                    End If
                Next

                '【production.js】ログインタイムアウトの更新

                For X As Integer = 0 To TOUTArray.GetLength(1) - 1
                    If (TextSwap(TOUTArray(X, 0).ToString, TOUTArray(X, 1).ToString, ComboBox_LoginTimeout.SelectedItem.ToString, TOUTArray(X, 2))) = "Error" Then
                        Label_notice.Text = "ログインタイムアウト更新エラー"
                        GroupBox_Progress.Visible = False
                        Exit Sub
                    End If

                Next

                '【pdf.js】手のひらツールの更新
                '　　　pdf.js行抽出データのtrue/Falseが正しい書式かどうか
                Dim GrabModeBool As Boolean
                Dim boolCheck As Boolean = Boolean.TryParse(GrabModeLine, GrabModeBool)
                If boolCheck = False Then
                    Label_notice.Text = "System File of Grab Mode may Corrupted."
                    Exit Sub
                End If

                'CheckBoxと行抽出true/falseが異なってるなら書き換える
                '　　　　　(一致するなら書き換える必要はなし）
                If GrabModeBool <> CheckBox_GrabTool.Checked Then
                    Select Case CheckBox_GrabTool.Checked
                        Case True
                            If (TextSwap(GrabModePath.ToString, GrabModeLineData.keyword & " false,", GrabModeLineData.isON, QUOTA.WholeLine)) <> "Success" Then
                                Label_notice.Text = "手のひらスイッチ更新エラー"
                                GroupBox_Progress.Visible = False
                                Exit Sub
                            End If
                        Case False
                            If (TextSwap(GrabModePath.ToString, GrabModeLineData.keyword & " true,", GrabModeLineData.isOFF, QUOTA.WholeLine)) <> "Success" Then
                                Label_notice.Text = "手のひらスイッチ更新エラー"
                                GroupBox_Progress.Visible = False
                                Exit Sub
                            End If
                    End Select

                End If

                '【mail.properties】の更新
                If (CheckBox_メール通知.Checked = True) Then

                    '▼▼▼メール設定内容の書き込み　→　テンポラリにmail.tmpで作る
                    '書き込む項目の定義
                    Dim mailPropArray2() As String = {"mail.smtp.host",
                                    "mail.smtp.port",
                                    "mail.transport.protocol",
                                    "mail.smtp.connectiontimeout",
                                    "mail.smtp.timeout",
                                    "mail.smtp.writetimeout",
                                    "mail.smtp.starttls.enable",
                                    "mail.smtp.auth",
                                    "user",
                                    "password",
                                    "from.name",
                                    "charset"}
                    Dim mailSMTPS_add() As String = {"mail.smtp.socketFactory.class=javax.net.ssl.SSLSocketFactory",
                                                     "mail.smtp.socketFactory.fallback=false"}
                    Dim mailTIMEOUT() As String = {"mail.smtp.timeout",
                                                   "mail.smtp.writetimeout"}

                    '書き込み先の用意
                    If (File.Exists(tmpFOLDER.ToString + "\mail.tmp") = True) Then
                        Try
                            File.Delete(tmpFOLDER.ToString + "\mail.tmp")
                        Catch ex As Exception
                            MessageBox.Show("テンポラリ消去不良:" + ex.ToString)
                            Exit Sub
                        End Try
                    End If

                    'BOM無しのUTF8でテキストファイルを作成する
                    Dim enc As Encoding = New System.Text.UTF8Encoding(False)
                    Dim swTMPoutFile As New StreamWriter(tmpFOLDER.ToString + "\mail.tmp", False, enc)

                    'コントロールの数だけループ
                    For Each srcCTRL As String In mailPropArray2

                        Dim CHB_answer As String
                        Dim writeTX As Control() = Me.Controls.Find("TextBox_" + Misc.ReplacePlural(srcCTRL, ".", "_"), True)
                        Dim writeCB As Control() = Me.Controls.Find("ComboBox_" + Misc.ReplacePlural(srcCTRL, ".", "_"), True)
                        Dim writeCHB As Control() = Me.Controls.Find("CheckBox_" + Misc.ReplacePlural(srcCTRL, ".", "_"), True)

                        If writeTX.Length > 0 Then
                            Dim TextBox_TMP As String = CType(writeTX(0), TextBox).Text.ToString

                            If (srcCTRL = "password") Then
                                'パスワードだけの処理
                                If (TextBox_TMP = CurrentPassword) Then

                                    '★書き換えなし→なにもしねぇ★★★
                                    If (CheckBox_mail_smtp_auth.Checked = True) Then
                                        swTMPoutFile.Write(srcCTRL.ToString + "=" + TextBox_TMP + vbCrLf)
                                    Else
                                        swTMPoutFile.Write(srcCTRL.ToString + "=" + vbCrLf)
                                    End If
                                Else
                                    '★書き換え有→暗号化★★★

                                    '生パスワードを埋め込んで暗号化DOSバッチを生成
                                    DOSLINE = DOSENC1 + TextBox_TMP + DOSENC2
                                    Dim swDOS As New StreamWriter(tmpFOLDER.ToString + "\ENC.bat", False, Encoding.GetEncoding("shift_jis"))
                                    swDOS.WriteLine(DOSLINE)
                                    swDOS.Close()

                                    'DOSバッチ起動
                                    Dim DosReturn As String = Misc.DOSEXE(tmpFOLDER.ToString + "\ENC.bat")

                                    'DOSバッチの結果（暗号化されたもぢれつ）をTEMPから拾う
                                    Dim OneLine As String
                                    Using srENC As New StreamReader(tmpFOLDER.ToString + "\ENC.txt", Encoding.GetEncoding("shift_jis"))
                                        OneLine = srENC.ReadLine()
                                    End Using

                                    'パスワード行に投入
                                    If (CheckBox_mail_smtp_auth.Checked = True) Then
                                        swTMPoutFile.Write(srcCTRL.ToString + "=" + OneLine + vbCrLf)
                                    Else
                                        swTMPoutFile.Write(srcCTRL.ToString + "=" + vbCrLf)
                                    End If

                                    'ゴミは消毒だー
                                    Try
                                        File.Delete(tmpFOLDER.ToString + "\ENC.txt")
                                        File.Delete(tmpFOLDER.ToString + "\ENC.bat")
                                    Catch ex As Exception
                                        Label_notice.Text = "Cannot remove TMPs:" + ex.Message.ToString
                                        Label_notice.Update()
                                        Exit Sub
                                    End Try
                                End If
                            Else
                                'パスワードぢゃないのは素直に書く
                                swTMPoutFile.Write(srcCTRL.ToString + "=" + TextBox_TMP + vbCrLf)
                            End If
                        End If

                        If writeCB.Length > 0 Then
                            swTMPoutFile.Write(srcCTRL.ToString + "=" + CType(writeCB(0), ComboBox).SelectedItem.ToString + vbCrLf)
                        End If

                        '【ChechBOX項目】TrueとFalseをtrueとfalseに変更
                        If writeCHB.Length > 0 Then
                            If (CType(writeCHB(0), CheckBox).Checked = True) Then
                                CHB_answer = "true"
                            Else
                                CHB_answer = "false"
                            End If

                            swTMPoutFile.Write(srcCTRL.ToString + "=" + CHB_answer + vbCrLf)
                        End If

                        'smtpsならコメントアウトを外す
                        If (srcCTRL = "mail.transport.protocol") Then
                            For Each smtpsStep As String In mailSMTPS_add
                                If (ComboBox_mail_transport_protocol.SelectedItem.ToString = "smtps") Then
                                    swTMPoutFile.Write(smtpsStep.ToString + vbCrLf)
                                Else
                                    swTMPoutFile.Write("#" + smtpsStep.ToString + vbCrLf)
                                End If
                            Next
                        End If

                        'タイムアウト系は全部同じ値にセット
                        If (srcCTRL.ToString = "mail.smtp.connectiontimeout") Then
                            For Each smtpsStep As String In mailTIMEOUT
                                swTMPoutFile.Write(smtpsStep.ToString + "=" + CType(writeTX(0), TextBox).Text.ToString + vbCrLf)
                            Next
                        End If

                        'charset行
                        If (srcCTRL = "charset") Then
                            swTMPoutFile.Write(srcCTRL.ToString + "=UTF-8" + vbCrLf)
                        End If

                    Next
                    swTMPoutFile.Close()

                    '▼▼▼テンポラリから書き戻す
                    'classes下のやつをバックアップ
                    File.Copy(mailPropPath, tmpFOLDER.ToString + "\mail.master", True)

                    '書き戻し
                    Try
                        File.Copy(tmpFOLDER.ToString + "\mail.tmp", mailPropPath, True)
                    Catch ex As Exception
                        MessageBox.Show("TeCAシステムへの書き込みを失敗しました", "メール設定")
                        Label_notice.Text = "メール設定で更新エラー"
                        GroupBox_Progress.Visible = False
                        Exit Sub
                    End Try

                End If

                '【ワークフロー系トリガー2つを設置/抹消、アップロードのデフォルト公開/非公開】
                Dim TRG As New TRIGGERS

                '■　アップロードは非公開にする(CheckBox_UploadDefault)
                DefaultKokai_Exists = Misc.FindFormula(KOKAI_FLG_File, DefaultKokai_key, "Const.UPLOAD_PUBLIC_OFF;")

                If Not DefaultKokai_Exists AndAlso (CheckBox_UploadDefault.Checked) Then
                    'UPload default実行
                    Label_notice.Text = $"UploadDefault=>UNPUBLIC：{ReplaceTextInFile("Const.UPLOAD_PUBLIC_ON;", "Const.UPLOAD_PUBLIC_OFF;", KOKAI_FLG_File)}"
                End If
                If DefaultKokai_Exists AndAlso Not (CheckBox_UploadDefault.Checked) Then
                    'UPload default解除実行
                    Label_notice.Text = $"UploadDefault=>PUBLIC：{ReplaceTextInFile("Const.UPLOAD_PUBLIC_OFF;", "Const.UPLOAD_PUBLIC_ON;", KOKAI_FLG_File)}"
                End If

                '■　差し替え、チェックイン後は非公開にする(CheckBox_UnpublicCheckin)
                TRG_CheckInUNPUBLIC_exists = TeCA.CheckTriggerExists("trg_update_t_file_info", "update_t_file_info_kokai_flg", connStr)

                If Not TRG_CheckInUNPUBLIC_exists AndAlso CheckBox_UnpublicCheckin.Checked Then
                    Label_notice.Text = TeCA.UpdateDB(TRG.TRIGGERS_SQL("KOKAI_OFF_TriggerFunc"), "db2")
                    Label_notice.Text = TeCA.UpdateDB(TRG.TRIGGERS_SQL("KOKAI_OFF_Trigger"), "db2")
                End If
                If TRG_CheckInUNPUBLIC_exists AndAlso Not CheckBox_UnpublicCheckin.Checked Then
                    Label_notice.Text = TeCA.UpdateDB(TRG.TRIGGERS_SQL("KOKAI_OFF_TriggerDROP"), "db2")
                End If

                '■ワークフローが承認されたら公開する（CheckBox_PublicateWorkflowOK）
                TRG_ApprovePUBLIC_exists = TeCA.CheckTriggerExists("trg_func_set_kokai", "func_set_kokai", connStr)

                If Not TRG_ApprovePUBLIC_exists AndAlso CheckBox_PublicateWorkflowOK.Checked Then
                    Label_notice.Text = TeCA.UpdateDB(TRG.TRIGGERS_SQL("WKFL_TriggerFunc"), "db2")
                    Label_notice.Text = TeCA.UpdateDB(TRG.TRIGGERS_SQL("WKFL_Trigger"), "db2")
                End If
                If TRG_ApprovePUBLIC_exists AndAlso Not CheckBox_PublicateWorkflowOK.Checked Then
                    Label_notice.Text = TeCA.UpdateDB(TRG.TRIGGERS_SQL("WKFL_TriggerDROP"), "db2")
                End If

                '【DB関連パラメータ】DLG入力値で更新する
                Label_notice.Text = TeCA.UpdateDB("UPDATE m_kaisha SET domain_name='" + TextBox_Domain.Text.ToString + "' WHERE id=1 ", "db1")
                Label_notice.Text = TeCA.UpdateDB("UPDATE m_kaisha SET sys_riyo_user_max='" + TextBox_MaxUsers.Text.ToString + "' WHERE id=1 ", "db1")
                Label_notice.Text = TeCA.UpdateDB("UPDATE t_system_info_kyotsu SET info_val='" + TextBox_UPLOAD_SIZE_MAX.Text.ToString + "' WHERE info_key='UPLOAD_SIZE_MAX' ", "db1")
                Label_notice.Text = TeCA.UpdateDB("UPDATE t_system_info_kyotsu SET info_val='" + TextBox_UPLOAD_FILE_NUMBER_MAX.Text.ToString + "' WHERE info_key='UPLOAD_FILE_NUMBER_MAX' ", "db1")
                Label_notice.Text = TeCA.UpdateDB("UPDATE t_system_info_kyotsu SET info_val='" + TextBox_PDF_CONVERSION_MAX_IMMEDIATE.Text.ToString + "' WHERE info_key='PDF_CONVERSION_MAX_IMMEDIATE' ", "db1")
                Label_notice.Text = TeCA.UpdateDB("UPDATE t_system_info_kyotsu SET info_val='" + TextBox_PDF_CONVERSION_MAX_BATCH.Text.ToString + "' WHERE info_key='PDF_CONVERSION_MAX_BATCH' ", "db1")
                Label_notice.Text = TeCA.UpdateDB("UPDATE t_system_info_kyotsu SET info_val='" + ComboBox_LOG_LEVEL.SelectedItem.ToString + "' WHERE info_key='LOG_LEVEL' ", "db1")
                Label_notice.Text = TeCA.UpdateDB("UPDATE m_option SET umu_flg='" + CheckBox_メール通知.Checked.ToString + "' WHERE id=2 ", "db1")
                Label_notice.Text = TeCA.UpdateDB("UPDATE t_system_info SET info_val='" + TextBox_UPLOAD_CHUNK_SIZE.Text.ToString + "' WHERE (info_key='UPLOAD_CHUNK_SIZE' AND kaisha_id=1) ", "db2")

                'PipeMan実行
                If (CheckBox_Pipeman.Checked = True) And (CheckBox_Pipeman.Enabled = True) Then
                    Label_notice.Text = TeCA.SvcCtrls("PG_REBOOT") & "[Boot-Once]"
                    Thread.Sleep(3000)
                    Label_notice.Text = TeCA.SvcCtrls("PG_REBOOT") & "[Boot-Twice]"
                    Thread.Sleep(3000)

                    Label_notice.Text = "PipeMan : " & TeCA.UpdateDB("UPDATE t_shori_result_info SET del_flg = True WHERE shori_chu_flg = True;", "db2")
                    Label_notice.Text = "PipeMan : " & TeCA.UpdateDB("UPDATE t_shori_result_info SET shori_chu_flg = True WHERE shori_chu_flg = True;", "db2")
                    Label_notice.Text = "ReIndex : " & TeCA.UpdateDB("REINDEX INDEX IDX_FILE_INFO_1_P;", "db2")
                    Label_notice.Text = "ReIndex : " & TeCA.UpdateDB("REINDEX INDEX IDX_FILE_INFO_2_P;", "db2")
                    Label_notice.Text = "ReIndex : " & TeCA.UpdateDB("REINDEX INDEX IDX_FILE_INFO_3_P;", "db2")
                    Label_notice.Text = "ReIndex : " & TeCA.UpdateDB("REINDEX INDEX IDX_FILE_INFO_4_P;", "db2")
                End If
                Label_notice.Text = TeCA_Exec("START", 80, 100).ToString
            Case "TeCAを停止する"

                Label_notice.Text = TeCA_Exec("STOP", 0, 100).ToString

                'PipeMan実行
                If (CheckBox_Pipeman.Checked = True) And (CheckBox_Pipeman.Enabled = True) Then
                    Label_notice.Text = TeCA.SvcCtrls("PG_REBOOT") & "[Boot-Once]"
                    Thread.Sleep(3000)
                    Label_notice.Text = TeCA.SvcCtrls("PG_REBOOT") & "[Boot-Twice]"
                    Thread.Sleep(3000)

                    Label_notice.Text = "PipeMan : " & TeCA.UpdateDB("UPDATE t_shori_result_info SET del_flg = True WHERE shori_chu_flg = True;", "db2")
                    Label_notice.Text = "PipeMan : " & TeCA.UpdateDB("UPDATE t_shori_result_info SET shori_chu_flg = True WHERE shori_chu_flg = True;", "db2")

                    Label_notice.Text = "ReIndex : " & TeCA.UpdateDB("REINDEX INDEX IDX_FILE_INFO_1_P;", "db2")
                    Label_notice.Text = "ReIndex : " & TeCA.UpdateDB("REINDEX INDEX IDX_FILE_INFO_2_P;", "db2")
                    Label_notice.Text = "ReIndex : " & TeCA.UpdateDB("REINDEX INDEX IDX_FILE_INFO_3_P;", "db2")
                    Label_notice.Text = "ReIndex : " & TeCA.UpdateDB("REINDEX INDEX IDX_FILE_INFO_4_P;", "db2")
                End If


            Case "TeCAを起動する"
                Label_notice.Text = TeCA_Exec("START", 0, 100).ToString

        End Select


        vListScroll = IDSearch(Scrollpath, "EXCESS_ROWS_FILE_LIST", QUOTA.ColonToCamma)
        GrabModeLine = IDSearch(GrabModePath, GrabModeLineData.keyword, QUOTA.ColonToCamma)

        Label_notice.Text = "処理を完了しました。" + TeCA.IsLive().ToString
        Label_notice.Update()


        GroupBox_Progress.Visible = False

    End Sub
    Private Function IDSearch(IDFile As String, keyWord As String, mode As Integer) As String

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
                        Case QUOTA.Apostrofy
                            Dim firstApo As Integer = fff.IndexOf(Chr(39))  '始まりアポォ位置
                            Dim lasttApo As Integer = fff.LastIndexOf(Chr(39))  '終わりアポォ位置

                            fff = fff.Substring(firstApo + 1, lasttApo - firstApo - 1)
                            result = fff
                        Case QUOTA.ColonToCamma
                            Dim firstApo As Integer = fff.IndexOf(Chr(58))  '始まりコロ位置
                            Dim lasttApo As Integer = fff.LastIndexOf(Chr(44))  '終わりカンマ位置

                            fff = fff.Substring(firstApo + 1, lasttApo - firstApo - 1).TrimStart
                            result = fff
                        Case QUOTA.EqualToCR
                            Dim firstApo As Integer = fff.IndexOf(Chr(61))  '始まり[=]の位置
                            If (fff.Substring(0, 1) <> "#") Then
                                fff = fff.Substring(firstApo + 1)
                                result = fff
                            End If
                        Case QUOTA.WebXLM
                            Dim firstApo As Integer = fff.IndexOf(Chr(62))  '始まり[>]の位置
                            Dim lasttApo As Integer = fff.LastIndexOf(Chr(60))  '終わり[<]の位置

                            fff = fff.Substring(firstApo + 1, lasttApo - firstApo - 1).TrimStart
                            result = fff
                        Case QUOTA.beansXML
                            Dim firstApo As Integer = fff.IndexOf("value=") + 6  '始まり[value=]の位置
                            Dim lasttApo As Integer = fff.LastIndexOf(Chr(34))  '終わり["]の位置

                            fff = fff.Substring(firstApo + 1, lasttApo - firstApo - 1).TrimStart
                            result = fff
                        Case QUOTA.prodJS
                            Dim firstApo As Integer = fff.IndexOf(Chr(58))  '始まり[:]の位置
                            Dim lasttApo As Integer = fff.IndexOf(Chr(42))  '終わり[*]の位置

                            fff = fff.Substring(firstApo + 1, lasttApo - firstApo - 1).TrimStart
                            result = fff

                        Case QUOTA.WholeLine
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
    Private Shared Function TextSwap(IDFile As String, keyWord As String, afterValue As String, mode As Integer) As String

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
                    Case QUOTA.Apostrofy                             '  KEYWORD   'TARGETvalue'
                        Dim firstApo As Integer = StartBuf.IndexOf(Chr(39)) + SRbuffer.IndexOf(keyWord)  '始まりアポ位置
                        Dim EndBuf As String = SRbuffer.Substring(firstApo, 10)
                        Dim lastApo As Integer = EndBuf.IndexOf(Chr(39)) + firstApo  '終わりアポ位置

                        afterBuffer = Replace(SRbuffer, firstApo + 1, lastApo - firstApo, afterValue + Chr(39))

                    Case QUOTA.ColonToCamma                             '  KEYWORD :TARGETvalue,
                        Dim firstApo As Integer = StartBuf.IndexOf(Chr(58)) + SRbuffer.IndexOf(keyWord)  '始まりコロ位置
                        Dim EndBuf As String = SRbuffer.Substring(firstApo, 10)
                        Dim lastApo As Integer = EndBuf.IndexOf(Chr(44)) + firstApo  '終わりカンマ位置

                        afterBuffer = Replace(SRbuffer, firstApo + 1, lastApo - firstApo, " " + afterValue + Chr(44))

                    Case QUOTA.WebXLM
                        Dim firstApo As Integer = StartBuf.IndexOf(Chr(62)) + SRbuffer.IndexOf(keyWord)  '始まりコロ位置
                        Dim EndBuf As String = SRbuffer.Substring(firstApo, 10)
                        Dim lastApo As Integer = EndBuf.IndexOf(Chr(60)) + firstApo  '終わりカンマ位置

                        afterBuffer = Replace(SRbuffer, firstApo + 1, lastApo - firstApo, afterValue + " " + Chr(60))

                    Case QUOTA.beansXML
                        Dim firstApo As Integer = StartBuf.IndexOf("value=") + 6  '始まり[value=]の位置
                        Dim EndBuf As String = SRbuffer.Substring(firstApo, 10)
                        Dim lastApo As Integer = EndBuf.IndexOf(Chr(34)) + firstApo  '終わりカンマ位置

                        afterBuffer = Replace(SRbuffer, firstApo + 1, lastApo - firstApo, (Val(afterValue) * 60).ToString + " " + Chr(34))

                    Case QUOTA.prodJS
                        Dim firstApo As Integer = StartBuf.IndexOf(Chr(58)) + SRbuffer.IndexOf(keyWord)    '始まり[:]の位置
                        Dim EndBuf As String = SRbuffer.Substring(firstApo, 10)
                        Dim lastApo As Integer = EndBuf.IndexOf(Chr(42)) + firstApo  '終わり[*]の位置

                        afterBuffer = Replace(SRbuffer, firstApo + 1, lastApo - firstApo, afterValue + " " + Chr(42))

                    Case QUOTA.WholeLine
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


    Private Sub LockDialog(SupervisorMode As Boolean, ONorOFF As Boolean)
        'SupervisorMode:   True=Photron / False=User
        'ONorOFF： true or False

        GroupBox_Upload.Enabled = ONorOFF
        GroupBox_PDF.Enabled = ONorOFF
        GroupBox_General.Enabled = ONorOFF
        CheckBox_メール通知.Enabled = ONorOFF
        ComboBox_LOG_LEVEL.Enabled = ONorOFF
        ComboBox_ExecMode.Enabled = True
        GroupBox_APIparams.Enabled = ONorOFF
        GroupBox_MailServer.Enabled = ONorOFF
        GroupBox_DWG.Enabled = ONorOFF
        ComboBox_ExecMode.Enabled = ONorOFF
        GroupBox_KOKAI.Enabled = ONorOFF

        If (SupervisorMode = True) Then
            TextBox_Domain.Enabled = ONorOFF
            TextBox_MaxUsers.Enabled = ONorOFF
            TextBox_UPLOAD_SIZE_MAX.Enabled = ONorOFF
        End If
    End Sub

    Private Sub ComboBox_ExecMode_SelectedIndexChanged(sender As Object, e As EventArgs) Handles ComboBox_ExecMode.SelectedIndexChanged
        Select Case Me.ComboBox_ExecMode.SelectedItem

            Case "変更して再起動"
                If ((TextBox_ClientID.Text = ClientID) And (TextBox_SecretID.Text = SecretID)) Then
                    GroupBox_ninsyo.Text = "設定値を変更できます。"
                    LockDialog(True, False)  'SuperVisorModeのみ制御可のアイテムも含めた全部をDisable
                    LockDialog(False, True)  'UserModeでアイテムをEnable
                    Button_Exec.Enabled = True
                Else
                    If ((TextBox_ClientID.Text = "photron") And (TextBox_SecretID.Text = "ZUNOsupervisor")) Then
                        GroupBox_ninsyo.Text = "★★Supervisor Mode★★"
                        LockDialog(True, True)  '全アイテムをEnable
                        Button_Exec.Enabled = True
                    Else
                        GroupBox_ninsyo.Text = "ClientID、SecretIDが間違っています。"
                        LockDialog(True, False)  '全アイテムをDisable
                        Button_Exec.Enabled = False
                        Exit Sub

                    End If
                End If

            Case Else
                '  LockDialog(True, False)  '全アイテムをDisable

        End Select

        Select Case True
            Case Me.ComboBox_ExecMode.SelectedItem.ToString() Like "*再起動"
                CheckBox_Pipeman.Enabled = True
            Case Else
                CheckBox_Pipeman.Enabled = False

        End Select

    End Sub

    ''' <summary>
    ''' TeCAのサービスを起動/停止する
    ''' </summary>
    ''' <param name="exec_mode">START/STOP</param>
    ''' <param name="beginProgress">プログレスバー開始％位置</param>
    ''' <param name="endProgress">プログレスバー終了％位置</param>
    ''' <returns></returns>
    Private Function TeCA_Exec(exec_mode As String, beginProgress As Integer, endProgress As Integer) As String

        Dim ProgressCurrent As Integer = beginProgress
        Dim ProgressStep As Integer = (endProgress - beginProgress) \ 4
        Dim ProgressStepSub As Integer = (ProgressStep) \ 10

        ProgressBar.Value = beginProgress

        Dim RunningMsg As String = ""

        Dim ServiceArray() As String = {"Apache2.4",
                                         "Tomcat8",
                                         "zunouteca",
                                         "yacexsvc"}

        For Each ServiceName As String In ServiceArray
            Dim sc As New ServiceController(ServiceName)

            ProgressCurrent += ProgressStep
            ProgressBar.Value = ProgressCurrent

            GroupBox_Progress.Text = exec_mode.ToString + " : " + ProgressCurrent.ToString + "% in Progress."
            GroupBox_Progress.Update()

            'サービス存在確認
            Dim scIsAlive As String
            Try
                scIsAlive = sc.DisplayName
            Catch ex As Exception
                RunningMsg = RunningMsg + vbCrLf + ServiceName + "が存在しません。"
                Exit For
            End Try

            If (exec_mode = "STOP") Then

                If ServiceName = "yacexsvc" Then Exit For

                Try
                    Do While sc.Status <> ServiceControllerStatus.Stopped
                        sc.Stop()
                        sc.WaitForStatus(ServiceControllerStatus.Stopped)
                        Application.DoEvents()
                    Loop
                Catch
                    RunningMsg = RunningMsg + vbCrLf + "終了不良 : " + ServiceName + " is " + sc.Status.ToString
                End Try
            End If

            If (exec_mode = "START") Then
                Try
                    Do While sc.Status <> ServiceControllerStatus.Running
                        sc.Start()
                        sc.WaitForStatus(ServiceControllerStatus.Running)
                        Application.DoEvents()
                    Loop

                Catch
                    RunningMsg = RunningMsg + vbCrLf + "起動不良 : " + ServiceName + " is " + sc.Status.ToString
                End Try
            End If
        Next

        If (RunningMsg = "") Then
            TeCA_Exec = ""
        Else
            TeCA_Exec = "Err"
            MessageBox.Show(RunningMsg, "サービスエラー")
        End If

        ProgressBar.Value = endProgress

    End Function

    Private Sub ComboBox_mail_transport_protocol_SelectedIndexChanged(sender As Object, e As EventArgs) Handles ComboBox_mail_transport_protocol.SelectedIndexChanged

        '  STARTTLSはSMTPだけで動くので、SMTPSの時はDisableはつFalse
        If (ComboBox_mail_transport_protocol.SelectedItem = "smtp") Then
            CheckBox_mail_smtp_starttls_enable.Enabled = True
            If (CheckBox_mail_smtp_starttls_enable.Checked = False) Then
                TextBox_mail_smtp_port.Text = "25"
            Else
                TextBox_mail_smtp_port.Text = "587"
            End If
        Else
            CheckBox_mail_smtp_starttls_enable.Enabled = False
            CheckBox_mail_smtp_starttls_enable.Checked = False
            TextBox_mail_smtp_port.Text = "465"
        End If
        CheckBox_mail_smtp_starttls_enable.Update()
        TextBox_mail_smtp_port.Update()
    End Sub

    Private Sub CheckBox_mail_smtp_starttls_enable_CheckedChanged(sender As Object, e As EventArgs) Handles CheckBox_mail_smtp_starttls_enable.CheckedChanged
        If (CheckBox_mail_smtp_starttls_enable.Checked = True) Then
            TextBox_mail_smtp_port.Text = "587"
        Else
            TextBox_mail_smtp_port.Text = "25"
        End If
        TextBox_mail_smtp_port.Update()
    End Sub

    Private Sub CheckBox_mail_smtp_auth_CheckedChanged(sender As Object, e As EventArgs) Handles CheckBox_mail_smtp_auth.CheckedChanged
        If (CheckBox_mail_smtp_auth.Checked = True) Then
            TextBox_password.Enabled = True
            Label11.Enabled = True
        Else
            TextBox_password.Enabled = False
            Label11.Enabled = False
        End If

    End Sub

    Private Sub CheckBox_メール通知_CheckedChanged(sender As Object, e As EventArgs) Handles CheckBox_メール通知.CheckedChanged
        If (CheckBox_メール通知.Checked = True) Then
            GroupBox_MailServer.Enabled = True
        Else
            GroupBox_MailServer.Enabled = False
        End If
        GroupBox_MailServer.Update()
    End Sub

    Private Sub Button_TeCA_SMTP_Click(sender As Object, e As EventArgs) Handles Button_TeCA_SMTP.Click
        ComboBox_mail_transport_protocol.SelectedItem = "smtp"
        CheckBox_mail_smtp_starttls_enable.Checked = False
        TextBox_mail_smtp_port.Text = "25"
        TextBox_mail_smtp_host.Text = "127.0.0.1"
        CheckBox_mail_smtp_auth.Checked = False
        TextBox_password.Text = ""
        Me.Update()
    End Sub

    Private Sub TextBox_DWG_DragEnter(ByVal sender As Object, ByVal e As System.Windows.Forms.DragEventArgs) Handles TextBox_DWG.DragEnter

        'ファイル形式の場合のみ、ドラッグを受け付けます。
        If e.Data.GetDataPresent(DataFormats.FileDrop) = True Then
            e.Effect = DragDropEffects.Copy
        Else
            e.Effect = DragDropEffects.None
        End If

    End Sub

    Private Sub TextBox_DWG_DragDrop(ByVal sender As Object, ByVal e As System.Windows.Forms.DragEventArgs) Handles TextBox_DWG.DragDrop

        'ドラッグされたファイル・フォルダのパスを格納します。
        Dim strFileName As String() = CType(e.Data.GetData(DataFormats.FileDrop, False), String())

        'ファイルの存在確認を行い、ある場合にのみ、
        'テキストボックスにパスを表示します。
        '（この処理でフォルダを対象外にしています。）
        If System.IO.File.Exists(strFileName(0).ToString) = True Then
            TextBox_DWG.Text = strFileName(0).ToString
        End If

    End Sub

    Private Sub Button_DWG_Click(sender As Object, e As EventArgs) Handles Button_DWG.Click
        Const srcFile As String = API_PATH + "\tools\zconverter\bin\data\DWGtoPDF.zcv"
        Dim outPath As String = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory)

        Select Case Button_DWG.Text

            Case "更新"
                If (File.Exists(TextBox_DWG.Text) = False) Then
                    Label_notice.Text = "指定された設定ファイルが存在しません。"
                    Exit Sub
                End If

                Dim srcLines As Integer = Misc.GetTextFileCount(srcFile, Encoding.GetEncoding("shift_jis"))
                Dim tgtLines As Integer = Misc.GetTextFileCount(TextBox_DWG.Text, Encoding.GetEncoding("shift_jis"))
                If (srcLines <> tgtLines) Then
                    Label_notice.Text = "設定ファイルの行数が変更されている為、処理できません。"
                    Label_notice.Update()
                    Exit Sub
                End If

                Try
                    File.Copy(TextBox_DWG.Text, srcFile.ToString, True)
                Catch ex As Exception
                    Label_notice.Text = "ファイル更新不能:" + ex.Message.ToString
                    Label_notice.Update()
                    Exit Sub
                End Try

                Label_notice.Text = "DWGのPDF変換設定を更新しました。"
                Label_notice.Update()
                TextBox_DWG.Text = "ここが空白なら「取出」、ファイルドラッグで「更新」"
                TextBox_DWG.Update()
                Button_DWG.Text = "取出"
                Button_DWG.Update()
            Case "取出"
                Try
                    File.Copy(srcFile.ToString, outPath.ToString + "\DWGのPDF変換.cfg", True)
                Catch ex As Exception
                    Label_notice.Text = "ファイル取出不能:" + ex.Message.ToString
                    Label_notice.Update()
                    Exit Sub
                End Try
                Label_notice.Text = "「DWGのPDF変換設定ファイル」をデスクトップに作成しました。"
                Label_notice.Update()
        End Select

    End Sub

    Private Sub TextBox_DWG_TextChanged(sender As Object, e As EventArgs) Handles TextBox_DWG.TextChanged
        If (TextBox_DWG.Text.Contains("\"c) = True And TextBox_DWG.Text.Contains(":"c) = True) Then
            Button_DWG.Text = "更新"
        Else
            Button_DWG.Text = "取出"
        End If
        Button_DWG.Update()
    End Sub


    Private Sub Form_TeCASettings_DragEnter_1(sender As Object, e As DragEventArgs) Handles MyBase.DragEnter
        'ファイル形式の場合のみ、ドラッグを受け付けます。
        If e.Data.GetDataPresent(DataFormats.FileDrop) = True Then
            e.Effect = DragDropEffects.Copy
        Else
            e.Effect = DragDropEffects.None
        End If
    End Sub

    Private Sub Form_TeCASettingsDragDrop(sender As Object, e As DragEventArgs) Handles MyBase.DragDrop
        'ドラッグされたファイル・フォルダのパスを格納。
        Dim strFileName As String() = CType(e.Data.GetData(DataFormats.FileDrop, False), String())

        '認証NG（＝GroupBoxがDisable）ならDragDropを終了
        If GroupBox_Upload.Enabled = False Then
            Exit Sub
        End If

        '読み込む文字コードの指定(UTF-8 Bombなし)
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance)
        Dim enc As System.Text.Encoding = System.Text.Encoding.GetEncoding("utf-8")
        Dim SRbuffer, decodeCODE As String

        If (IO.File.Exists(strFileName(0).ToString) = True) Then

            'すべての行を読み込む
            Try
                Using SR As New StreamReader(strFileName(0).ToString, enc)
                    SRbuffer = SR.ReadToEnd()
                End Using
            Catch ex As Exception
                MessageBox.Show(ex.ToString)
                Exit Sub
            End Try

            '暗号解除
            Try
                decodeCODE = crypt.Decrypt(SRbuffer.ToString)
            Catch ex As Exception
                Label_notice.Text = "ファイル内容にエラー:" + ex.Message.ToString
                Exit Sub
            End Try

        Else
            Label_notice.Text = "Dropされたファイルが存在しません。"
            Exit Sub
        End If

        '＝＝＝＝＝命令ワードの分解と形式チェック
        Dim DecodeArray() As String = Split(decodeCODE.ToString, ":")

        If (DecodeArray.Length <> 4) Then
            Label_notice.Text = "ファイル内容が不適切です。(DecodeError:0)"
            Exit Sub
        End If
        If (DecodeArray(1).ToString <> TextBox_Domain.Text) Or (DecodeArray(2).ToString <> TextBox_ClientID.Text) Then
            Label_notice.Text = "ファイル内容が不適切です。(DecodeError:1)"
            Exit Sub
        End If

        Select Case DecodeArray(0)
            Case "LicenseUp"
                Dim msg_result As DialogResult = MessageBox.Show("現在のライセンス数を【 " _
                    + TextBox_MaxUsers.Text + " → " + DecodeArray(3) + " 】へ更新します。" + vbCrLf +
                    "よろしいですか?", "認証されました", MessageBoxButtons.OKCancel, MessageBoxIcon.Information)
                If msg_result = DialogResult.OK Then
                    TextBox_MaxUsers.Text = DecodeArray(3).ToString
                Else
                    Exit Sub
                End If

            Case "AppDomain"
                Exit Sub
            Case Else
                Exit Sub
        End Select
    End Sub

    Private Sub Label_MaxUser_Click(sender As Object, e As EventArgs) Handles Label_MaxUser.Click

        'SupervisorModeではクリック操作は無視
        If (TextBox_MaxUsers.Enabled = True) Or (GroupBox_Upload.Enabled = False) Then
            Exit Sub
        End If

        Dim tmpFOLDER As String = Path.GetTempPath()
        Dim desktopPath As String = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory)

        '書き込み先の用意(TMP)
        If (File.Exists(tmpFOLDER.ToString + "\TeCAInfo.tmp") = True) Then
            Try
                File.Delete(tmpFOLDER.ToString + "\TeCAInfo.tmp")
            Catch ex As Exception
                MessageBox.Show("テンポラリ消去不良:" + ex.ToString)
                Exit Sub
            End Try
        End If

        'BOM無しのUTF8でテキストファイルを作成する
        Dim enc As Encoding = New System.Text.UTF8Encoding(False)
        Dim swTMPoutFile As New StreamWriter(tmpFOLDER.ToString + "\TeCAInfo.tmp", False, enc)

        swTMPoutFile.Write("ClientID   : " + TextBox_ClientID.Text.ToString + vbCrLf +
                           "API Domain : " + TextBox_Domain.Text.ToString + vbCrLf +
                           "License    : " + TextBox_MaxUsers.Text.ToString)
        swTMPoutFile.Close()

        '書き込み先の用意(desktop)
        If (File.Exists(desktopPath.ToString + "\TeCAInfo.txt") = True) Then
            Try
                File.Delete(desktopPath.ToString + "\TeCAInfo.txt")
            Catch ex As Exception
                MessageBox.Show("消去不良:" + ex.ToString)
                Exit Sub
            End Try
        End If
        File.Copy(tmpFOLDER.ToString + "\TeCAInfo.tmp", desktopPath + "\TeCAInfo.txt")
        MessageBox.Show("デスクトップにTeCAinfo.txtを作成しました。")

    End Sub
End Class
