Imports System.IO
Imports System.ServiceProcess
Imports System.Text
Imports TeCASettings.TECA_sets
Imports TeCASettings.TRIGGERS

Public Class Form_ChangePWD
    Dim Dt_m_user As New DataTable

    Private Sub Form_ChangePWD_Load(sender As Object, e As EventArgs) Handles Me.Load
        '--------------------------------------
        '[db1.m_user]のSELECT結果を【Dt_m_user】に格納 →　UserIDコンボへ
        '--------------------------------------
        Dim SQLCMD As String = "SELECT id,login_id,password_valid_kigen FROM m_user WHERE kaisha_id=1 and del_flg=false and login_id <> 'admin' ORDER by login_id ASC "

        Dim m_user_msg As String = TeCA.DBtoDTBL(connStr, SQLCMD, Dt_m_user)
        If (m_user_msg.Length > 5) Then
            MessageBox.Show("[DT_systemInfo]" & m_user_msg.ToString)
            Exit Sub
        End If

        For Each rows As DataRow In Dt_m_user.Rows
            Dim login_id As String = rows("login_id").ToString()
            ComboBox_UserID.Items.Add(login_id) ' コンボボックスに追加
        Next

        ComboBox_UserID.DropDownStyle = ComboBoxStyle.DropDownList
    End Sub

    Private Sub ComboBox_UserID_SelectedIndexChanged(sender As Object, e As EventArgs) Handles ComboBox_UserID.SelectedIndexChanged
        Dim rows As DataRow() = Dt_m_user.Select("login_id='" & ComboBox_UserID.Text.Replace("'", "''") & "'")

        If rows.Length > 0 AndAlso Not IsDBNull(rows(0)("password_valid_kigen")) Then
            Dim rawValue = rows(0)("password_valid_kigen")

            ' DateOnly型の場合と、それ以外（DateTime型など）で処理を分ける
            If TypeOf rawValue Is DateOnly Then
                ' DateOnly を DateTime(Date) に変換
                Dim dOnly As DateOnly = DirectCast(rawValue, DateOnly)
                DateTimePicker_kigen.Value = New Date(dOnly.Year, dOnly.Month, dOnly.Day)
            Else
                ' 従来通りのキャスト
                DateTimePicker_kigen.Value = CDate(rawValue)
            End If
        Else
            ' 値が無い場合、今日の今日の日付にする
            DateTimePicker_kigen.Value = DateTime.Today
        End If
    End Sub

    Private Sub Button_DolPwdChange_click(sender As Object, e As EventArgs) Handles Button_DoPwdChange.Click
        Dim hasedPassword As String = TeCASettings.TXTFunc.HashPassword(TextBox_Password.Text)
        If Not hasedPassword.Contains("ERROR") Then
            Dim sql1 As String = $"UPDATE m_user SET password='{hasedPassword}' WHERE login_id='{ComboBox_UserID.Text}' AND kaisha_id=1;"
            Dim sql2 As String = $"UPDATE m_user SET password_valid_kigen='{DateTimePicker_kigen.Value.ToString("yyyy-MM-dd")}' WHERE login_id='{ComboBox_UserID.Text}' AND kaisha_id=1;"

            Dim msg_SQL As String = TeCA.RunSQLUnified(sql1, connStr) & vbCrLf
            msg_SQL += TeCA.RunSQLUnified(sql2, connStr)
            MessageBox.Show($"パスワードを変更しました。以下の[OK]押下後は、この設定ツールの実行ボタンは押さず、そのまま終了できます。")
        Else
            MessageBox.Show($"パスワードの再登録に失敗しました。異なるパスワードで再試行してください。")
        End If
        Me.Close()
    End Sub

    Private Sub Button_CancelPwdChange_click(sender As Object, e As EventArgs) Handles Button_CancelPwdChange.Click
        Me.Close()
        Exit Sub
    End Sub
End Class