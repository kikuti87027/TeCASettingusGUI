<Global.Microsoft.VisualBasic.CompilerServices.DesignerGenerated()>
Partial Class Form_TeCASettings
    Inherits System.Windows.Forms.Form

    'Form overrides dispose to clean up the component list.
    <System.Diagnostics.DebuggerNonUserCode()>
    Protected Overrides Sub Dispose(ByVal disposing As Boolean)
        Try
            If disposing AndAlso components IsNot Nothing Then
                components.Dispose()
            End If
        Finally
            MyBase.Dispose(disposing)
        End Try
    End Sub

    'Required by the Windows Form Designer
    Private components As System.ComponentModel.IContainer

    'NOTE: The following procedure is required by the Windows Form Designer
    'It can be modified using the Windows Form Designer.  
    'Do not modify it using the code editor.
    <System.Diagnostics.DebuggerStepThrough()>
    Private Sub InitializeComponent()
        Dim resources As System.ComponentModel.ComponentResourceManager = New System.ComponentModel.ComponentResourceManager(GetType(Form_TeCASettings))
        TextBox_ClientID = New TextBox()
        TextBox_SecretID = New TextBox()
        Button_Nunsyo = New Button()
        GroupBox_ninsyo = New GroupBox()
        Label8 = New Label()
        Label7 = New Label()
        Label_Domain = New Label()
        Label_MaxUser = New Label()
        Label2 = New Label()
        Label3 = New Label()
        GroupBox_PDF = New GroupBox()
        ComboBox_RasterConvert = New ComboBox()
        Label20 = New Label()
        TextBox_PDF_CONVERSION_MAX_BATCH = New TextBox()
        TextBox_PDF_CONVERSION_MAX_IMMEDIATE = New TextBox()
        Button_Exec = New Button()
        GroupBox_Upload = New GroupBox()
        TextBox_UPLOAD_FILE_NUMBER_MAX = New TextBox()
        TextBox_UPLOAD_SIZE_MAX = New TextBox()
        Label5 = New Label()
        Label6 = New Label()
        ComboBox_LOG_LEVEL = New ComboBox()
        Label1 = New Label()
        CheckBox_メール通知 = New CheckBox()
        ComboBox_ExecMode = New ComboBox()
        Label4 = New Label()
        TextBox_Domain = New TextBox()
        TextBox_MaxUsers = New TextBox()
        ProgressBar = New ProgressBar()
        GroupBox_Progress = New GroupBox()
        GroupBox_General = New GroupBox()
        ComboBox_LoginTimeout = New ComboBox()
        Label16 = New Label()
        ComboBox_vScroll = New ComboBox()
        Label_vScroll = New Label()
        CheckBox_GrabTool = New CheckBox()
        GroupBox_MailServer = New GroupBox()
        Label15 = New Label()
        TextBox_mail_smtp_connectiontimeout = New TextBox()
        Button_TeCA_SMTP = New Button()
        CheckBox_mail_smtp_auth = New CheckBox()
        Label13 = New Label()
        TextBox_mail_smtp_port = New TextBox()
        Label12 = New Label()
        TextBox_mail_smtp_host = New TextBox()
        CheckBox_mail_smtp_starttls_enable = New CheckBox()
        TextBox_password = New TextBox()
        Label11 = New Label()
        Label_SenderID = New Label()
        TextBox_user = New TextBox()
        Label10 = New Label()
        TextBox_from_name = New TextBox()
        Label9 = New Label()
        ComboBox_mail_transport_protocol = New ComboBox()
        ColorDialog1 = New ColorDialog()
        GroupBox_APIparams = New GroupBox()
        TextBoxAuthText = New TextBox()
        TextBox_UPLOAD_CHUNK_SIZE = New TextBox()
        Label22 = New Label()
        Label14 = New Label()
        GroupBox_DWG = New GroupBox()
        Button_DWG = New Button()
        TextBox_DWG = New TextBox()
        CheckBox_Pipeman = New CheckBox()
        GroupBox_KOKAI = New GroupBox()
        CheckBox_EnableKokai = New CheckBox()
        CheckBox_PublicateWorkflowOK = New CheckBox()
        CheckBox_UnpublicCheckin = New CheckBox()
        CheckBox_UploadDefault = New CheckBox()
        Label_notice = New Label()
        TabControl1 = New TabControl()
        TabPage1 = New TabPage()
        Button_ChangePwd = New Button()
        GroupBox_SystemID = New GroupBox()
        TextBoxSecretID = New TextBox()
        CheckBox_setLocal = New CheckBox()
        Label21 = New Label()
        TextBoxClientID = New TextBox()
        Label_ClientID = New Label()
        TabPage3 = New TabPage()
        TabPage4 = New TabPage()
        GroupBox_AttrChange = New GroupBox()
        CheckBox_CalPickerAutoAdjust = New CheckBox()
        GroupBox_workflowDesign = New GroupBox()
        CheckBox_workflowListExpandable = New CheckBox()
        GroupBox_Thumbnail = New GroupBox()
        Label19 = New Label()
        ComboBox_ThumbnailRatio = New ComboBox()
        GroupBox_PreViewWindow = New GroupBox()
        Label18 = New Label()
        ComboBox_PreViewScale = New ComboBox()
        GroupBox_FileSelector = New GroupBox()
        GroupBox1 = New GroupBox()
        Label17 = New Label()
        ComboBox_FileSelectLineNum = New ComboBox()
        CheckBox_Wide = New CheckBox()
        Tab_mail = New TabPage()
        TabPage2 = New TabPage()
        GroupBox_FileHistory = New GroupBox()
        CheckBox_FileHistroryScrollPosition = New CheckBox()
        GroupBox_ninsyo.SuspendLayout()
        GroupBox_PDF.SuspendLayout()
        GroupBox_Upload.SuspendLayout()
        GroupBox_Progress.SuspendLayout()
        GroupBox_General.SuspendLayout()
        GroupBox_MailServer.SuspendLayout()
        GroupBox_APIparams.SuspendLayout()
        GroupBox_DWG.SuspendLayout()
        GroupBox_KOKAI.SuspendLayout()
        TabControl1.SuspendLayout()
        TabPage1.SuspendLayout()
        GroupBox_SystemID.SuspendLayout()
        TabPage3.SuspendLayout()
        TabPage4.SuspendLayout()
        GroupBox_AttrChange.SuspendLayout()
        GroupBox_workflowDesign.SuspendLayout()
        GroupBox_Thumbnail.SuspendLayout()
        GroupBox_PreViewWindow.SuspendLayout()
        GroupBox_FileSelector.SuspendLayout()
        Tab_mail.SuspendLayout()
        TabPage2.SuspendLayout()
        GroupBox_FileHistory.SuspendLayout()
        SuspendLayout()
        ' 
        ' TextBox_ClientID
        ' 
        TextBox_ClientID.Location = New Point(93, 16)
        TextBox_ClientID.Name = "TextBox_ClientID"
        TextBox_ClientID.Size = New Size(174, 23)
        TextBox_ClientID.TabIndex = 0
        TextBox_ClientID.Text = "ClientID"
        ' 
        ' TextBox_SecretID
        ' 
        TextBox_SecretID.Location = New Point(93, 43)
        TextBox_SecretID.Name = "TextBox_SecretID"
        TextBox_SecretID.Size = New Size(174, 23)
        TextBox_SecretID.TabIndex = 1
        TextBox_SecretID.Text = "SecretID"
        TextBox_SecretID.UseSystemPasswordChar = True
        TextBox_SecretID.UseWaitCursor = True
        ' 
        ' Button_Nunsyo
        ' 
        Button_Nunsyo.AllowDrop = True
        Button_Nunsyo.Location = New Point(271, 16)
        Button_Nunsyo.Name = "Button_Nunsyo"
        Button_Nunsyo.Size = New Size(75, 50)
        Button_Nunsyo.TabIndex = 2
        Button_Nunsyo.Text = "認証"
        Button_Nunsyo.UseVisualStyleBackColor = True
        ' 
        ' GroupBox_ninsyo
        ' 
        GroupBox_ninsyo.Controls.Add(Label8)
        GroupBox_ninsyo.Controls.Add(Label7)
        GroupBox_ninsyo.Controls.Add(TextBox_SecretID)
        GroupBox_ninsyo.Controls.Add(Button_Nunsyo)
        GroupBox_ninsyo.Controls.Add(TextBox_ClientID)
        GroupBox_ninsyo.Location = New Point(11, 6)
        GroupBox_ninsyo.Name = "GroupBox_ninsyo"
        GroupBox_ninsyo.Size = New Size(376, 70)
        GroupBox_ninsyo.TabIndex = 3
        GroupBox_ninsyo.TabStop = False
        GroupBox_ninsyo.Text = "入力してください"
        ' 
        ' Label8
        ' 
        Label8.AutoSize = True
        Label8.Location = New Point(42, 19)
        Label8.Name = "Label8"
        Label8.Size = New Size(48, 15)
        Label8.TabIndex = 14
        Label8.Text = "ClientID"
        ' 
        ' Label7
        ' 
        Label7.AutoSize = True
        Label7.Location = New Point(42, 49)
        Label7.Name = "Label7"
        Label7.Size = New Size(50, 15)
        Label7.TabIndex = 13
        Label7.Text = "SecretID"
        ' 
        ' Label_Domain
        ' 
        Label_Domain.AutoSize = True
        Label_Domain.Location = New Point(7, 14)
        Label_Domain.Name = "Label_Domain"
        Label_Domain.Size = New Size(69, 15)
        Label_Domain.TabIndex = 4
        Label_Domain.Text = "API Domain"
        ' 
        ' Label_MaxUser
        ' 
        Label_MaxUser.AutoSize = True
        Label_MaxUser.Location = New Point(224, 17)
        Label_MaxUser.Name = "Label_MaxUser"
        Label_MaxUser.Size = New Size(79, 15)
        Label_MaxUser.TabIndex = 4
        Label_MaxUser.Text = "最大ユーザー数"
        ' 
        ' Label2
        ' 
        Label2.AutoSize = True
        Label2.Location = New Point(42, 21)
        Label2.Name = "Label2"
        Label2.Size = New Size(194, 15)
        Label2.TabIndex = 5
        Label2.Text = "1回あたりの最大変換数（即時変換）"
        ' 
        ' Label3
        ' 
        Label3.AutoSize = True
        Label3.Location = New Point(101, 47)
        Label3.Name = "Label3"
        Label3.Size = New Size(134, 15)
        Label3.TabIndex = 5
        Label3.Text = "変換最大数(夜間バッチ）"
        ' 
        ' GroupBox_PDF
        ' 
        GroupBox_PDF.Controls.Add(ComboBox_RasterConvert)
        GroupBox_PDF.Controls.Add(Label20)
        GroupBox_PDF.Controls.Add(TextBox_PDF_CONVERSION_MAX_BATCH)
        GroupBox_PDF.Controls.Add(TextBox_PDF_CONVERSION_MAX_IMMEDIATE)
        GroupBox_PDF.Controls.Add(Label3)
        GroupBox_PDF.Controls.Add(Label2)
        GroupBox_PDF.Location = New Point(5, 12)
        GroupBox_PDF.Name = "GroupBox_PDF"
        GroupBox_PDF.Size = New Size(358, 100)
        GroupBox_PDF.TabIndex = 3
        GroupBox_PDF.TabStop = False
        GroupBox_PDF.Text = "PDF変換"
        ' 
        ' ComboBox_RasterConvert
        ' 
        ComboBox_RasterConvert.DropDownStyle = ComboBoxStyle.DropDownList
        ComboBox_RasterConvert.FormattingEnabled = True
        ComboBox_RasterConvert.Location = New Point(247, 73)
        ComboBox_RasterConvert.Name = "ComboBox_RasterConvert"
        ComboBox_RasterConvert.Size = New Size(99, 23)
        ComboBox_RasterConvert.TabIndex = 10
        ' 
        ' Label20
        ' 
        Label20.AutoSize = True
        Label20.Location = New Point(144, 75)
        Label20.Name = "Label20"
        Label20.Size = New Size(80, 15)
        Label20.TabIndex = 9
        Label20.Text = "画像変換モード"
        ' 
        ' TextBox_PDF_CONVERSION_MAX_BATCH
        ' 
        TextBox_PDF_CONVERSION_MAX_BATCH.Location = New Point(247, 44)
        TextBox_PDF_CONVERSION_MAX_BATCH.Name = "TextBox_PDF_CONVERSION_MAX_BATCH"
        TextBox_PDF_CONVERSION_MAX_BATCH.Size = New Size(99, 23)
        TextBox_PDF_CONVERSION_MAX_BATCH.TabIndex = 8
        ' 
        ' TextBox_PDF_CONVERSION_MAX_IMMEDIATE
        ' 
        TextBox_PDF_CONVERSION_MAX_IMMEDIATE.Location = New Point(247, 18)
        TextBox_PDF_CONVERSION_MAX_IMMEDIATE.Name = "TextBox_PDF_CONVERSION_MAX_IMMEDIATE"
        TextBox_PDF_CONVERSION_MAX_IMMEDIATE.Size = New Size(99, 23)
        TextBox_PDF_CONVERSION_MAX_IMMEDIATE.TabIndex = 7
        ' 
        ' Button_Exec
        ' 
        Button_Exec.Location = New Point(286, 547)
        Button_Exec.Name = "Button_Exec"
        Button_Exec.Size = New Size(99, 43)
        Button_Exec.TabIndex = 31
        Button_Exec.Text = "実行"
        Button_Exec.UseVisualStyleBackColor = True
        ' 
        ' GroupBox_Upload
        ' 
        GroupBox_Upload.Controls.Add(TextBox_UPLOAD_FILE_NUMBER_MAX)
        GroupBox_Upload.Controls.Add(TextBox_UPLOAD_SIZE_MAX)
        GroupBox_Upload.Controls.Add(Label5)
        GroupBox_Upload.Controls.Add(Label6)
        GroupBox_Upload.Location = New Point(5, 11)
        GroupBox_Upload.Name = "GroupBox_Upload"
        GroupBox_Upload.Size = New Size(358, 78)
        GroupBox_Upload.TabIndex = 3
        GroupBox_Upload.TabStop = False
        GroupBox_Upload.Text = "アップロード制限値"
        ' 
        ' TextBox_UPLOAD_FILE_NUMBER_MAX
        ' 
        TextBox_UPLOAD_FILE_NUMBER_MAX.Cursor = Cursors.Cross
        TextBox_UPLOAD_FILE_NUMBER_MAX.Location = New Point(247, 48)
        TextBox_UPLOAD_FILE_NUMBER_MAX.Name = "TextBox_UPLOAD_FILE_NUMBER_MAX"
        TextBox_UPLOAD_FILE_NUMBER_MAX.Size = New Size(99, 23)
        TextBox_UPLOAD_FILE_NUMBER_MAX.TabIndex = 6
        ' 
        ' TextBox_UPLOAD_SIZE_MAX
        ' 
        TextBox_UPLOAD_SIZE_MAX.Location = New Point(247, 21)
        TextBox_UPLOAD_SIZE_MAX.Name = "TextBox_UPLOAD_SIZE_MAX"
        TextBox_UPLOAD_SIZE_MAX.Size = New Size(99, 23)
        TextBox_UPLOAD_SIZE_MAX.TabIndex = 5
        ' 
        ' Label5
        ' 
        Label5.AutoSize = True
        Label5.Location = New Point(55, 51)
        Label5.Name = "Label5"
        Label5.Size = New Size(171, 15)
        Label5.TabIndex = 5
        Label5.Text = "1操作でアップできる最大ファイル数"
        ' 
        ' Label6
        ' 
        Label6.AutoSize = True
        Label6.Location = New Point(8, 24)
        Label6.Name = "Label6"
        Label6.Size = New Size(230, 15)
        Label6.TabIndex = 5
        Label6.Text = "アップ時のファイルサイズ（1ファイルのバイト数）"
        ' 
        ' ComboBox_LOG_LEVEL
        ' 
        ComboBox_LOG_LEVEL.DropDownStyle = ComboBoxStyle.DropDownList
        ComboBox_LOG_LEVEL.FormattingEnabled = True
        ComboBox_LOG_LEVEL.Location = New Point(246, 43)
        ComboBox_LOG_LEVEL.Name = "ComboBox_LOG_LEVEL"
        ComboBox_LOG_LEVEL.Size = New Size(99, 23)
        ComboBox_LOG_LEVEL.TabIndex = 10
        ' 
        ' Label1
        ' 
        Label1.AutoSize = True
        Label1.Location = New Point(175, 48)
        Label1.Name = "Label1"
        Label1.Size = New Size(49, 15)
        Label1.TabIndex = 4
        Label1.Text = "ログモード"
        ' 
        ' CheckBox_メール通知
        ' 
        CheckBox_メール通知.AutoSize = True
        CheckBox_メール通知.Location = New Point(5, 5)
        CheckBox_メール通知.Name = "CheckBox_メール通知"
        CheckBox_メール通知.Size = New Size(100, 19)
        CheckBox_メール通知.TabIndex = 13
        CheckBox_メール通知.Text = "メール通知機能"
        CheckBox_メール通知.UseVisualStyleBackColor = True
        ' 
        ' ComboBox_ExecMode
        ' 
        ComboBox_ExecMode.DropDownStyle = ComboBoxStyle.DropDownList
        ComboBox_ExecMode.FormattingEnabled = True
        ComboBox_ExecMode.Location = New Point(167, 547)
        ComboBox_ExecMode.Name = "ComboBox_ExecMode"
        ComboBox_ExecMode.Size = New Size(114, 23)
        ComboBox_ExecMode.TabIndex = 30
        ' 
        ' Label4
        ' 
        Label4.AutoSize = True
        Label4.Location = New Point(104, 551)
        Label4.Name = "Label4"
        Label4.Size = New Size(56, 15)
        Label4.TabIndex = 4
        Label4.Text = "実行モード"
        ' 
        ' TextBox_Domain
        ' 
        TextBox_Domain.Location = New Point(79, 11)
        TextBox_Domain.Name = "TextBox_Domain"
        TextBox_Domain.Size = New Size(129, 23)
        TextBox_Domain.TabIndex = 3
        ' 
        ' TextBox_MaxUsers
        ' 
        TextBox_MaxUsers.AllowDrop = True
        TextBox_MaxUsers.Cursor = Cursors.UpArrow
        TextBox_MaxUsers.Location = New Point(309, 14)
        TextBox_MaxUsers.Name = "TextBox_MaxUsers"
        TextBox_MaxUsers.Size = New Size(51, 23)
        TextBox_MaxUsers.TabIndex = 4
        ' 
        ' ProgressBar
        ' 
        ProgressBar.Location = New Point(8, 20)
        ProgressBar.Name = "ProgressBar"
        ProgressBar.Size = New Size(358, 18)
        ProgressBar.TabIndex = 14
        ' 
        ' GroupBox_Progress
        ' 
        GroupBox_Progress.Controls.Add(ProgressBar)
        GroupBox_Progress.Location = New Point(11, 492)
        GroupBox_Progress.Name = "GroupBox_Progress"
        GroupBox_Progress.Size = New Size(376, 45)
        GroupBox_Progress.TabIndex = 16
        GroupBox_Progress.TabStop = False
        GroupBox_Progress.Text = "ぷろぐれすばぁ"
        ' 
        ' GroupBox_General
        ' 
        GroupBox_General.Controls.Add(ComboBox_LoginTimeout)
        GroupBox_General.Controls.Add(Label16)
        GroupBox_General.Controls.Add(ComboBox_vScroll)
        GroupBox_General.Controls.Add(Label_vScroll)
        GroupBox_General.Controls.Add(ComboBox_LOG_LEVEL)
        GroupBox_General.Controls.Add(Label1)
        GroupBox_General.Location = New Point(5, 131)
        GroupBox_General.Name = "GroupBox_General"
        GroupBox_General.Size = New Size(358, 103)
        GroupBox_General.TabIndex = 9
        GroupBox_General.TabStop = False
        GroupBox_General.Text = "全般"
        ' 
        ' ComboBox_LoginTimeout
        ' 
        ComboBox_LoginTimeout.DropDownStyle = ComboBoxStyle.DropDownList
        ComboBox_LoginTimeout.FormattingEnabled = True
        ComboBox_LoginTimeout.Location = New Point(246, 72)
        ComboBox_LoginTimeout.Name = "ComboBox_LoginTimeout"
        ComboBox_LoginTimeout.Size = New Size(99, 23)
        ComboBox_LoginTimeout.TabIndex = 11
        ' 
        ' Label16
        ' 
        Label16.AutoSize = True
        Label16.Location = New Point(112, 77)
        Label16.Name = "Label16"
        Label16.Size = New Size(123, 15)
        Label16.TabIndex = 11
        Label16.Text = "ログインタイムアウト(分）"
        ' 
        ' ComboBox_vScroll
        ' 
        ComboBox_vScroll.DropDownStyle = ComboBoxStyle.DropDownList
        ComboBox_vScroll.FormattingEnabled = True
        ComboBox_vScroll.Location = New Point(246, 16)
        ComboBox_vScroll.Name = "ComboBox_vScroll"
        ComboBox_vScroll.Size = New Size(99, 23)
        ComboBox_vScroll.TabIndex = 9
        ' 
        ' Label_vScroll
        ' 
        Label_vScroll.AutoSize = True
        Label_vScroll.Location = New Point(127, 19)
        Label_vScroll.Name = "Label_vScroll"
        Label_vScroll.Size = New Size(97, 15)
        Label_vScroll.TabIndex = 5
        Label_vScroll.Text = "縦スクロールバッファ"
        ' 
        ' CheckBox_GrabTool
        ' 
        CheckBox_GrabTool.AutoSize = True
        CheckBox_GrabTool.Location = New Point(6, 22)
        CheckBox_GrabTool.Name = "CheckBox_GrabTool"
        CheckBox_GrabTool.Size = New Size(234, 19)
        CheckBox_GrabTool.TabIndex = 12
        CheckBox_GrabTool.Text = "「手のひらツール」を最初から使用可能にする"
        CheckBox_GrabTool.UseVisualStyleBackColor = True
        ' 
        ' GroupBox_MailServer
        ' 
        GroupBox_MailServer.Controls.Add(Label15)
        GroupBox_MailServer.Controls.Add(TextBox_mail_smtp_connectiontimeout)
        GroupBox_MailServer.Controls.Add(Button_TeCA_SMTP)
        GroupBox_MailServer.Controls.Add(CheckBox_mail_smtp_auth)
        GroupBox_MailServer.Controls.Add(Label13)
        GroupBox_MailServer.Controls.Add(TextBox_mail_smtp_port)
        GroupBox_MailServer.Controls.Add(Label12)
        GroupBox_MailServer.Controls.Add(TextBox_mail_smtp_host)
        GroupBox_MailServer.Controls.Add(CheckBox_mail_smtp_starttls_enable)
        GroupBox_MailServer.Controls.Add(TextBox_password)
        GroupBox_MailServer.Controls.Add(Label11)
        GroupBox_MailServer.Controls.Add(Label_SenderID)
        GroupBox_MailServer.Controls.Add(TextBox_user)
        GroupBox_MailServer.Controls.Add(Label10)
        GroupBox_MailServer.Controls.Add(TextBox_from_name)
        GroupBox_MailServer.Controls.Add(Label9)
        GroupBox_MailServer.Controls.Add(ComboBox_mail_transport_protocol)
        GroupBox_MailServer.Location = New Point(5, 28)
        GroupBox_MailServer.Name = "GroupBox_MailServer"
        GroupBox_MailServer.Size = New Size(362, 257)
        GroupBox_MailServer.TabIndex = 17
        GroupBox_MailServer.TabStop = False
        GroupBox_MailServer.Text = "送信サーバー"
        ' 
        ' Label15
        ' 
        Label15.AutoSize = True
        Label15.Location = New Point(36, 226)
        Label15.Name = "Label15"
        Label15.Size = New Size(84, 15)
        Label15.TabIndex = 22
        Label15.Text = "送信タイムアウト"
        ' 
        ' TextBox_mail_smtp_connectiontimeout
        ' 
        TextBox_mail_smtp_connectiontimeout.Location = New Point(132, 223)
        TextBox_mail_smtp_connectiontimeout.Name = "TextBox_mail_smtp_connectiontimeout"
        TextBox_mail_smtp_connectiontimeout.Size = New Size(88, 23)
        TextBox_mail_smtp_connectiontimeout.TabIndex = 23
        ' 
        ' Button_TeCA_SMTP
        ' 
        Button_TeCA_SMTP.Location = New Point(176, 17)
        Button_TeCA_SMTP.Name = "Button_TeCA_SMTP"
        Button_TeCA_SMTP.Size = New Size(161, 28)
        Button_TeCA_SMTP.TabIndex = 14
        Button_TeCA_SMTP.Text = "「TeCA内SMTP」で設定する"
        Button_TeCA_SMTP.UseVisualStyleBackColor = True
        ' 
        ' CheckBox_mail_smtp_auth
        ' 
        CheckBox_mail_smtp_auth.AutoSize = True
        CheckBox_mail_smtp_auth.Location = New Point(26, 141)
        CheckBox_mail_smtp_auth.Name = "CheckBox_mail_smtp_auth"
        CheckBox_mail_smtp_auth.Size = New Size(80, 19)
        CheckBox_mail_smtp_auth.TabIndex = 20
        CheckBox_mail_smtp_auth.Text = "SMTP認証"
        CheckBox_mail_smtp_auth.UseVisualStyleBackColor = True
        ' 
        ' Label13
        ' 
        Label13.AutoSize = True
        Label13.Location = New Point(245, 56)
        Label13.Name = "Label13"
        Label13.Size = New Size(33, 15)
        Label13.TabIndex = 13
        Label13.Text = "ポート"
        ' 
        ' TextBox_mail_smtp_port
        ' 
        TextBox_mail_smtp_port.Location = New Point(284, 52)
        TextBox_mail_smtp_port.Name = "TextBox_mail_smtp_port"
        TextBox_mail_smtp_port.Size = New Size(53, 23)
        TextBox_mail_smtp_port.TabIndex = 17
        ' 
        ' Label12
        ' 
        Label12.AutoSize = True
        Label12.Location = New Point(26, 83)
        Label12.Name = "Label12"
        Label12.Size = New Size(43, 15)
        Label12.TabIndex = 11
        Label12.Text = "サーバー"
        ' 
        ' TextBox_mail_smtp_host
        ' 
        TextBox_mail_smtp_host.Location = New Point(83, 80)
        TextBox_mail_smtp_host.Name = "TextBox_mail_smtp_host"
        TextBox_mail_smtp_host.Size = New Size(254, 23)
        TextBox_mail_smtp_host.TabIndex = 18
        ' 
        ' CheckBox_mail_smtp_starttls_enable
        ' 
        CheckBox_mail_smtp_starttls_enable.AutoSize = True
        CheckBox_mail_smtp_starttls_enable.Location = New Point(159, 56)
        CheckBox_mail_smtp_starttls_enable.Name = "CheckBox_mail_smtp_starttls_enable"
        CheckBox_mail_smtp_starttls_enable.Size = New Size(77, 19)
        CheckBox_mail_smtp_starttls_enable.TabIndex = 16
        CheckBox_mail_smtp_starttls_enable.Text = "STARTTLS"
        CheckBox_mail_smtp_starttls_enable.UseVisualStyleBackColor = True
        ' 
        ' TextBox_password
        ' 
        TextBox_password.Location = New Point(132, 192)
        TextBox_password.Name = "TextBox_password"
        TextBox_password.Size = New Size(205, 23)
        TextBox_password.TabIndex = 22
        TextBox_password.UseSystemPasswordChar = True
        ' 
        ' Label11
        ' 
        Label11.AutoSize = True
        Label11.Location = New Point(74, 197)
        Label11.Name = "Label11"
        Label11.Size = New Size(51, 15)
        Label11.TabIndex = 7
        Label11.Text = "パスワード"
        ' 
        ' Label_SenderID
        ' 
        Label_SenderID.AutoSize = True
        Label_SenderID.Location = New Point(51, 168)
        Label_SenderID.Name = "Label_SenderID"
        Label_SenderID.Size = New Size(75, 15)
        Label_SenderID.TabIndex = 6
        Label_SenderID.Text = "送信メアド(ID)"
        ' 
        ' TextBox_user
        ' 
        TextBox_user.Location = New Point(132, 163)
        TextBox_user.Name = "TextBox_user"
        TextBox_user.Size = New Size(205, 23)
        TextBox_user.TabIndex = 21
        TextBox_user.Text = "message@teca.photron.com"
        ' 
        ' Label10
        ' 
        Label10.AutoSize = True
        Label10.Location = New Point(24, 112)
        Label10.Name = "Label10"
        Label10.Size = New Size(55, 15)
        Label10.TabIndex = 4
        Label10.Text = "送信者名"
        ' 
        ' TextBox_from_name
        ' 
        TextBox_from_name.Location = New Point(83, 109)
        TextBox_from_name.Name = "TextBox_from_name"
        TextBox_from_name.Size = New Size(254, 23)
        TextBox_from_name.TabIndex = 19
        TextBox_from_name.Text = "TeCA通知メール"
        ' 
        ' Label9
        ' 
        Label9.AutoSize = True
        Label9.Location = New Point(26, 60)
        Label9.Name = "Label9"
        Label9.Size = New Size(51, 15)
        Label9.TabIndex = 1
        Label9.Text = "プロトコル"
        ' 
        ' ComboBox_mail_transport_protocol
        ' 
        ComboBox_mail_transport_protocol.FormattingEnabled = True
        ComboBox_mail_transport_protocol.Location = New Point(83, 54)
        ComboBox_mail_transport_protocol.Name = "ComboBox_mail_transport_protocol"
        ComboBox_mail_transport_protocol.Size = New Size(62, 23)
        ComboBox_mail_transport_protocol.TabIndex = 15
        ' 
        ' GroupBox_APIparams
        ' 
        GroupBox_APIparams.Controls.Add(TextBoxAuthText)
        GroupBox_APIparams.Controls.Add(TextBox_UPLOAD_CHUNK_SIZE)
        GroupBox_APIparams.Controls.Add(Label22)
        GroupBox_APIparams.Controls.Add(Label14)
        GroupBox_APIparams.Location = New Point(7, 54)
        GroupBox_APIparams.Name = "GroupBox_APIparams"
        GroupBox_APIparams.Size = New Size(358, 83)
        GroupBox_APIparams.TabIndex = 18
        GroupBox_APIparams.TabStop = False
        GroupBox_APIparams.Text = "APIパラメータ"
        ' 
        ' TextBoxAuthText
        ' 
        TextBoxAuthText.Location = New Point(66, 16)
        TextBoxAuthText.Name = "TextBoxAuthText"
        TextBoxAuthText.Size = New Size(286, 23)
        TextBoxAuthText.TabIndex = 28
        ' 
        ' TextBox_UPLOAD_CHUNK_SIZE
        ' 
        TextBox_UPLOAD_CHUNK_SIZE.Location = New Point(222, 45)
        TextBox_UPLOAD_CHUNK_SIZE.Name = "TextBox_UPLOAD_CHUNK_SIZE"
        TextBox_UPLOAD_CHUNK_SIZE.Size = New Size(130, 23)
        TextBox_UPLOAD_CHUNK_SIZE.TabIndex = 24
        ' 
        ' Label22
        ' 
        Label22.AutoSize = True
        Label22.Location = New Point(6, 20)
        Label22.Name = "Label22"
        Label22.Size = New Size(54, 15)
        Label22.TabIndex = 27
        Label22.Text = "AuthText"
        ' 
        ' Label14
        ' 
        Label14.AutoSize = True
        Label14.Location = New Point(69, 48)
        Label14.Name = "Label14"
        Label14.Size = New Size(125, 15)
        Label14.TabIndex = 7
        Label14.Text = "UPLOAD_CHUNK_SIZE"
        ' 
        ' GroupBox_DWG
        ' 
        GroupBox_DWG.Controls.Add(Button_DWG)
        GroupBox_DWG.Controls.Add(TextBox_DWG)
        GroupBox_DWG.Location = New Point(5, 240)
        GroupBox_DWG.Name = "GroupBox_DWG"
        GroupBox_DWG.Size = New Size(358, 49)
        GroupBox_DWG.TabIndex = 25
        GroupBox_DWG.TabStop = False
        GroupBox_DWG.Text = "DWG変換設定ファイル"
        ' 
        ' Button_DWG
        ' 
        Button_DWG.Location = New Point(304, 20)
        Button_DWG.Name = "Button_DWG"
        Button_DWG.Size = New Size(48, 23)
        Button_DWG.TabIndex = 26
        Button_DWG.Text = "実行"
        Button_DWG.UseVisualStyleBackColor = True
        ' 
        ' TextBox_DWG
        ' 
        TextBox_DWG.AllowDrop = True
        TextBox_DWG.Location = New Point(10, 20)
        TextBox_DWG.Name = "TextBox_DWG"
        TextBox_DWG.Size = New Size(290, 23)
        TextBox_DWG.TabIndex = 25
        ' 
        ' CheckBox_Pipeman
        ' 
        CheckBox_Pipeman.AutoSize = True
        CheckBox_Pipeman.Location = New Point(167, 573)
        CheckBox_Pipeman.Name = "CheckBox_Pipeman"
        CheckBox_Pipeman.Size = New Size(101, 19)
        CheckBox_Pipeman.TabIndex = 32
        CheckBox_Pipeman.Text = "ゴミジョブを掃除"
        CheckBox_Pipeman.UseVisualStyleBackColor = True
        ' 
        ' GroupBox_KOKAI
        ' 
        GroupBox_KOKAI.Controls.Add(CheckBox_EnableKokai)
        GroupBox_KOKAI.Controls.Add(CheckBox_PublicateWorkflowOK)
        GroupBox_KOKAI.Controls.Add(CheckBox_UnpublicCheckin)
        GroupBox_KOKAI.Controls.Add(CheckBox_UploadDefault)
        GroupBox_KOKAI.Location = New Point(5, 101)
        GroupBox_KOKAI.Name = "GroupBox_KOKAI"
        GroupBox_KOKAI.Size = New Size(358, 117)
        GroupBox_KOKAI.TabIndex = 9
        GroupBox_KOKAI.TabStop = False
        GroupBox_KOKAI.Text = "公開の既定値"
        ' 
        ' CheckBox_EnableKokai
        ' 
        CheckBox_EnableKokai.AutoSize = True
        CheckBox_EnableKokai.Location = New Point(12, 91)
        CheckBox_EnableKokai.Name = "CheckBox_EnableKokai"
        CheckBox_EnableKokai.Size = New Size(159, 19)
        CheckBox_EnableKokai.TabIndex = 30
        CheckBox_EnableKokai.Text = "公開機能を使用可能にする"
        CheckBox_EnableKokai.TextImageRelation = TextImageRelation.TextBeforeImage
        CheckBox_EnableKokai.UseVisualStyleBackColor = True
        ' 
        ' CheckBox_PublicateWorkflowOK
        ' 
        CheckBox_PublicateWorkflowOK.AutoSize = True
        CheckBox_PublicateWorkflowOK.Location = New Point(12, 66)
        CheckBox_PublicateWorkflowOK.Name = "CheckBox_PublicateWorkflowOK"
        CheckBox_PublicateWorkflowOK.Size = New Size(203, 19)
        CheckBox_PublicateWorkflowOK.TabIndex = 29
        CheckBox_PublicateWorkflowOK.Text = "ワークフローを完了したら自動公開する"
        CheckBox_PublicateWorkflowOK.UseVisualStyleBackColor = True
        ' 
        ' CheckBox_UnpublicCheckin
        ' 
        CheckBox_UnpublicCheckin.AutoSize = True
        CheckBox_UnpublicCheckin.Location = New Point(12, 42)
        CheckBox_UnpublicCheckin.Name = "CheckBox_UnpublicCheckin"
        CheckBox_UnpublicCheckin.Size = New Size(224, 19)
        CheckBox_UnpublicCheckin.TabIndex = 28
        CheckBox_UnpublicCheckin.Text = "差し替え、チェックイン直後は非公開にする"
        CheckBox_UnpublicCheckin.UseVisualStyleBackColor = True
        ' 
        ' CheckBox_UploadDefault
        ' 
        CheckBox_UploadDefault.AutoSize = True
        CheckBox_UploadDefault.Location = New Point(12, 18)
        CheckBox_UploadDefault.Name = "CheckBox_UploadDefault"
        CheckBox_UploadDefault.Size = New Size(175, 19)
        CheckBox_UploadDefault.TabIndex = 27
        CheckBox_UploadDefault.Text = "アップロード直後は非公開にする"
        CheckBox_UploadDefault.UseVisualStyleBackColor = True
        ' 
        ' Label_notice
        ' 
        Label_notice.Location = New Point(11, 467)
        Label_notice.Name = "Label_notice"
        Label_notice.Size = New Size(376, 23)
        Label_notice.TabIndex = 13
        Label_notice.Text = "none"
        ' 
        ' TabControl1
        ' 
        TabControl1.Controls.Add(TabPage1)
        TabControl1.Controls.Add(TabPage3)
        TabControl1.Controls.Add(TabPage4)
        TabControl1.Controls.Add(Tab_mail)
        TabControl1.Controls.Add(TabPage2)
        TabControl1.Location = New Point(8, 82)
        TabControl1.Margin = New Padding(2)
        TabControl1.Name = "TabControl1"
        TabControl1.SelectedIndex = 0
        TabControl1.Size = New Size(382, 383)
        TabControl1.TabIndex = 33
        ' 
        ' TabPage1
        ' 
        TabPage1.Controls.Add(Button_ChangePwd)
        TabPage1.Controls.Add(GroupBox_SystemID)
        TabPage1.Controls.Add(Label_Domain)
        TabPage1.Controls.Add(TextBox_Domain)
        TabPage1.Controls.Add(TextBox_MaxUsers)
        TabPage1.Controls.Add(Label_MaxUser)
        TabPage1.Controls.Add(GroupBox_APIparams)
        TabPage1.Location = New Point(4, 24)
        TabPage1.Margin = New Padding(2)
        TabPage1.Name = "TabPage1"
        TabPage1.Padding = New Padding(2)
        TabPage1.Size = New Size(374, 355)
        TabPage1.TabIndex = 2
        TabPage1.Text = "システム情報・API"
        TabPage1.UseVisualStyleBackColor = True
        ' 
        ' Button_ChangePwd
        ' 
        Button_ChangePwd.Location = New Point(196, 143)
        Button_ChangePwd.Name = "Button_ChangePwd"
        Button_ChangePwd.Size = New Size(169, 24)
        Button_ChangePwd.TabIndex = 21
        Button_ChangePwd.Text = "パスワードの強制変更"
        Button_ChangePwd.UseVisualStyleBackColor = True
        ' 
        ' GroupBox_SystemID
        ' 
        GroupBox_SystemID.Controls.Add(TextBoxSecretID)
        GroupBox_SystemID.Controls.Add(CheckBox_setLocal)
        GroupBox_SystemID.Controls.Add(Label21)
        GroupBox_SystemID.Controls.Add(TextBoxClientID)
        GroupBox_SystemID.Controls.Add(Label_ClientID)
        GroupBox_SystemID.Location = New Point(5, 176)
        GroupBox_SystemID.Name = "GroupBox_SystemID"
        GroupBox_SystemID.Size = New Size(358, 105)
        GroupBox_SystemID.TabIndex = 20
        GroupBox_SystemID.TabStop = False
        GroupBox_SystemID.Text = "ソフトウェア識別情報"
        ' 
        ' TextBoxSecretID
        ' 
        TextBoxSecretID.Location = New Point(183, 46)
        TextBoxSecretID.Name = "TextBoxSecretID"
        TextBoxSecretID.Size = New Size(169, 23)
        TextBoxSecretID.TabIndex = 26
        ' 
        ' CheckBox_setLocal
        ' 
        CheckBox_setLocal.AutoSize = True
        CheckBox_setLocal.Location = New Point(8, 24)
        CheckBox_setLocal.Name = "CheckBox_setLocal"
        CheckBox_setLocal.Size = New Size(113, 19)
        CheckBox_setLocal.TabIndex = 19
        CheckBox_setLocal.Text = "LocalHostの設定"
        CheckBox_setLocal.UseVisualStyleBackColor = True
        ' 
        ' Label21
        ' 
        Label21.AutoSize = True
        Label21.Location = New Point(127, 49)
        Label21.Name = "Label21"
        Label21.Size = New Size(50, 15)
        Label21.TabIndex = 25
        Label21.Text = "SecretID"
        ' 
        ' TextBoxClientID
        ' 
        TextBoxClientID.Location = New Point(183, 19)
        TextBoxClientID.Name = "TextBoxClientID"
        TextBoxClientID.Size = New Size(170, 23)
        TextBoxClientID.TabIndex = 24
        ' 
        ' Label_ClientID
        ' 
        Label_ClientID.AutoSize = True
        Label_ClientID.Location = New Point(127, 25)
        Label_ClientID.Name = "Label_ClientID"
        Label_ClientID.Size = New Size(48, 15)
        Label_ClientID.TabIndex = 7
        Label_ClientID.Text = "ClientID"
        ' 
        ' TabPage3
        ' 
        TabPage3.Controls.Add(GroupBox_PDF)
        TabPage3.Controls.Add(GroupBox_General)
        TabPage3.Controls.Add(GroupBox_DWG)
        TabPage3.Location = New Point(4, 24)
        TabPage3.Margin = New Padding(2)
        TabPage3.Name = "TabPage3"
        TabPage3.Padding = New Padding(2)
        TabPage3.Size = New Size(374, 355)
        TabPage3.TabIndex = 3
        TabPage3.Text = "操作"
        TabPage3.UseVisualStyleBackColor = True
        ' 
        ' TabPage4
        ' 
        TabPage4.Controls.Add(GroupBox_FileHistory)
        TabPage4.Controls.Add(GroupBox_AttrChange)
        TabPage4.Controls.Add(GroupBox_workflowDesign)
        TabPage4.Controls.Add(GroupBox_Thumbnail)
        TabPage4.Controls.Add(GroupBox_PreViewWindow)
        TabPage4.Controls.Add(GroupBox_FileSelector)
        TabPage4.Location = New Point(4, 24)
        TabPage4.Name = "TabPage4"
        TabPage4.Padding = New Padding(3)
        TabPage4.Size = New Size(374, 355)
        TabPage4.TabIndex = 4
        TabPage4.Text = "画面デザイン"
        TabPage4.UseVisualStyleBackColor = True
        ' 
        ' GroupBox_AttrChange
        ' 
        GroupBox_AttrChange.Controls.Add(CheckBox_CalPickerAutoAdjust)
        GroupBox_AttrChange.Location = New Point(11, 259)
        GroupBox_AttrChange.Name = "GroupBox_AttrChange"
        GroupBox_AttrChange.Size = New Size(351, 43)
        GroupBox_AttrChange.TabIndex = 18
        GroupBox_AttrChange.TabStop = False
        GroupBox_AttrChange.Text = "属性変更"
        ' 
        ' CheckBox_CalPickerAutoAdjust
        ' 
        CheckBox_CalPickerAutoAdjust.AutoSize = True
        CheckBox_CalPickerAutoAdjust.Location = New Point(6, 18)
        CheckBox_CalPickerAutoAdjust.Name = "CheckBox_CalPickerAutoAdjust"
        CheckBox_CalPickerAutoAdjust.Size = New Size(204, 19)
        CheckBox_CalPickerAutoAdjust.TabIndex = 0
        CheckBox_CalPickerAutoAdjust.Text = "カレンダーピッカー位置を自動調整する"
        CheckBox_CalPickerAutoAdjust.UseVisualStyleBackColor = True
        ' 
        ' GroupBox_workflowDesign
        ' 
        GroupBox_workflowDesign.Controls.Add(CheckBox_workflowListExpandable)
        GroupBox_workflowDesign.Location = New Point(11, 214)
        GroupBox_workflowDesign.Name = "GroupBox_workflowDesign"
        GroupBox_workflowDesign.Size = New Size(354, 41)
        GroupBox_workflowDesign.TabIndex = 17
        GroupBox_workflowDesign.TabStop = False
        GroupBox_workflowDesign.Text = "ワークフロー申請ファイル"
        ' 
        ' CheckBox_workflowListExpandable
        ' 
        CheckBox_workflowListExpandable.AutoSize = True
        CheckBox_workflowListExpandable.Location = New Point(8, 16)
        CheckBox_workflowListExpandable.Name = "CheckBox_workflowListExpandable"
        CheckBox_workflowListExpandable.Size = New Size(178, 19)
        CheckBox_workflowListExpandable.TabIndex = 0
        CheckBox_workflowListExpandable.Text = "展開リスト行数を3行以上にする"
        CheckBox_workflowListExpandable.UseVisualStyleBackColor = True
        ' 
        ' GroupBox_Thumbnail
        ' 
        GroupBox_Thumbnail.Controls.Add(Label19)
        GroupBox_Thumbnail.Controls.Add(ComboBox_ThumbnailRatio)
        GroupBox_Thumbnail.Location = New Point(11, 163)
        GroupBox_Thumbnail.Name = "GroupBox_Thumbnail"
        GroupBox_Thumbnail.Size = New Size(354, 47)
        GroupBox_Thumbnail.TabIndex = 16
        GroupBox_Thumbnail.TabStop = False
        GroupBox_Thumbnail.Text = "検索結果ウィンドウ"
        ' 
        ' Label19
        ' 
        Label19.AutoSize = True
        Label19.Location = New Point(6, 21)
        Label19.Name = "Label19"
        Label19.Size = New Size(82, 15)
        Label19.TabIndex = 15
        Label19.Text = "サムネイルサイズ"
        ' 
        ' ComboBox_ThumbnailRatio
        ' 
        ComboBox_ThumbnailRatio.FormattingEnabled = True
        ComboBox_ThumbnailRatio.Location = New Point(103, 18)
        ComboBox_ThumbnailRatio.Name = "ComboBox_ThumbnailRatio"
        ComboBox_ThumbnailRatio.Size = New Size(61, 23)
        ComboBox_ThumbnailRatio.TabIndex = 14
        ' 
        ' GroupBox_PreViewWindow
        ' 
        GroupBox_PreViewWindow.Controls.Add(Label18)
        GroupBox_PreViewWindow.Controls.Add(ComboBox_PreViewScale)
        GroupBox_PreViewWindow.Controls.Add(CheckBox_GrabTool)
        GroupBox_PreViewWindow.Location = New Point(11, 6)
        GroupBox_PreViewWindow.Name = "GroupBox_PreViewWindow"
        GroupBox_PreViewWindow.Size = New Size(354, 71)
        GroupBox_PreViewWindow.TabIndex = 15
        GroupBox_PreViewWindow.TabStop = False
        GroupBox_PreViewWindow.Text = "プレビューウィンドウ"
        ' 
        ' Label18
        ' 
        Label18.AutoSize = True
        Label18.Location = New Point(6, 46)
        Label18.Name = "Label18"
        Label18.Size = New Size(67, 15)
        Label18.TabIndex = 15
        Label18.Text = "表示拡大率"
        ' 
        ' ComboBox_PreViewScale
        ' 
        ComboBox_PreViewScale.FormattingEnabled = True
        ComboBox_PreViewScale.Location = New Point(79, 43)
        ComboBox_PreViewScale.Name = "ComboBox_PreViewScale"
        ComboBox_PreViewScale.Size = New Size(141, 23)
        ComboBox_PreViewScale.TabIndex = 14
        ' 
        ' GroupBox_FileSelector
        ' 
        GroupBox_FileSelector.Controls.Add(GroupBox1)
        GroupBox_FileSelector.Controls.Add(Label17)
        GroupBox_FileSelector.Controls.Add(ComboBox_FileSelectLineNum)
        GroupBox_FileSelector.Controls.Add(CheckBox_Wide)
        GroupBox_FileSelector.Location = New Point(7, 82)
        GroupBox_FileSelector.Name = "GroupBox_FileSelector"
        GroupBox_FileSelector.Size = New Size(358, 77)
        GroupBox_FileSelector.TabIndex = 14
        GroupBox_FileSelector.TabStop = False
        GroupBox_FileSelector.Text = "ファイル選択ポップアップ"
        ' 
        ' GroupBox1
        ' 
        GroupBox1.Location = New Point(6, 153)
        GroupBox1.Name = "GroupBox1"
        GroupBox1.Size = New Size(352, 41)
        GroupBox1.TabIndex = 17
        GroupBox1.TabStop = False
        GroupBox1.Text = "ワークフロー"
        ' 
        ' Label17
        ' 
        Label17.AutoSize = True
        Label17.Location = New Point(7, 25)
        Label17.Name = "Label17"
        Label17.Size = New Size(132, 15)
        Label17.TabIndex = 14
        Label17.Text = "１ページあたりの最大行数"
        ' 
        ' ComboBox_FileSelectLineNum
        ' 
        ComboBox_FileSelectLineNum.FormattingEnabled = True
        ComboBox_FileSelectLineNum.Location = New Point(149, 22)
        ComboBox_FileSelectLineNum.Name = "ComboBox_FileSelectLineNum"
        ComboBox_FileSelectLineNum.Size = New Size(58, 23)
        ComboBox_FileSelectLineNum.TabIndex = 1
        ' 
        ' CheckBox_Wide
        ' 
        CheckBox_Wide.AutoSize = True
        CheckBox_Wide.Location = New Point(10, 51)
        CheckBox_Wide.Name = "CheckBox_Wide"
        CheckBox_Wide.Size = New Size(327, 19)
        CheckBox_Wide.TabIndex = 0
        CheckBox_Wide.Text = "ファイル名欄を広くする（すべてのポップアップが横長になります）"
        CheckBox_Wide.UseVisualStyleBackColor = True
        ' 
        ' Tab_mail
        ' 
        Tab_mail.Controls.Add(CheckBox_メール通知)
        Tab_mail.Controls.Add(GroupBox_MailServer)
        Tab_mail.Location = New Point(4, 24)
        Tab_mail.Margin = New Padding(2)
        Tab_mail.Name = "Tab_mail"
        Tab_mail.Padding = New Padding(2)
        Tab_mail.Size = New Size(374, 355)
        Tab_mail.TabIndex = 0
        Tab_mail.Text = "メール通知"
        Tab_mail.UseVisualStyleBackColor = True
        ' 
        ' TabPage2
        ' 
        TabPage2.Controls.Add(GroupBox_KOKAI)
        TabPage2.Controls.Add(GroupBox_Upload)
        TabPage2.Location = New Point(4, 24)
        TabPage2.Margin = New Padding(2)
        TabPage2.Name = "TabPage2"
        TabPage2.Padding = New Padding(2)
        TabPage2.Size = New Size(374, 355)
        TabPage2.TabIndex = 1
        TabPage2.Text = "アップロード・公開"
        TabPage2.UseVisualStyleBackColor = True
        ' 
        ' GroupBox_FileHistory
        ' 
        GroupBox_FileHistory.Controls.Add(CheckBox_FileHistroryScrollPosition)
        GroupBox_FileHistory.Location = New Point(13, 309)
        GroupBox_FileHistory.Name = "GroupBox_FileHistory"
        GroupBox_FileHistory.Size = New Size(351, 40)
        GroupBox_FileHistory.TabIndex = 19
        GroupBox_FileHistory.TabStop = False
        GroupBox_FileHistory.Text = "履歴ウィンドウ"
        ' 
        ' CheckBox_FileHistroryScrollPosition
        ' 
        CheckBox_FileHistroryScrollPosition.AutoSize = True
        CheckBox_FileHistroryScrollPosition.Location = New Point(3, 18)
        CheckBox_FileHistroryScrollPosition.Name = "CheckBox_FileHistroryScrollPosition"
        CheckBox_FileHistroryScrollPosition.Size = New Size(186, 19)
        CheckBox_FileHistroryScrollPosition.TabIndex = 0
        CheckBox_FileHistroryScrollPosition.Text = "スクロールバーを最新版位置に置く"
        CheckBox_FileHistroryScrollPosition.UseVisualStyleBackColor = True
        ' 
        ' Form_TeCASettings
        ' 
        AllowDrop = True
        AutoScaleDimensions = New SizeF(7F, 15F)
        AutoScaleMode = AutoScaleMode.Font
        ClientSize = New Size(407, 595)
        Controls.Add(TabControl1)
        Controls.Add(Label_notice)
        Controls.Add(CheckBox_Pipeman)
        Controls.Add(GroupBox_Progress)
        Controls.Add(ComboBox_ExecMode)
        Controls.Add(Button_Exec)
        Controls.Add(Label4)
        Controls.Add(GroupBox_ninsyo)
        FormBorderStyle = FormBorderStyle.Fixed3D
        Icon = CType(resources.GetObject("$this.Icon"), Icon)
        ImeMode = ImeMode.Off
        MaximizeBox = False
        MdiChildrenMinimizedAnchorBottom = False
        MinimizeBox = False
        Name = "Form_TeCASettings"
        Text = "図脳TeCA　システム設定ツール"
        GroupBox_ninsyo.ResumeLayout(False)
        GroupBox_ninsyo.PerformLayout()
        GroupBox_PDF.ResumeLayout(False)
        GroupBox_PDF.PerformLayout()
        GroupBox_Upload.ResumeLayout(False)
        GroupBox_Upload.PerformLayout()
        GroupBox_Progress.ResumeLayout(False)
        GroupBox_General.ResumeLayout(False)
        GroupBox_General.PerformLayout()
        GroupBox_MailServer.ResumeLayout(False)
        GroupBox_MailServer.PerformLayout()
        GroupBox_APIparams.ResumeLayout(False)
        GroupBox_APIparams.PerformLayout()
        GroupBox_DWG.ResumeLayout(False)
        GroupBox_DWG.PerformLayout()
        GroupBox_KOKAI.ResumeLayout(False)
        GroupBox_KOKAI.PerformLayout()
        TabControl1.ResumeLayout(False)
        TabPage1.ResumeLayout(False)
        TabPage1.PerformLayout()
        GroupBox_SystemID.ResumeLayout(False)
        GroupBox_SystemID.PerformLayout()
        TabPage3.ResumeLayout(False)
        TabPage4.ResumeLayout(False)
        GroupBox_AttrChange.ResumeLayout(False)
        GroupBox_AttrChange.PerformLayout()
        GroupBox_workflowDesign.ResumeLayout(False)
        GroupBox_workflowDesign.PerformLayout()
        GroupBox_Thumbnail.ResumeLayout(False)
        GroupBox_Thumbnail.PerformLayout()
        GroupBox_PreViewWindow.ResumeLayout(False)
        GroupBox_PreViewWindow.PerformLayout()
        GroupBox_FileSelector.ResumeLayout(False)
        GroupBox_FileSelector.PerformLayout()
        Tab_mail.ResumeLayout(False)
        Tab_mail.PerformLayout()
        TabPage2.ResumeLayout(False)
        GroupBox_FileHistory.ResumeLayout(False)
        GroupBox_FileHistory.PerformLayout()
        ResumeLayout(False)
        PerformLayout()
    End Sub

    Friend WithEvents TextBox_ClientID As TextBox
    Friend WithEvents TextBox_SecretID As TextBox
    Friend WithEvents Button_Nunsyo As Button
    Friend WithEvents GroupBox_ninsyo As GroupBox
    Friend WithEvents Label_Domain As Label
    Friend WithEvents Label_MaxUser As Label
    Friend WithEvents Label2 As Label
    Friend WithEvents Label3 As Label
    Friend WithEvents GroupBox_PDF As GroupBox
    Friend WithEvents Button_Exec As Button
    Friend WithEvents GroupBox_Upload As GroupBox
    Friend WithEvents Label5 As Label
    Friend WithEvents Label6 As Label
    Friend WithEvents ComboBox_LOG_LEVEL As ComboBox
    Friend WithEvents Label1 As Label
    Friend WithEvents TextBox_PDF_CONVERSION_MAX_BATCH As TextBox
    Friend WithEvents TextBox_PDF_CONVERSION_MAX_IMMEDIATE As TextBox
    Friend WithEvents TextBox_UPLOAD_FILE_NUMBER_MAX As TextBox
    Friend WithEvents TextBox_UPLOAD_SIZE_MAX As TextBox
    Friend WithEvents CheckBox_メール通知 As CheckBox
    Friend WithEvents ComboBox_ExecMode As ComboBox
    Friend WithEvents Label4 As Label
    Friend WithEvents TextBox_Domain As TextBox
    Friend WithEvents TextBox_MaxUsers As TextBox
    Friend WithEvents Label7 As Label
    Friend WithEvents Label8 As Label
    Friend WithEvents ProgressBar As ProgressBar
    Friend WithEvents GroupBox_Progress As GroupBox
    Friend WithEvents GroupBox_General As GroupBox
    Friend WithEvents Label_vScroll As Label
    Friend WithEvents ComboBox_vScroll As ComboBox
    Friend WithEvents GroupBox_MailServer As GroupBox
    Friend WithEvents Label9 As Label
    Friend WithEvents ComboBox_mail_transport_protocol As ComboBox
    Friend WithEvents ColorDialog1 As ColorDialog
    Friend WithEvents TextBox_user As TextBox
    Friend WithEvents Label10 As Label
    Friend WithEvents TextBox_from_name As TextBox
    Friend WithEvents Label_SenderID As Label
    Friend WithEvents TextBox_password As TextBox
    Friend WithEvents Label11 As Label
    Friend WithEvents Label13 As Label
    Friend WithEvents TextBox_mail_smtp_port As TextBox
    Friend WithEvents Label12 As Label
    Friend WithEvents TextBox_mail_smtp_host As TextBox
    Friend WithEvents CheckBox_mail_smtp_starttls_enable As CheckBox
    Friend WithEvents CheckBox_mail_smtp_auth As CheckBox
    Friend WithEvents Button_TeCA_SMTP As Button
    Friend WithEvents GroupBox_APIparams As GroupBox
    Friend WithEvents TextBox_UploadChunk As TextBox
    Friend WithEvents Label14 As Label
    Friend WithEvents TextBox_UPLOAD_CHUNK_SIZE As TextBox
    Friend WithEvents Label15 As Label
    Friend WithEvents TextBox_mail_smtp_connectiontimeout As TextBox
    Friend WithEvents GroupBox_DWG As GroupBox
    Friend WithEvents Button_DWG As Button
    Friend WithEvents TextBox_DWG As TextBox
    Friend WithEvents ComboBox_LoginTimeout As ComboBox
    Friend WithEvents Label16 As Label
    Friend WithEvents CheckBox_ As CheckBox
    Friend WithEvents CheckBox_Pipeman As CheckBox
    Friend WithEvents CheckBox_GrabTool As CheckBox
    Friend WithEvents GroupBox_KOKAI As GroupBox
    Friend WithEvents CheckBox_UnpublicCheckin As CheckBox
    Friend WithEvents CheckBox_UploadDefault As CheckBox
    Friend WithEvents CheckBox_PublicateWorkflowOK As CheckBox
    Friend WithEvents Label_notice As Label
    Friend WithEvents TabControl1 As TabControl
    Friend WithEvents Tab_mail As TabPage
    Friend WithEvents TabPage2 As TabPage
    Friend WithEvents TabPage1 As TabPage
    Friend WithEvents TabPage3 As TabPage
    Friend WithEvents TabPage4 As TabPage
    Friend WithEvents GroupBox_FileSelector As GroupBox
    Friend WithEvents ComboBox_FileSelectLineNum As ComboBox
    Friend WithEvents CheckBox_Wide As CheckBox
    Friend WithEvents Label17 As Label
    Friend WithEvents GroupBox_PreViewWindow As GroupBox
    Friend WithEvents Label18 As Label
    Friend WithEvents ComboBox_PreViewScale As ComboBox
    Friend WithEvents GroupBox_Thumbnail As GroupBox
    Friend WithEvents Label19 As Label
    Friend WithEvents ComboBox_ThumbnailRatio As ComboBox
    Friend WithEvents CheckBox_setLocal As CheckBox
    Friend WithEvents Label20 As Label
    Friend WithEvents ComboBox_RasterConvert As ComboBox
    Friend WithEvents GroupBox_SystemID As GroupBox
    Friend WithEvents TextBoxSecretID As TextBox
    Friend WithEvents Label21 As Label
    Friend WithEvents TextBoxClientID As TextBox
    Friend WithEvents Label_ClientID As Label
    Friend WithEvents TextBoxAuthText As TextBox
    Friend WithEvents Label22 As Label
    Friend WithEvents Button_ChangePwd As Button
    Friend WithEvents CheckBox_EnableKokai As CheckBox
    Friend WithEvents GroupBox1 As GroupBox
    Friend WithEvents GroupBox_workflowDesign As GroupBox
    Friend WithEvents CheckBox_workflowListExpandable As CheckBox
    Friend WithEvents GroupBox_AttrChange As GroupBox
    Friend WithEvents CheckBox_CalPickerAutoAdjust As CheckBox
    Friend WithEvents GroupBox_FileHistory As GroupBox
    Friend WithEvents CheckBox_FileHistroryScrollPosition As CheckBox
End Class
