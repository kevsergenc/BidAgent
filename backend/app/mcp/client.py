import asyncio
import os
import sys
from pathlib import Path
from typing import Any

from mcp import Client
from mcp.client.stdio import StdioServerParameters


BACKEND_DIR = Path(__file__).resolve().parents[2]


async def _call_mcp_tool(
    tool_name: str,
    question: str,
    user_id: str,
    document_id: str,
    retrieved_chunks: list[dict[str, Any]] | None = None,
    analysis_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    env = os.environ.copy()
    env["BIDAGENT_MCP_USER_ID"] = user_id
    env["BIDAGENT_MCP_DOCUMENT_ID"] = document_id

    params = StdioServerParameters(
        command=sys.executable,
        args=["-m", "app.mcp.server"],
        cwd=str(BACKEND_DIR),
        env=env,
    )

    arguments: dict[str, Any] = {"question": question}

    if retrieved_chunks is not None:
        arguments["retrieved_chunks"] = retrieved_chunks

    if analysis_context is not None:
        arguments["analysis_context"] = analysis_context

    async with Client(params) as client:
        result = await client.call_tool(tool_name, arguments)

        if result.is_error:
            error_text = "; ".join(
                item.text
                for item in result.content
                if hasattr(item, "text")
            )
            raise RuntimeError(
                error_text or f"MCP aracı başarısız oldu: {tool_name}"
            )

        if result.structured_content is not None:
            return result.structured_content

        raise RuntimeError(
            f"MCP aracı yapılandırılmış sonuç döndürmedi: {tool_name}"
        )


def call_mcp_tool(
    tool_name: str,
    question: str,
    user_id: str,
    document_id: str,
    retrieved_chunks: list[dict[str, Any]] | None = None,
    analysis_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return asyncio.run(
        _call_mcp_tool(
            tool_name=tool_name,
            question=question,
            user_id=user_id,
            document_id=document_id,
            retrieved_chunks=retrieved_chunks,
            analysis_context=analysis_context,
        )
    )


