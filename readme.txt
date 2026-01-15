★★★実装履歴★★★

25-03-13　Ver3.0.0　【ダイアログデザイン】タブ化
							・ダイアログのデザインをタブ化し、見やすくしました。

25-05-27　Ver3.0.1　【kikuchi.dll/DOSEXEargs修正】　
							・処理中にPostgreSQLのWORK_MEMを最大化し、終わったら最適化。
							・PostgreSQLの停止処理をサービス強制終了からpg_ctl stopに変更。

25-06-26　Ver3.1.1　【PDFConverter.properties】
                            ・PDFConverter.propertiesでtif/tiffの識別が出来ていない部分を訂正。
							・7つの拡張子型全てがファイル内に記述されていない場合のエラー表示アラートを平易にした               

25-11-06　Ver3.1.2　【ログインタイムアウト】
                            ・beans.xmlの読取ができず、120分以上野設定が出来ない不具合の訂正
							・上記に合わせ、FormLoad時の現ログインタイムアウト値の誤表示も訂正

25-11-14　Ver3.1.3　【1.15.0対応】
                            ・OSSインストールパス、OSSサービス名、プロセス名の変更に伴う修正
                            ・公開制御系：バンドルリソース（main.html）の1.15.0.0用を追加
							　※　1.15.0.0以後、VerNumberオクテットが4個に増えているのでファイル名注意
25-11-14　Ver3.1.4　【1.15.0対応の小変更】
							・【Nuget.Npgsql】　kikuchi.dllでの採用Ver9.0.4に合わせた。
							・【ログインタイムアウト】設定上限(720分)をTeCACMDの設定上限（360分）にそろえた。
							　　同コンボの選択肢が実行ごとに増えてしまう動作も抑制。
25-11-14　Ver3.1.5　【PDFConvertバグ対応】
							・【kikuchi.dll】Misc.ConvertBOMFileToNoBOM  を実装し、
							　　　PDF変換時にPDF＿Convert.Propertiesの1行目で定義したファイル形式が変換エラーになる不具合を修正。

25-11-26　Ver3.1.5.1　【認証パスワード追加】
							・SupervisorModeの認証パスワードを、[ZUNOsypervisors]も追加。対応するIDはphotronのまま。

25-12-01　Ver3.1.5.2　【1.15.1対応】
							・公開機能差し替え用main.htmlの該当バージョン版のリソース添付。

25-12-15　Ver3.1.5.3　【1.15.0 FIX対応】
							・1.15.0FIXによりtomcat更新確認用(1.15.0.1）は抹消となったので、公開機能差し替え用main.htmlの
							　1.15.0.1用を抹消し、1.15.0化しリソース添付。
							