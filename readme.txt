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