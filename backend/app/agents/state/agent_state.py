from typing import Any, TypedDict


class AgentState(TypedDict, total=False):
    question: str
    user_id: str
    document_id: str

    planned_activities: list[str]
    user_approved: bool

    retrieved_chunks: list[Any]
    activity_results: dict[str, Any]

    answer: str
    sources: list[dict[str, Any]]

    error: str | None
    status: str