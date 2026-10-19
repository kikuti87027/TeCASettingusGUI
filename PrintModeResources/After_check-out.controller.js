'use strict';

var Common = require("../common/common.js");
var Const = require("../common/const.js");
var logger = require("../common/logger.js");

// 対象ファイル送信
export function index(req, res) {
	logger.startLog(req, "index");
	
	if (!req.body || !req.body.data) {
		Common.errorResponse(req, res, "W00013", ["parameter"]);
		return;
	}

	var headers = Common.createHeaders(req, res);
	if (!headers) {
		// セッション切れ
		return;
	}

	var parameters = req.body.data;
	Common.requestApi(req, Const.METHOD_POST, Const.PATH_FILES + "/pre-check-out", headers, parameters, 
		function(responseJson, state) {
			if (state != 200) {
				if (responseJson) {
					Common.errorResponseJson(req, res, responseJson);
				} else {
					Common.errorResponseState(req, res, state);
				}
				return;
			}
			// レスポンス
			var returnParam = responseJson;
			res.send(returnParam);
			logger.endLog(req, "index", JSON.stringify(returnParam));
		},
		function(error) {
			Common.errorResponseServerConnectError(req, res, error);
		}
	);
}

export function checkOut(req, res) {
	logger.startLog(req, "checkOut");

	if (!req.body) {
		Common.errorResponse(req, res, "W00013", ["parameter"]);
		// バイナリレスポンスのためエラーステータスを設定
		res.statusCode = 400;
		return;
	}

	var headers = Common.createHeaders(req, res);
	if (!headers) {
		// セッション切れ
		return;
	}

	// ヘッダー書き換え
	headers["Accept"] = "application/json, application/zip, application/octet-stream";

	var parameters = req.body.data;
	
	// CAD連携の有無に関係なく、常に requestApiBinary で生バイナリを取得して直接返す
	Common.requestApiBinary(req, Const.METHOD_POST, Const.PATH_FILES + "/check-out", headers, parameters, 
		function(buffer, state) {
			if (state != 200) {
				// バイナリレスポンスのためエラーステータスを設定
				res.statusCode = state;
				if (buffer) {
					res.send(buffer);
				} else {
					Common.errorResponseState(req, res, state);
				}
				return;
			}
			
			// 直接ブラウザへダウンロードさせるためのヘッダーとバイナリを返却
			res.setHeader("Content-Type", "application/octet-stream");
			
			// 単一ファイル/CAD連携時はファイル名を取得、複数ファイル（ZIP）時はデフォルト名を使用
			var fileName = req.body.cadFileName || "download.zip";
			var encodedFileName = encodeURIComponent(fileName);
			res.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + encodedFileName);
			
			// 実バイナリデータをブラウザへ送信
			res.send(buffer);
			logger.endLog(req, "checkOut", "");
		},
		function(error) {
			// バイナリレスポンスのためエラーステータスを設定
			res.statusCode = 500;
			Common.errorResponseServerConnectError(req, res, error);
		}
	);
}