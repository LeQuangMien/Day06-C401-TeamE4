# src/tools/finance_tools.py

from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime, date
from typing import Any, Dict, List, Optional


DEFAULT_DATA_PATH = "codebase\\src\\data\\finance_data.json"


# -----------------------------
# Internal helpers
# -----------------------------

def _parse_date(value: Optional[str]) -> Optional[date]:
    """Parse YYYY-MM-DD date string. Return None if value is empty."""
    if value in (None, "", "null"):
        return None

    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError(f"Invalid date format '{value}'. Expected YYYY-MM-DD.") from exc


def _format_vnd(amount: float | int) -> str:
    """Format number as Vietnamese currency text."""
    amount_int = int(round(float(amount)))
    return f"{amount_int:,}".replace(",", ".") + " VND"


def _load_data(data_path: str = DEFAULT_DATA_PATH) -> Dict[str, Any]:
    path = Path(data_path)

    if not path.exists():
        return {
            "success": False,
            "error": "FILE_NOT_FOUND",
            "message": f"Finance data file not found: {data_path}",
        }

    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as exc:
        return {
            "success": False,
            "error": "JSON_READ_ERROR",
            "message": f"Invalid JSON file: {exc}",
        }

    if not isinstance(data, dict):
        return {
            "success": False,
            "error": "INVALID_DATA_SCHEMA",
            "message": "Finance data must be a JSON object.",
        }

    data.setdefault("user", {})
    data.setdefault("wallet", {})
    data.setdefault("transactions", [])
    data.setdefault("moni_notes", [])
    data.setdefault("saving_goals", [])

    return {
        "success": True,
        "data": data,
    }


