<Global.Microsoft.VisualBasic.CompilerServices.DesignerGenerated()> _
Partial Class Form_ChangePWD
    Inherits System.Windows.Forms.Form

    'フォームがコンポーネントの一覧をクリーンアップするために dispose をオーバーライドします。
    <System.Diagnostics.DebuggerNonUserCode()> _
    Protected Overrides Sub Dispose(ByVal disposing As Boolean)
        Try
            If disposing AndAlso components IsNot Nothing Then
                components.Dispose()
            End If
        Finally
            MyBase.Dispose(disposing)
        End Try
    End Sub

    'Windows フォーム デザイナーで必要です。
    Private components As System.ComponentModel.IContainer

    'メモ: 以下のプロシージャは Windows フォーム デザイナーで必要です。
    'Windows フォーム デザイナーを使用して変更できます。  
    'コード エディターを使って変更しないでください。
    <System.Diagnostics.DebuggerStepThrough()> _
    Private Sub InitializeComponent()
        Dim resources As System.ComponentModel.ComponentResourceManager = New System.ComponentModel.ComponentResourceManager(GetType(Form_ChangePWD))
        ComboBox_UserID = New ComboBox()
        TextBox_Password = New TextBox()
        Button_DoPwdChange = New Button()
        Button_CancelPwdChange = New Button()
        DateTimePicker_kigen = New DateTimePicker()
        Label1 = New Label()
        SuspendLayout()
        ' 
        ' ComboBox_UserID
        ' 
        ComboBox_UserID.FormattingEnabled = True
        ComboBox_UserID.Location = New Point(12, 12)
        ComboBox_UserID.Name = "ComboBox_UserID"
        ComboBox_UserID.Size = New Size(149, 23)
        ComboBox_UserID.TabIndex = 0
        ' 
        ' TextBox_Password
        ' 
        TextBox_Password.Location = New Point(167, 12)
        TextBox_Password.Name = "TextBox_Password"
        TextBox_Password.PasswordChar = "*"c
        TextBox_Password.Size = New Size(186, 23)
        TextBox_Password.TabIndex = 1
        ' 
        ' Button_DoPwdChange
        ' 
        Button_DoPwdChange.Location = New Point(359, 12)
        Button_DoPwdChange.Name = "Button_DoPwdChange"
        Button_DoPwdChange.Size = New Size(76, 23)
        Button_DoPwdChange.TabIndex = 2
        Button_DoPwdChange.Text = "変更する"
        Button_DoPwdChange.UseVisualStyleBackColor = True
        ' 
        ' Button_CancelPwdChange
        ' 
        Button_CancelPwdChange.Location = New Point(359, 41)
        Button_CancelPwdChange.Name = "Button_CancelPwdChange"
        Button_CancelPwdChange.Size = New Size(76, 23)
        Button_CancelPwdChange.TabIndex = 3
        Button_CancelPwdChange.Text = "やめる"
        Button_CancelPwdChange.UseVisualStyleBackColor = True
        ' 
        ' DateTimePicker_kigen
        ' 
        DateTimePicker_kigen.Location = New Point(216, 41)
        DateTimePicker_kigen.Name = "DateTimePicker_kigen"
        DateTimePicker_kigen.Size = New Size(137, 23)
        DateTimePicker_kigen.TabIndex = 4
        ' 
        ' Label1
        ' 
        Label1.AutoSize = True
        Label1.Location = New Point(111, 45)
        Label1.Name = "Label1"
        Label1.Size = New Size(99, 15)
        Label1.TabIndex = 5
        Label1.Text = "パスワード有効期限"
        ' 
        ' Form_ChangePWD
        ' 
        AutoScaleDimensions = New SizeF(7F, 15F)
        AutoScaleMode = AutoScaleMode.Font
        ClientSize = New Size(444, 70)
        ControlBox = False
        Controls.Add(Label1)
        Controls.Add(DateTimePicker_kigen)
        Controls.Add(Button_CancelPwdChange)
        Controls.Add(Button_DoPwdChange)
        Controls.Add(TextBox_Password)
        Controls.Add(ComboBox_UserID)
        Icon = CType(resources.GetObject("$this.Icon"), Icon)
        MaximizeBox = False
        MdiChildrenMinimizedAnchorBottom = False
        MinimizeBox = False
        Name = "Form_ChangePWD"
        Text = "パスワードの強制変更"
        ResumeLayout(False)
        PerformLayout()
    End Sub

    Friend WithEvents ComboBox_UserID As ComboBox
    Friend WithEvents TextBox_Password As TextBox
    Friend WithEvents Button_DoPwdChange As Button
    Friend WithEvents Button_CancelPwdChange As Button
    Friend WithEvents DateTimePicker_kigen As DateTimePicker
    Friend WithEvents Label1 As Label
End Class
