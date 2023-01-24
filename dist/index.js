"use strict";
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
exports.Helius = void 0;
const axios_1 = __importDefault(require("axios"));
const API_URL_V0 = "https://api.helius.xyz/v0";
const API_URL_V1 = "https://api.heliuys.xyz/v1";
class Helius {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    getWebhooks() {
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
}
exports.Helius = Helius;
