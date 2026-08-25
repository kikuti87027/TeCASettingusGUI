'use strict';

var Common = require('../common/common.js');
var Const = require('../common/const.js');
var logger = require('../common/logger.js');

export function fileSave(req, res) {
	// [fileSave]開始処理
	logger.startLog(req, 'fileSave');

	var headers = Common.createHeaders(req, res);
	if (!headers) {
		// セッション切れ
		return;
	}

	var data = req.body.data;
	data['kosei'] = req.body.koseiData;
	data['kanren'] = req.body.kanrenData;
	var parameters = {};
	Common.requestApi(req, Const.METHOD_PUT, Const.PATH_MAIN_FILE + '/' + req.body.data.id, headers, data,
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
			// [fileSave]終了処理
			logger.endLog(req, 'fileSave', JSON.stringify(returnParam))
			res.send(returnParam);
		},
		function(error) {
			Common.errorResponseServerConnectError(req, res, error);
		}
	);
}

export function fileRemove(req, res) {
	// [fileRemove]開始処理
	logger.startLog(req, 'fileRemove');

	var headers = Common.createHeaders(req, res);
	if (!headers) {
		// セッション切れ
		return;
	}

	var body = {};
	body.id = req.body.data.id;
	body.updateTimestamp = req.body.data.updateTimestamp;

	var parameters = {};
	Common.requestApi(req, Const.METHOD_DELETE, Const.PATH_MAIN_FILE + '/' + req.body.data.id, headers, body,
		function(responseJson, state) {
			if (state != 204) {
				if (responseJson) {
					Common.errorResponseJson(req, res, responseJson);
				} else {
					Common.errorResponseState(req, res, state);
				}
				return;
			}
			// レスポンス
			var returnParam = {};
			// [fileRemove]終了処理
			logger.endLog(req, 'fileRemove', JSON.stringify(returnParam))
			res.send(returnParam);
		},
		function(error) {
			Common.errorResponseServerConnectError(req, res, error);
		}
	);
}

export function appLink(req, res) {
	// [appLink]開始処理
	logger.startLog(req, 'appLink');

	var headers = Common.createHeaders(req, res);
	if (!headers) {
		// セッション切れ
		return;
	}
	headers["Accept"] = "application/json, application/zip, application/octet-stream";
	var parameters = {};
	Common.requestApiBinary(req, Const.METHOD_GET, Const.PATH_MAIN_FILE + '/' + req.body.id + '/-1/original-file/-1/' + Const.DOWNLOAD_KBN_ORIGINAL, headers, parameters,
		function(buffer, state) {
			if (state != 200) {
				if (buffer) {
					buffer = JSON.parse(buffer);
					Common.errorResponseJson(req, res, buffer);
				} else {
					Common.errorResponseState(req, res, state);
				}
				return;
			}
			// 直接ブラウザへダウンロードさせるためのヘッダーとバイナリを返却
			res.setHeader("Content-Type", "application/octet-stream");
			var encodedFileName = encodeURIComponent(req.body.fileName);
			res.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + encodedFileName);
			
			res.send(buffer);
			logger.endLog(req, 'appLink', "");
		},
		function(error) {
			// バイナリレスポンスのためエラーステータスを設定
			res.statusCode = 500;
			Common.errorResponseServerConnectError(req, res, error);
		}
	);
}

export function pdfConvert(req, res) {
	// [pdfConvert]開始処理
	logger.startLog(req, 'pdfConvert');

	var headers = Common.createHeaders(req, res);
	if (!headers) {
		// セッション切れ
		return;
	}

	var parameters = {};
	Common.requestApi(req, Const.METHOD_POST, Const.PATH_MAIN_FILE + '/pdf-conversion/' + req.body.data.id, headers, parameters,
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
			var returnParam = {};
			// [pdfConvert]終了処理
			logger.endLog(req, 'pdfConvert', JSON.stringify(returnParam))
			res.send(returnParam);
		},
		function(error) {
			Common.errorResponseServerConnectError(req, res, error);
		}
	);
}

