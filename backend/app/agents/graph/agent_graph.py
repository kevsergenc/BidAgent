from langgraph.graph import END, START, StateGraph

from app.agents.state.agent_state import AgentState
from app.agents.planner.activity_planner import plan_activities
from app.agents.activities.detect_risks import execute_detect_risks

from app.agents.activities.generate_answer import execute_generate_answer
from app.agents.activities.search_documents import execute_search_documents
from app.agents.activities.extract_requirements import execute_extract_requirements


ALLOWED_ACTIVITIES = {
    "search_documents",
    "extract_requirements",
    "check_documents",
    "detect_risks",
    "compare_documents",
    "generate_answer",
    "generate_report",
    "save_output",
}

SUPPORTED_ACTIVITIES = {
    "search_documents",
    "extract_requirements",
    "generate_answer",
    "detect_risks",
}


def planning_node(state: AgentState) -> dict:
    activities = plan_activities(state["question"])

    return {
        "planned_activities": activities,
        "status": "planned",
    }


def validation_node(state: AgentState) -> dict:
    activities = state.get("planned_activities", [])

    if not activities:
        return {
            "error": "Planlama sonucunda çalıştırılacak aktivite bulunamadı.",
            "status": "rejected",
        }

    for activity in activities:
        if activity not in ALLOWED_ACTIVITIES:
            return {
                "error": f"İzin verilmeyen aktivite: {activity}",
                "status": "rejected",
            }

        if activity == "save_output" and not state.get("user_approved", False):
            return {
                "error": "save_output aktivitesi için kullanıcı onayı gerekiyor.",
                "status": "approval_required",
            }

        if activity not in SUPPORTED_ACTIVITIES:
            return {
                "error": f"Henüz uygulanmamış aktivite: {activity}",
                "status": "unsupported",
            }

    return {
        "error": None,
        "status": "validated",
    }


def route_after_validation(state: AgentState) -> str:
    if state.get("error"):
        return "finish"

    return "execute"


def execution_node(state: AgentState) -> dict:
    try:
        retrieved_chunks = []
        activity_results = {}
        answer_parts = []
        sources = []

        for activity in state["planned_activities"]:

            if activity == "search_documents":
                result = execute_search_documents(
                    question=state["question"],
                    user_id=state["user_id"],
                    document_id=state["document_id"],
                )

                retrieved_chunks = result["retrieved_chunks"]

                for source in result["sources"]:
                    if source not in sources:
                        sources.append(source)

                activity_results[activity] = {
                    "chunk_count": result["chunk_count"],
                    "sources": result["sources"],
                }

            elif activity == "extract_requirements":
                result = execute_extract_requirements(
                    question=state["question"],
                    user_id=state["user_id"],
                    document_id=state["document_id"],
                    retrieved_chunks=retrieved_chunks or None,
                )

                answer_parts.append(
                    "TEKNİK GEREKLİLİKLER\n\n"
                    + result["requirements"]
                )

                for source in result["sources"]:
                    if source not in sources:
                        sources.append(source)

                activity_results[activity] = result

            elif activity == "detect_risks":
                result = execute_detect_risks(
                    question=state["question"],
                    user_id=state["user_id"],
                    document_id=state["document_id"],
                    retrieved_chunks=retrieved_chunks or None,
                )

                answer_parts.append(
                    "RİSK ANALİZİ\n\n"
                    + result["risks"]
                )

                for source in result["sources"]:
                    if source not in sources:
                        sources.append(source)

                activity_results[activity] = result

            elif activity == "generate_answer":
                result = execute_generate_answer(
                    question=state["question"],
                    user_id=state["user_id"],
                    document_id=state["document_id"],
                    retrieved_chunks=retrieved_chunks or None,
                )

                answer_parts.append(result["answer"])

                for source in result["sources"]:
                    if source not in sources:
                        sources.append(source)

                activity_results[activity] = result

        return {
            "retrieved_chunks": retrieved_chunks,
            "activity_results": activity_results,
            "answer": "\n\n".join(answer_parts),
            "sources": sources,
            "status": "completed",
            "error": None,
        }

    except Exception as exc:
        return {
            "error": str(exc),
            "status": "failed",
        }


def build_agent_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("planner", planning_node)
    workflow.add_node("validator", validation_node)
    workflow.add_node("executor", execution_node)

    workflow.add_edge(START, "planner")
    workflow.add_edge("planner", "validator")

    workflow.add_conditional_edges(
        "validator",
        route_after_validation,
        {
            "execute": "executor",
            "finish": END,
        },
    )

    workflow.add_edge("executor", END)

    return workflow.compile()


agent_graph = build_agent_graph()


def run_agent(
    question: str,
    user_id: str,
    document_id: str,
    user_approved: bool = False,
) -> dict:
    initial_state: AgentState = {
        "question": question,
        "user_id": user_id,
        "document_id": document_id,
        "user_approved": user_approved,
        "status": "started",
    }

    return agent_graph.invoke(initial_state)