def _save_data(data: Dict[str, Any], data_path: str = DEFAULT_DATA_PATH) -> Dict[str, Any]:
    path = Path(data_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with path.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as exc:
        return {
            "success": False,
            "error": "JSON_WRITE_ERROR",
            "message": f"Could not write finance data: {exc}",
        }

    return {
        "success": True,
        "message": "Finance data saved successfully.",
    }


def _get_transactions(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    transactions = data.get("transactions", [])
    if not isinstance(transactions, list):
        return []
    return [tx for tx in transactions if isinstance(tx, dict)]


def _filter_transactions(
    transactions: List[Dict[str, Any]],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    transaction_type: Optional[str] = None,
    merchant: Optional[str] = None,
) -> List[Dict[str, Any]]:
    start = _parse_date(start_date)
    end = _parse_date(end_date)

    category_norm = category.lower().strip() if category else None
    type_norm = transaction_type.lower().strip() if transaction_type else None
    merchant_norm = merchant.lower().strip() if merchant else None

    filtered = []

    for tx in transactions:
        tx_date_raw = tx.get("date")
        if not tx_date_raw:
            continue

        try:
            tx_date = _parse_date(tx_date_raw)
        except ValueError:
            continue

        if start and tx_date < start:
            continue

        if end and tx_date > end:
            continue

        if category_norm and str(tx.get("category", "")).lower().strip() != category_norm:
            continue

        if type_norm and str(tx.get("type", "")).lower().strip() != type_norm:
            continue

        if merchant_norm and merchant_norm not in str(tx.get("merchant", "")).lower():
            continue

        filtered.append(tx)

    filtered.sort(key=lambda item: item.get("date", ""))
    return filtered


def _sum_amount(transactions: List[Dict[str, Any]], tx_type: Optional[str] = None) -> float:
    total = 0.0

    for tx in transactions:
        if tx_type is not None and tx.get("type") != tx_type:
            continue

        try:
            total += float(tx.get("amount", 0))
        except (TypeError, ValueError):
            continue

    return total


# -----------------------------
# Public tools for ReAct agent
# -----------------------------

def get_current_balance(data_path: str = DEFAULT_DATA_PATH) -> Dict[str, Any]:
    """
    Get the user's current mock wallet balance from finance JSON.
    """

    loaded = _load_data(data_path)
    if not loaded["success"]:
        return loaded

    data = loaded["data"]
    wallet = data.get("wallet", {})
    balance = wallet.get("current_balance", 0)
    currency = data.get("user", {}).get("currency", "VND")

    try:
        balance_number = float(balance)
    except (TypeError, ValueError):
        return {
            "success": False,
            "error": "INVALID_BALANCE",
            "message": "Wallet current_balance must be a number.",
        }

    return {
        "success": True,
        "current_balance": int(balance_number),
        "current_balance_text": _format_vnd(balance_number) if currency == "VND" else f"{balance_number} {currency}",
        "currency": currency,
        "last_updated": wallet.get("last_updated"),
        "message": "Current balance loaded successfully.",
    }


def list_transactions(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    transaction_type: Optional[str] = None,
    merchant: Optional[str] = None,
    limit: int = 20,
    data_path: str = DEFAULT_DATA_PATH,
) -> Dict[str, Any]:
    """
    List transactions filtered by date range, category, type, or merchant.
    """

    loaded = _load_data(data_path)
    if not loaded["success"]:
        return loaded

    try:
        transactions = _filter_transactions(
            _get_transactions(loaded["data"]),
            start_date=start_date,
            end_date=end_date,
            category=category,
            transaction_type=transaction_type,
            merchant=merchant,
        )
    except ValueError as exc:
        return {
            "success": False,
            "error": "INVALID_DATE",
            "message": str(exc),
        }

    safe_limit = max(1, min(int(limit), 100))
    selected = transactions[:safe_limit]

    return {
        "success": True,
        "count": len(transactions),
        "returned": len(selected),
        "transactions": selected,
        "filters": {
            "start_date": start_date,
            "end_date": end_date,
            "category": category,
            "transaction_type": transaction_type,
            "merchant": merchant,
            "limit": safe_limit,
        },
        "message": f"Found {len(transactions)} transaction(s).",
    }


def get_transaction_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    data_path: str = DEFAULT_DATA_PATH,
) -> Dict[str, Any]:
    """
    Summarize income, expense, net change, and transaction count in a date range.
    """

    loaded = _load_data(data_path)
    if not loaded["success"]:
        return loaded

    try:
        transactions = _filter_transactions(
            _get_transactions(loaded["data"]),
            start_date=start_date,
            end_date=end_date,
            category=category,
        )
    except ValueError as exc:
        return {
            "success": False,
            "error": "INVALID_DATE",
            "message": str(exc),
        }

    total_income = _sum_amount(transactions, "income")
    total_expense = _sum_amount(transactions, "expense")
    net_change = total_income - total_expense

    return {
        "success": True,
        "transaction_count": len(transactions),
        "total_income": int(total_income),
        "total_expense": int(total_expense),
        "net_change": int(net_change),
        "total_income_text": _format_vnd(total_income),
        "total_expense_text": _format_vnd(total_expense),
        "net_change_text": _format_vnd(net_change),
        "filters": {
            "start_date": start_date,
            "end_date": end_date,
            "category": category,
        },
        "message": "Transaction summary calculated successfully.",
    }


def get_category_breakdown(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    data_path: str = DEFAULT_DATA_PATH,
) -> Dict[str, Any]:
    """
    Calculate expense breakdown by category in a date range.
    Only expense transactions are included.
    """

    loaded = _load_data(data_path)
    if not loaded["success"]:
        return loaded

    try:
        transactions = _filter_transactions(
            _get_transactions(loaded["data"]),
            start_date=start_date,
            end_date=end_date,
            transaction_type="expense",
        )
    except ValueError as exc:
        return {
            "success": False,
            "error": "INVALID_DATE",
            "message": str(exc),
        }

    breakdown: Dict[str, float] = {}
    total_expense = 0.0

    for tx in transactions:
        category = str(tx.get("category", "uncategorized"))
        try:
            amount = float(tx.get("amount", 0))
        except (TypeError, ValueError):
            continue

        breakdown[category] = breakdown.get(category, 0.0) + amount
        total_expense += amount

    categories = []
    for category, amount in sorted(breakdown.items(), key=lambda item: item[1], reverse=True):
        percent = (amount / total_expense * 100) if total_expense > 0 else 0
        categories.append(
            {
                "category": category,
                "amount": int(amount),
                "amount_text": _format_vnd(amount),
                "percent": round(percent, 2),
            }
        )

    return {
        "success": True,
        "total_expense": int(total_expense),
        "total_expense_text": _format_vnd(total_expense),
        "categories": categories,
        "transaction_count": len(transactions),
        "filters": {
            "start_date": start_date,
            "end_date": end_date,
        },
        "message": "Category breakdown calculated successfully.",
    }


def create_saving_plan(
    goal_amount: int | float,
    months: int,
    current_balance: Optional[int | float] = None,
    goal_name: str = "saving_goal",
    start_date: Optional[str] = None,
    data_path: str = DEFAULT_DATA_PATH,
    save_to_json: bool = False,
) -> Dict[str, Any]:
    """
    Create a simple saving plan.

    The plan calculates how much the user needs to save per month.
    If current_balance is provided, it also computes remaining amount.
    By default this tool only simulates the plan. Set save_to_json=True to persist.
    """

    try:
        goal_amount = float(goal_amount)
        months = int(months)
    except (TypeError, ValueError):
        return {
            "success": False,
            "error": "INVALID_ARGUMENT",
            "message": "goal_amount must be a number and months must be an integer.",
        }

    if goal_amount <= 0:
        return {
            "success": False,
            "error": "INVALID_GOAL_AMOUNT",
            "message": "goal_amount must be greater than 0.",
        }

    if months <= 0:
        return {
            "success": False,
            "error": "INVALID_MONTHS",
            "message": "months must be greater than 0.",
        }

    balance_used = 0.0
    if current_balance is not None:
        try:
            balance_used = max(0.0, float(current_balance))
        except (TypeError, ValueError):
            return {
                "success": False,
                "error": "INVALID_CURRENT_BALANCE",
                "message": "current_balance must be a number.",
            }

    remaining_amount = max(0.0, goal_amount - balance_used)
    monthly_required = remaining_amount / months
    weekly_required = monthly_required / 4
    daily_required = monthly_required / 30

    plan = {
        "id": f"G{int(datetime.now().timestamp())}",
        "goal_name": goal_name,
        "goal_amount": int(goal_amount),
        "goal_amount_text": _format_vnd(goal_amount),
        "current_balance_used": int(balance_used),
        "current_balance_used_text": _format_vnd(balance_used),
        "remaining_amount": int(remaining_amount),
        "remaining_amount_text": _format_vnd(remaining_amount),
        "months": months,
        "monthly_required": int(round(monthly_required)),
        "monthly_required_text": _format_vnd(monthly_required),
        "weekly_required": int(round(weekly_required)),
        "weekly_required_text": _format_vnd(weekly_required),
        "daily_required": int(round(daily_required)),
        "daily_required_text": _format_vnd(daily_required),
        "start_date": start_date,
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "status": "draft",
    }

    if save_to_json:
        loaded = _load_data(data_path)
        if not loaded["success"]:
            return loaded

        data = loaded["data"]
        data.setdefault("saving_goals", [])
        data["saving_goals"].append(plan)

        saved = _save_data(data, data_path)
        if not saved["success"]:
            return saved

    return {
        "success": True,
        "plan": plan,
        "saved": bool(save_to_json),
        "message": (
            f"To reach {plan['goal_amount_text']} in {months} month(s), "
            f"the user needs to save about {plan['monthly_required_text']} per month."
        ),
    }


def create_moni_note(
    note_type: str,
    content: str,
    amount: Optional[int | float] = None,
    date: Optional[str] = None,
    category: Optional[str] = None,
    data_path: str = DEFAULT_DATA_PATH,
) -> Dict[str, Any]:
    """
    Create a temporary Moni Note as fallback.

    This tool only creates a note in mock JSON. It does not execute any real transaction.
    """

    if not note_type or not str(note_type).strip():
        return {
            "success": False,
            "error": "INVALID_NOTE_TYPE",
            "message": "note_type is required.",
        }

    if not content or not str(content).strip():
        return {
            "success": False,
            "error": "INVALID_CONTENT",
            "message": "content is required.",
        }

    if date:
        try:
            _parse_date(date)
        except ValueError as exc:
            return {
                "success": False,
                "error": "INVALID_DATE",
                "message": str(exc),
            }

    parsed_amount = None
    if amount is not None:
        try:
            parsed_amount = int(float(amount))
        except (TypeError, ValueError):
            return {
                "success": False,
                "error": "INVALID_AMOUNT",
                "message": "amount must be a number if provided.",
            }

    loaded = _load_data(data_path)
    if not loaded["success"]:
        return loaded

    data = loaded["data"]
    data.setdefault("moni_notes", [])

    note = {
        "id": f"N{int(datetime.now().timestamp())}",
        "note_type": str(note_type).strip(),
        "content": str(content).strip(),
        "amount": parsed_amount,
        "amount_text": _format_vnd(parsed_amount) if parsed_amount is not None else None,
        "date": date,
        "category": category,
        "status": "draft",
        "created_at": datetime.now().isoformat(timespec="seconds"),
    }

    data["moni_notes"].append(note)

    saved = _save_data(data, data_path)
    if not saved["success"]:
        return saved

    return {
        "success": True,
        "note": note,
        "message": "Moni Note created successfully. This is only a temporary draft note.",
    }


# -----------------------------
# Ready-to-use tool registry
# -----------------------------

FINANCE_TOOLS = [
    {
        "name": "get_current_balance",
        "description": "Get the user's current mock wallet balance from finance JSON.",
        "func": get_current_balance,
    },
    {
        "name": "list_transactions",
        "description": (
            "List transactions filtered by start_date, end_date, category, "
            "transaction_type, or merchant."
        ),
        "func": list_transactions,
    },
    {
        "name": "get_transaction_summary",
        "description": (
            "Summarize total income, total expense, net change, and transaction count "
            "in a date range."
        ),
        "func": get_transaction_summary,
    },
    {
        "name": "get_category_breakdown",
        "description": "Calculate total spending by category in a date range.",
        "func": get_category_breakdown,
    },
    {
        "name": "create_saving_plan",
        "description": (
            "Create a simple saving plan from goal_amount, months, and optional current_balance."
        ),
        "func": create_saving_plan,
    },
    {
        "name": "create_moni_note",
        "description": (
            "Create a temporary Moni Note fallback. It only writes a draft note to mock JSON."
        ),
        "func": create_moni_note,
    },
]
