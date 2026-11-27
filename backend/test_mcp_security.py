import asyncio
import os
import sys

from mcp import Client
from mcp.client.stdio import StdioServerParameters

async def main():
    env = os.environ.copy()
    env["BIDAGENT_MCP_USER_ID"] = "invalid-test-user"
    env["BIDAGENT_MCP_DOCUMENT_ID"] = "invalid-test-document"

    params = StdioServerParameters(
        command=sys.executable,
        args=["-m", "app.mcp.server"],
        cwd=".",
        env=env,
    )

    async with Client(params) as client:
        result = await client.call_tool(
            "search_documents",
            {"question": "Teslim süresi nedir?"},
        )

        print("IS ERROR:", result.is_error)
        print("RESPONSE:", result.structured_content or result.content)

asyncio.run(main())
