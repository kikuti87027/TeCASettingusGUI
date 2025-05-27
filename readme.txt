★★★実装履歴★★★

25-05-27　Ver3.0.1　【kikuchi.dll/DOSEXEargs修正】　
							・処理中にPostgreSQLのWORK_MEMを最大化し、終わったら最適化。
							・PostgreSQLの停止処理をサービス強制終了からpg_ctl stopに変更。