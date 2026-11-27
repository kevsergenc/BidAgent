warning: in the working copy of 'backend/app/agents/graph/agent_graph.py', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/backend/app/agents/graph/agent_graph.py b/backend/app/agents/graph/agent_graph.py[m
[1mindex 7e94820..99069d5 100644[m
[1m--- a/backend/app/agents/graph/agent_graph.py[m
[1m+++ b/backend/app/agents/graph/agent_graph.py[m
[36m@@ -1,12 +1,8 @@[m
[31m-from langgraph.graph import END, START, StateGraph[m
[32m+[m[32m﻿from langgraph.graph import END, START, StateGraph[m
 [m
 from app.agents.state.agent_state import AgentState[m
 from app.agents.planner.activity_planner import plan_activities[m
[31m-from app.agents.activities.detect_risks import execute_detect_risks[m
[31m-[m
[31m-from app.agents.activities.generate_answer import execute_generate_answer[m
[31m-from app.agents.activities.search_documents import execute_search_documents[m
[31m-from app.agents.activities.extract_requirements import execute_extract_requirements[m
[32m+[m[32mfrom app.mcp.client import call_mcp_tool[m
 [m
 [m
 ALLOWED_ACTIVITIES = {[m
[36m@@ -65,16 +61,12 @@[m [mdef validation_node(state: AgentState) -> dict:[m
                 "status": "unsupported",[m
             }[m
 [m
[31m-    return {[m
[31m-        "error": None,[m
[31m-        "status": "validated",[m
[31m-    }[m
[32m+[m[32m    return {"error": None, "status": "validated"}[m
 [m
 [m
 def route_after_validation(state: AgentState) -> str:[m
     if state.get("error"):[m
         return "finish"[m
[31m-[m
     return "execute"[m
 [m
 [m
[36m@@ -86,12 +78,16 @@[m [mdef execution_node(state: AgentState) -> dict:[m
         sources = [][m
 [m
         for activity in state["planned_activities"]:[m
[32m+[m[32m            common_args = {[m
[32m+[m[32m                "question": state["question"],[m
[32m+[m[32m                "user_id": state["user_id"],[m
[32m+[m[32m                "document_id": state["document_id"],[m
[32m+[m[32m            }[m
 [m
             if activity == "search_documents":[m
[31m-                result = execute_search_documents([m
[31m-                    question=state["question"],[m
[31m-                    user_id=state["user_id"],[m
[31m-                    document_id=state["document_id"],[m
[32m+[m[32m                result = call_mcp_tool([m
[32m+[m[32m                    tool_name="search_documents",[m
[32m+[m[32m                    **common_args,[m
                 )[m
 [m
                 retrieved_chunks = result["retrieved_chunks"][m
[36m@@ -106,10 +102,9 @@[m [mdef execution_node(state: AgentState) -> dict:[m
                 }[m
 [m
             elif activity == "extract_requirements":[m
[31m-                result = execute_extract_requirements([m
[31m-                    question=state["question"],[m
[31m-                    user_id=state["user_id"],[m
[31m-                    document_id=state["document_id"],[m
[32m+[m[32m                result = call_mcp_tool([m
[32m+[m[32m                    tool_name="extract_requirements",[m
[32m+[m[32m                    **common_args,[m
                     retrieved_chunks=retrieved_chunks or None,[m
                 )[m
 [m
[36m@@ -125,10 +120,9 @@[m [mdef execution_node(state: AgentState) -> dict:[m
                 activity_results[activity] = result[m
 [m
             elif activity == "detect_risks":[m
[31m-                result = execute_detect_risks([m
[31m-                    question=state["question"],[m
[31m-                    user_id=state["user_id"],[m
[31m-                    document_id=state["document_id"],[m
[32m+[m[32m                result = call_mcp_tool([m
[32m+[m[32m                    tool_name="detect_risks",[m
[32m+[m[32m                    **common_args,[m
                     retrieved_chunks=retrieved_chunks or None,[m
                 )[m
 [m
[36m@@ -144,10 +138,9 @@[m [mdef execution_node(state: AgentState) -> dict:[m
                 activity_results[activity] = result[m
 [m
             elif activity == "generate_answer":[m
[31m-                result = execute_generate_answer([m
[31m-                    question=state["question"],[m
[31m-                    user_id=state["user_id"],[m
[31m-                    document_id=state["document_id"],[m
[32m+[m[32m                result = call_mcp_tool([m
[32m+[m[32m                    tool_name="generate_answer",[m
[32m+[m[32m                    **common_args,[m
                     retrieved_chunks=retrieved_chunks or None,[m
                 )[m
 [m
[36m@@ -169,33 +162,22 @@[m [mdef execution_node(state: AgentState) -> dict:[m
         }[m
 [m
     except Exception as exc:[m
[31m-        return {[m
[31m-            "error": str(exc),[m
[31m-            "status": "failed",[m
[31m-        }[m
[32m+[m[32m        return {"error": str(exc), "status": "failed"}[m
 [m
 [m
 def build_agent_graph():[m
     workflow = StateGraph(AgentState)[m
[31m-[m
     workflow.add_node("planner", planning_node)[m
     workflow.add_node("validator", validation_node)[m
     workflow.add_node("executor", execution_node)[m
[31m-[m
     workflow.add_edge(START, "planner")[m
     workflow.add_edge("planner", "validator")[m
[31m-[m
     workflow.add_conditional_edges([m
         "validator",[m
         route_after_validation,[m
[31m-        {[m
[31m-            "execute": "executor",[m
[31m-            "finish": END,[m
[31m-        },[m
[32m+[m[32m        {"execute": "executor", "finish": END},[m
     )[m
[31m-[m
     workflow.add_edge("executor", END)[m
[31m-[m
     return workflow.compile()[m
 [m
 [m
[36m@@ -215,9 +197,4 @@[m [mdef run_agent([m
         "user_approved": user_approved,[m
         "status": "started",[m
     }[m
[31m-[m
     return agent_graph.invoke(initial_state)[m
[31m-[m
[31m-[m
[31m-[m
[31m-[m
