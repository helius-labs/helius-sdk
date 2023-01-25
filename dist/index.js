"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Helius = exports.Types = void 0;
const axios_1 = __importDefault(require("axios"));
const API_URL_V0 = "https://api.helius.xyz/v0";
const API_URL_V1 = "https://api.heliuys.xyz/v1";
exports.Types = __importStar(require("./types"));
class Helius {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    getAllWebhooks() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield axios_1.default.get(`${API_URL_V0}/webhooks?api-key=${this.apiKey}`);
                return data;
            }
            catch (err) {
                if (axios_1.default.isAxiosError(err)) {
                    throw new Error(`error calling getWebhooks: ${(_a = err.response) === null || _a === void 0 ? void 0 : _a.data.error}`);
                }
                else {
                    throw new Error(`error calling getWebhooks: ${err}`);
                }
            }
        });
    }
    getWebhookByID(webhookID) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield axios_1.default.get(`${API_URL_V0}/webhooks/${webhookID}?api-key=${this.apiKey}`);
                return data;
            }
            catch (err) {
                if (axios_1.default.isAxiosError(err)) {
                    throw new Error(`error during getWebhookByID: ${(_a = err.response) === null || _a === void 0 ? void 0 : _a.data.error}`);
                }
                else {
                    throw new Error(`error during getWebhookByID: ${err}`);
                }
            }
        });
    }
    createWebhook(createWebhookRequest) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield axios_1.default.post(`${API_URL_V0}/webhooks?api-key=${this.apiKey}`, Object.assign({}, createWebhookRequest));
                return data;
            }
            catch (err) {
                if (axios_1.default.isAxiosError(err)) {
                    throw new Error(`error during createWebhook: ${(_a = err.response) === null || _a === void 0 ? void 0 : _a.data.error}`);
                }
                else {
                    throw new Error(`error during createWebhook: ${err}`);
                }
            }
        });
    }
    deleteWebhook(webhookID) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield axios_1.default.delete(`${API_URL_V0}/webhooks/${webhookID}?api-key=${this.apiKey}`);
                return true;
            }
            catch (err) {
                if (axios_1.default.isAxiosError(err)) {
                    throw new Error(`error during deleteWebhook: ${(_a = err.response) === null || _a === void 0 ? void 0 : _a.data.error}`);
                }
                else {
                    throw new Error(`error during deleteWebhook: ${err}`);
                }
            }
        });
    }
    editWebhook(webhookID, editWebhookRequest) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const webhook = yield this.getWebhookByID(webhookID);
                const { data } = yield axios_1.default.put(`${API_URL_V0}/webhooks/${webhookID}?api-key=${this.apiKey}`, Object.assign(Object.assign({}, webhook), editWebhookRequest));
                return data;
            }
            catch (err) {
                if (axios_1.default.isAxiosError(err)) {
                    throw new Error(`error during editWebhook: ${(_a = err.response) === null || _a === void 0 ? void 0 : _a.data.error}`);
                }
                else {
                    throw new Error(`error during editWebhook: ${err}`);
                }
            }
        });
    }
    appendAddressesToWebhook(webhookID, newAccountAddresses) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const webhook = yield this.getWebhookByID(webhookID);
                const accountAddresses = webhook.accountAddresses.concat(newAccountAddresses);
                webhook.accountAddresses = accountAddresses;
                if (accountAddresses.length > 10000) {
                    throw new Error(`a single webhook cannot contain more than 10,000 addresses`);
                }
                const { data } = yield axios_1.default.put(`${API_URL_V0}/webhooks/${webhookID}?api-key=${this.apiKey}`, Object.assign({}, webhook));
                return data;
            }
            catch (err) {
                if (axios_1.default.isAxiosError(err)) {
                    throw new Error(`error during appendAddressesToWebhook: ${(_a = err.response) === null || _a === void 0 ? void 0 : _a.data.error}`);
                }
                else {
                    throw new Error(`error during appendAddressesToWebhook: ${err}`);
                }
            }
        });
    }
}
exports.Helius = Helius;
