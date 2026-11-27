from langgraph.graph import END, START, StateGraph

from app.agents.state.agent_state import AgentState
from app.agents.planner.activity_planner import plan_activities
from app.mcp.client import call_mcp_tool


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

    return {"error": None, "status": "validated"}


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

        planned_activities = state["planned_activities"]
        has_generate_answer = "generate_answer" in planned_activities

        for activity in planned_activities:
            common_args = {
                "question": state["question"],
                "user_id": state["user_id"],
                "document_id": state["document_id"],
            }

            if activity == "search_documents":
                result = call_mcp_tool(
                    tool_name="search_documents",
                    **common_args,
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
                result = call_mcp_tool(
                    tool_name="extract_requirements",
                    **common_args,
                    retrieved_chunks=retrieved_chunks or None,
                )

                if not has_generate_answer:
                    answer_parts.append(
                        "TEKNİK GEREKLİLİKLER\n\n"
                        + result["requirements"]
                    )

                for source in result["sources"]:
                    if source not in sources:
                        sources.append(source)

                activity_results[activity] = result

            elif activity == "detect_risks":
                result = call_mcp_tool(
                    tool_name="detect_risks",
                    **common_args,
                    retrieved_chunks=retrieved_chunks or None,
                )

                if not has_generate_answer:
                    answer_parts.append(
                        "RİSK ANALİZİ\n\n"
                        + result["risks"]
                    )

                for source in result["sources"]:
                    if source not in sources:
                        sources.append(source)

                activity_results[activity] = result

            elif activity == "generate_answer":
                analysis_context = {
                    "requirements": activity_results.get(
                        "extract_requirements", {}
                    ).get("requirements", ""),
                    "risks": activity_results.get(
                        "detect_risks", {}
                    ).get("risks", ""),
                }

                if not any(analysis_context.values()):
                    analysis_context = None

                result = call_mcp_tool(
                    tool_name="generate_answer",
                    **common_args,
                    retrieved_chunks=retrieved_chunks or None,
                    analysis_context=analysis_context,
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
        return {"error": str(exc), "status": "failed"}


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
        {"execute": "executor", "finish": END},
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
