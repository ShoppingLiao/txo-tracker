"""富邦 fubon_neo SDK login + marketdata REST client 取得。

Lazy login - 第一次 call 才登入,後續 reuse。
此模組只負責 SDK 連線,不關心抓什麼資料。

需要 .env:
  FUBON_USER_ID
  FUBON_PASSWORD
  FUBON_CERT_PATH      (絕對路徑到 .pfx,放在使用者個人資料夾即可)
  FUBON_CERT_PASSWORD
"""

from __future__ import annotations

import os
from typing import Any

from loguru import logger


class FubonNotConfigured(Exception):
    pass


class FubonLoginFailed(Exception):
    pass


_sdk: Any = None
_account: Any = None
_realtime_inited: bool = False


def _check_env() -> None:
    required = ["FUBON_USER_ID", "FUBON_PASSWORD", "FUBON_CERT_PATH", "FUBON_CERT_PASSWORD"]
    missing = [k for k in required if not os.getenv(k)]
    if missing:
        raise FubonNotConfigured(f"缺 env: {missing}")
    cert = os.getenv("FUBON_CERT_PATH", "")
    cert = os.path.expanduser(cert)
    if not os.path.exists(cert):
        raise FubonNotConfigured(f"找不到憑證檔 {cert}")


def ensure_login() -> tuple[Any, Any]:
    """登入並回 (sdk, account)。"""
    global _sdk, _account
    if _sdk is not None and _account is not None:
        return _sdk, _account

    _check_env()

    try:
        from fubon_neo.sdk import FubonSDK
    except ImportError as e:
        raise FubonNotConfigured(
            "fubon_neo 未安裝。從 https://www.fbs.com.tw/TradeAPI/docs/download/download-sdk "
            "下載對應平台的 .whl 後 pip install"
        ) from e

    sdk = FubonSDK()
    res = sdk.login(
        os.getenv("FUBON_USER_ID"),
        os.getenv("FUBON_PASSWORD"),
        os.path.expanduser(os.getenv("FUBON_CERT_PATH", "")),
        os.getenv("FUBON_CERT_PASSWORD"),
    )
    if not res.is_success:
        raise FubonLoginFailed(f"login failed: {getattr(res, 'message', 'unknown')}")
    if not res.data:
        raise FubonLoginFailed("login ok but no account data")

    _sdk = sdk
    _account = res.data[0]
    logger.info(f"富邦 login 成功 account={getattr(_account, 'account', '?')}")
    return _sdk, _account


def get_marketdata_clients() -> tuple[Any, Any]:
    """回 (reststock, restfut)。第一次 call 會 init_realtime。"""
    global _realtime_inited
    sdk, _ = ensure_login()
    if not _realtime_inited:
        sdk.init_realtime()
        _realtime_inited = True
        logger.info("init_realtime 完成")
    return sdk.marketdata.rest_client.stock, sdk.marketdata.rest_client.futopt
